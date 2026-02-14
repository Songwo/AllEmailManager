# Settings, Notification, and Template System

This document describes the implementation for:
- Settings page 4 tabs (profile / notification / security / appearance),
- avatar update,
- Google Authenticator 2FA,
- top-right bell notification center,
- built-in Feishu card presets (preview + one-click apply).

## Data Structures

### User

New fields used by this feature set:
- `avatarUrl: String?`
- `twoFactorEnabled: Boolean`
- `twoFactorSecret: String?` (encrypted)
- `twoFactorTempSecret: String?` (encrypted)
- `recoveryCodes: String?` (encrypted JSON string array)
- `twoFactorVerifiedAt: DateTime?`

### UserSettings

Per-user persisted settings:
- notification toggles
- quiet hours
- push rate limit
- session timeout
- language/timezone/date format

### Notification

Bell notification center records:
- `title`, `message`, `type`, `isRead`, `metadata`, `readAt`, `createdAt`

### PushTemplate / PushChannel

Template isolation and binding:
- `PushTemplate.emailAccountId` supports global/account-level templates.
- `PushChannel.emailAccountId` supports global/account-level channels.
- `PushChannel.templateId` binds a template to a channel.

## Backend APIs

### Settings + Profile

- `GET /api/settings`
  - returns profile + notifications + security + appearance settings.
- `POST /api/settings`
  - updates settings tabs payload.
- `PATCH /api/settings`
  - updates profile, avatar, and password.

### 2FA (Google Authenticator)

- `GET /api/settings/2fa`
  - returns 2FA status, pending setup, remaining recovery codes.
- `POST /api/settings/2fa`
  - `action: setup` generate secret + QR + recovery codes.
  - `action: verify` verify one TOTP/recovery code.
  - `action: enable` enable 2FA after code verification.
  - `action: disable` disable 2FA with password + code/recovery code.
  - `action: regenerateRecoveryCodes` regenerate backup codes.

### Notification Center

- `GET /api/notifications`
  - list notifications and unread count.
- `POST /api/notifications`
  - create notification record.
- `PATCH /api/notifications`
  - mark one/many/all notifications as read.

### Feishu Preset Templates

- `GET /api/feishu-templates`
  - returns built-in presets for visualization preview.
- `POST /api/feishu-templates`
  - applies a preset into `PushTemplate`, optionally binds to a Feishu channel.

### Push Templates

- `GET/POST/PATCH/DELETE /api/push-templates`
  - account-isolated template CRUD.

## Frontend Coverage

- Settings page: `app/dashboard/settings/page.tsx`
  - 4 tabs with live data binding and persistence.
  - avatar upload + profile/password updates.
  - 2FA setup/enable/disable/regenerate flows.
  - Feishu preset preview and one-click apply.
- Bell center: `components/ui/notification-center.tsx`
  - unread badge + list + mark-read actions.
- Layout integration: `app/dashboard/layout.tsx`
  - top-right notification bell.

## Migration

### Prisma schema

- `prisma/schema.prisma`

### SQL migration

- `prisma/migrations/20260214_settings_security_notification/migration.sql`

### One-command migration script

- `scripts/migrate-settings.ts`
- run:

```bash
npm run db:migrate:settings
```

## Self Tests

### Unit tests

- `__tests__/lib/two-factor.test.ts`
- `__tests__/lib/feishu-card-templates.test.ts`

Run:

```bash
npm test -- __tests__/lib/two-factor.test.ts __tests__/lib/feishu-card-templates.test.ts
```

### Manual E2E checklist

- `scripts/self-test-settings.md`
