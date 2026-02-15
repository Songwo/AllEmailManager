import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { decryptPassword } from '@/lib/encryption'
import dns from 'dns'
import net from 'net'
import tls from 'tls'
import Imap from 'imap'

export const dynamic = 'force-dynamic'

interface DiagStep {
  name: string
  status: 'success' | 'error' | 'skipped'
  message: string
  duration: number
}

function dnsLookup(host: string): Promise<{ addresses: string[]; duration: number }> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    dns.resolve4(host, (err, addresses) => {
      const duration = Date.now() - start
      if (err) reject({ error: err, duration })
      else resolve({ addresses, duration })
    })
  })
}

function testTcpPort(host: string, port: number, timeout = 10000): Promise<{ duration: number }> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout })
    socket.once('connect', () => {
      const duration = Date.now() - start
      socket.destroy()
      resolve({ duration })
    })
    socket.once('timeout', () => {
      const duration = Date.now() - start
      socket.destroy()
      reject({ code: 'TIMEOUT', duration })
    })
    socket.once('error', (err: any) => {
      const duration = Date.now() - start
      reject({ code: err.code, error: err, duration })
    })
  })
}

function testTlsConnection(host: string, port: number, timeout = 10000): Promise<{ protocol: string; duration: number }> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port, rejectUnauthorized: false, timeout },
      () => {
        const duration = Date.now() - start
        const protocol = socket.getProtocol() || 'unknown'
        socket.destroy()
        resolve({ protocol, duration })
      }
    )
    socket.once('timeout', () => {
      const duration = Date.now() - start
      socket.destroy()
      reject({ code: 'TIMEOUT', duration })
    })
    socket.once('error', (err: any) => {
      const duration = Date.now() - start
      reject({ code: err.code, error: err, duration })
    })
  })
}

function testImapAuth(
  email: string, password: string, host: string, port: number
): Promise<{ capabilities: string[]; duration: number }> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password,
      host,
      port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 15000,
      authTimeout: 15000
    })

    imap.once('ready', () => {
      const duration = Date.now() - start
      const caps = (imap as any)._caps || []
      const capabilities = Array.isArray(caps) ? caps.map(String) : []
      imap.end()
      resolve({ capabilities, duration })
    })

    imap.once('error', (err: Error) => {
      const duration = Date.now() - start
      reject({ error: err, duration })
    })

    imap.connect()
  })
}

