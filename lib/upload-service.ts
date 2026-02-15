// ============================================================================
// Upload service – handles local file storage for email attachments
// ============================================================================

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { createLogger } from './logger'

const log = createLogger('upload-service')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10) // 10 MB

export interface UploadedFile {
  id: string
  originalName: string
  storedPath: string
  mimeType: string
  size: number
}

async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${buffer.length} bytes (max ${MAX_FILE_SIZE})`)
  }

  await ensureUploadDir()

  const id = crypto.randomUUID()
  const ext = path.extname(originalName) || ''
  const storedName = `${id}${ext}`
  const storedPath = path.join(UPLOAD_DIR, storedName)

  await fs.writeFile(storedPath, buffer)
  log.info('File saved', { id, originalName, size: buffer.length })

  return { id, originalName, storedPath, mimeType, size: buffer.length }
}

export async function getFile(id: string, ext: string): Promise<Buffer | null> {
  const storedPath = path.join(UPLOAD_DIR, `${id}${ext}`)
  try {
    return await fs.readFile(storedPath)
  } catch {
    return null
  }
}

export async function deleteFile(id: string, ext: string): Promise<boolean> {
  const storedPath = path.join(UPLOAD_DIR, `${id}${ext}`)
  try {
    await fs.unlink(storedPath)
    log.info('File deleted', { id })
    return true
  } catch {
    return false
  }
}

/**
 * Parse a multipart/form-data request and extract file buffers.
 * Uses the Web API FormData interface (available in Next.js 13+).
 */
export async function parseFormData(request: Request): Promise<UploadedFile[]> {
  const formData = await request.formData()
  const files: UploadedFile[] = []

  for (const [, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer())
      const uploaded = await saveFile(buffer, value.name, value.type || 'application/octet-stream')
      files.push(uploaded)
    }
  }

  return files
}
