import { NextRequest, NextResponse } from 'next/server';
import { validateRegisterInput } from '@/lib/auth-validation';
import { createUser, DuplicateEmailError } from '@/lib/auth-service';
import type { ZodError } from 'zod';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  rateLimitMap.set(ip, { ...entry, count: entry.count + 1 });
  return entry.count + 1 > 5;
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    (forwardedFor ? forwardedFor.split(',')[0] : null)?.trim() ??
    request.headers.get('x-real-ip')?.trim() ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateRegisterInput(body);
  if (!validation.success) {
    const errors = (validation.error as ZodError).issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  const { email, password, name } = validation.data!;

  try {
    const user = await createUser(email, password, name);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