function classifyImapError(errorMsg: string, provider: string): string {
  const msg = errorMsg.toLowerCase()

  if (msg.includes('login denied') || msg.includes('login failed') || msg.includes('invalid credentials')) {
    if (provider === '163' || provider === '163 Mail' || provider === '126' || provider === '126 Mail') {
      return '认证失败 - 请确认: 1) 已在邮箱设置中开启IMAP服务; 2) 使用的是授权码而非登录密码; 3) 授权码未过期或被撤销'
    }
    if (provider === 'QQ' || provider === 'QQ Mail') {
      return '认证失败 - 请确认: 1) 已在QQ邮箱设置中开启IMAP服务; 2) 使用的是授权码而非QQ密码'
    }
    if (provider === 'Gmail') {
      return '认证失败 - 请确认: 1) 已启用两步验证; 2) 使用的是应用专用密码而非Gmail密码'
    }
    return '认证失败 - 请检查邮箱密码/授权码是否正确，以及IMAP服务是否已开启'
  }

  if (msg.includes('authentication failed')) {
    return '认证失败 - 用户名或密码/授权码错误'
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return '连接超时 - 服务器响应过慢，可能是网络问题或服务器繁忙'
  }

  if (msg.includes('econnrefused')) {
    return '连接被拒绝 - IMAP端口未开放或防火墙阻止了连接'
  }

  if (msg.includes('econnreset')) {
    return '连接被重置 - 服务器主动断开，可能是IP被限制或SSL配置问题'
  }

  if (msg.includes('enotfound') || msg.includes('getaddrinfo')) {
    return 'DNS解析失败 - 无法解析主机名，请检查IMAP服务器地址'
  }

  if (msg.includes('certificate') || msg.includes('ssl') || msg.includes('tls')) {
    return 'SSL/TLS错误 - 证书验证失败'
  }

  return `连接失败: ${errorMsg}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.emailAccount.findFirst({
      where: { id, userId: user.userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const password = decryptPassword(account.encryptedPassword)
    const steps: DiagStep[] = []
    let overallStatus: 'success' | 'error' = 'success'
    let suggestion = ''

    // Step 1: DNS Resolution
    try {
      const dnsResult = await dnsLookup(account.imapHost)
      steps.push({
        name: 'DNS解析',
        status: 'success',
        message: `${account.imapHost} -> ${dnsResult.addresses.join(', ')}`,
        duration: dnsResult.duration
      })
    } catch (err: any) {
      overallStatus = 'error'
      steps.push({
        name: 'DNS解析',
        status: 'error',
        message: `无法解析 ${account.imapHost} - 请检查IMAP服务器地址是否正确`,
        duration: err.duration || 0
      })
      suggestion = '请检查IMAP服务器地址是否拼写正确。'
      return NextResponse.json({ steps, overall: overallStatus, suggestion })
    }

    // Step 2: TCP Port Connectivity
    try {
      const tcpResult = await testTcpPort(account.imapHost, account.imapPort)
      steps.push({
        name: '端口连接',
        status: 'success',
        message: `端口 ${account.imapPort} 已开放 (${tcpResult.duration}ms)`,
        duration: tcpResult.duration
      })
    } catch (err: any) {
      overallStatus = 'error'
      const msg = err.code === 'TIMEOUT'
        ? `连接端口 ${account.imapPort} 超时 - 可能被防火墙阻止`
        : err.code === 'ECONNREFUSED'
          ? `端口 ${account.imapPort} 连接被拒绝 - 端口未开放或服务未启动`
          : `端口 ${account.imapPort} 连接失败: ${err.code || '未知错误'}`
      steps.push({
        name: '端口连接',
        status: 'error',
        message: msg,
        duration: err.duration || 0
      })
      suggestion = `请确认IMAP端口 ${account.imapPort} 正确且未被防火墙阻止。常见端口: 993 (SSL), 143 (非SSL)。`
      return NextResponse.json({ steps, overall: overallStatus, suggestion })
    }

    // Step 3: TLS/SSL Handshake
    try {
      const tlsResult = await testTlsConnection(account.imapHost, account.imapPort)
      steps.push({
        name: 'SSL/TLS握手',
        status: 'success',
        message: `协议: ${tlsResult.protocol}`,
        duration: tlsResult.duration
      })
    } catch (err: any) {
      overallStatus = 'error'
      steps.push({
        name: 'SSL/TLS握手',
        status: 'error',
        message: `SSL握手失败: ${err.code || '未知错误'} - 可能不支持SSL或端口不正确`,
        duration: err.duration || 0
      })
      suggestion = '请确认端口支持SSL/TLS。端口993通常使用SSL，端口143通常为明文。'
      return NextResponse.json({ steps, overall: overallStatus, suggestion })
    }

    // Step 4: IMAP Authentication
    try {
      const authResult = await testImapAuth(account.email, password, account.imapHost, account.imapPort)
      const hasIdle = authResult.capabilities.some(c => c.toUpperCase() === 'IDLE')
      steps.push({
        name: 'IMAP认证',
        status: 'success',
        message: `认证成功 (${authResult.duration}ms)`,
        duration: authResult.duration
      })

      // Step 5: IDLE capability check
      steps.push({
        name: 'IDLE支持',
        status: 'success',
        message: hasIdle
          ? '支持IDLE实时推送，新邮件将通过IDLE+轮询双通道检测'
          : '不支持IDLE，将使用UID高频轮询 (30-60s) 准实时获取新邮件',
        duration: 0
      })

      suggestion = hasIdle
        ? '所有检测通过，邮箱支持IDLE实时推送。'
        : '所有检测通过。此邮箱不支持IDLE（如163邮箱），系统将使用基于UID的智能轮询（30-60秒）准实时获取新邮件并自动推送。'

      // Update account status to connected on successful test
      await prisma.emailAccount.update({
        where: { id },
        data: {
          status: 'connected',
          errorMessage: null,
          lastHeartbeatAt: new Date()
        }
      })
    } catch (err: any) {
      overallStatus = 'error'
      const errorMsg = err.error?.message || String(err.error || '未知错误')
      const classified = classifyImapError(errorMsg, account.provider)
      steps.push({
        name: 'IMAP认证',
        status: 'error',
        message: classified,
        duration: err.duration || 0
      })

      steps.push({
        name: 'IDLE支持',
        status: 'skipped',
        message: '认证失败，跳过检测',
        duration: 0
      })

      suggestion = classified

      // Update account with error info
      await prisma.emailAccount.update({
        where: { id },
        data: {
          status: 'error',
          errorMessage: classified
        }
      })
    }

    return NextResponse.json({ steps, overall: overallStatus, suggestion })
  } catch (error: any) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test connection' },
      { status: 500 }
    )
  }
}
