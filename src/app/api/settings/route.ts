import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import {
  getSettings,
  updateSettings,
  validateSettingsInput,
} from '@/lib/settings-service'

async function getAuthOptions() {
  const { authOptions } = await import('@/lib/auth')
  return authOptions
}

// Per-user rate limit: max 10 PUT requests per minute
const putRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isPutRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = putRateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    putRateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return false
  }
  putRateLimitMap.set(userId, { ...entry, count: entry.count + 1 })
  return entry.count >= 10
}

export async function GET(_request: Request) {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getSettings(session.user.id)
  return NextResponse.json({ data: settings })
}

export async function PUT(request: Request) {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isPutRateLimited(session.user.id)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await request.json()
  const validation = validateSettingsInput(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validation.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  const settings = await updateSettings(session.user.id, validation.data)
  return NextResponse.json({ data: settings })
}
