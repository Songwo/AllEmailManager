// ============================================================================
// Shared TypeScript type definitions
// ============================================================================

// -- Email Provider ----------------------------------------------------------

export interface EmailProvider {
  name: string
  value: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  instructions: string
  helpUrl?: string
}

// -- Push Channel ------------------------------------------------------------

export interface PushChannelField {
  name: string
  label: string
  type: string
  placeholder: string
  required: boolean
}

export interface PushChannelType {
  type: string
  name: string
  icon: string
  color: string
  fields: PushChannelField[]
  instructions: string
}

// -- Connection Diagnostics --------------------------------------------------

export interface DiagStep {
  name: string
  status: 'success' | 'error' | 'skipped'
  message: string
  duration: number
}

export interface DiagResult {
  steps: DiagStep[]
  overall: 'success' | 'error'
  suggestion: string
}

// -- Listener ----------------------------------------------------------------

export type ListenerStatus = 'running' | 'stopped'
export type ListenerMode = 'idle' | 'poll' | 'unknown'

export interface ListenerInfo {
  status: ListenerStatus
  connected?: boolean
  mode: string
  pollInterval: number
}

// -- Email Account (API response) --------------------------------------------

export interface EmailAccountDTO {
  id: string
  email: string
  provider: string
  imapHost: string
  imapPort: number
  smtpHost: string | null
  smtpPort: number | null
  isActive: boolean
  lastSyncAt: string | null
  lastHeartbeatAt: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  _count: { emails: number }
}

// -- Email (API response) ----------------------------------------------------

export interface EmailDTO {
  id: string
  fromAddress: string
  toAddresses: string[]
  subject: string
  body: string | null
  bodyHtml: string | null
  receivedAt: string
  isRead: boolean
  attachments: EmailAttachment[] | null
  emailAccount: {
    email: string
    provider: string
  }
}

export interface EmailAttachment {
  filename: string
  contentType: string
  size: number
}

// -- Account Status ----------------------------------------------------------

export type AccountStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

// -- Analytics ---------------------------------------------------------------

export interface AnalyticsOverview {
  totalEmails: number
  unreadEmails: number
  todayEmails: number
  activeAccounts: number
}

export interface AccountSummary {
  id: string
  email: string
  provider: string
  status: string
}

// -- Notification ------------------------------------------------------------

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type?: NotificationType
  metadata?: Record<string, unknown> | null
}

// -- Send Email --------------------------------------------------------------

export interface SendEmailInput {
  emailAccountId: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  body: string
  html?: string
  inReplyTo?: string
  references?: string | string[]
}
