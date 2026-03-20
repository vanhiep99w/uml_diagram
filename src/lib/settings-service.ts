import { z } from 'zod'
import prisma from '@/lib/prisma'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

export const settingsSchema = z.object({
  aiBaseUrl: z
    .string()
    .url('aiBaseUrl must be a valid URL')
    .max(2048, 'aiBaseUrl is too long')
    .refine(u => u.startsWith('https://'), 'aiBaseUrl must use HTTPS'),
  aiModel: z.string().min(1, 'aiModel must not be empty').max(100, 'aiModel is too long'),
  apiKey: z.string().optional(),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/**
 * Validates raw input against the settings schema.
 * Returns a Zod SafeParseReturnType — never throws.
 */
export function validateSettingsInput(data: unknown) {
  return settingsSchema.safeParse(data)
}

// ---------------------------------------------------------------------------
// Masking helper
// ---------------------------------------------------------------------------

/**
 * Masks an API key to ****<last4>, always returning 8 characters.
 */
export function maskApiKey(plaintext: string): string {
  if (plaintext.length < 4) return '****'
  return `****${plaintext.slice(-4)}`
}

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface SettingsResponse {
  aiBaseUrl: string | null
  aiModel: string
  apiKey: string | null
}

const DEFAULT_SETTINGS: SettingsResponse = {
  aiBaseUrl: null,
  aiModel: 'gpt-4',
  apiKey: null,
}

// ---------------------------------------------------------------------------
// Internal helper — convert a DB record to SettingsResponse
// ---------------------------------------------------------------------------

function toSettingsResponse(
  record: Record<string, unknown>
): SettingsResponse {
  const encryptedApiKey = record.encryptedApiKey as string | null | undefined
  let apiKey: string | null = null
  if (encryptedApiKey) {
    try {
      apiKey = maskApiKey(decryptApiKey(encryptedApiKey))
    } catch {
      // Decryption failed (e.g. key rotation) — treat as unset
      apiKey = null
    }
  }
  return {
    aiBaseUrl: (record.apiBaseUrl as string | null) ?? null,
    aiModel: (record.preferredModel as string) ?? DEFAULT_SETTINGS.aiModel,
    apiKey,
  }
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

/**
 * Returns the user's settings with the API key masked.
 * Returns default empty settings when no record exists in the DB.
 */
export async function getSettings(userId: string): Promise<SettingsResponse> {
  const record = await prisma.userSettings.findUnique({ where: { userId } })

  if (!record) {
    return { ...DEFAULT_SETTINGS }
  }

  return toSettingsResponse(record as Record<string, unknown>)
}

/**
 * Creates or updates the user's settings.
 * Encrypts the API key before persisting; returns the masked key in the response.
 */
export async function updateSettings(
  userId: string,
  input: SettingsInput
): Promise<SettingsResponse> {
  const encryptedApiKey = input.apiKey ? encryptApiKey(input.apiKey) : undefined

  const sharedFields = {
    apiBaseUrl: input.aiBaseUrl,
    preferredModel: input.aiModel,
    ...(encryptedApiKey !== undefined && { encryptedApiKey }),
  }

  const record = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...sharedFields },
    update: sharedFields,
  })

  return toSettingsResponse(record as Record<string, unknown>)
}
