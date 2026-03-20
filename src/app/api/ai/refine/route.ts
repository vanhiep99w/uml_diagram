import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  refineDiagram,
  UnconfiguredProviderError,
  ProviderUnreachableError,
  RateLimitError,
  InvalidUmlOutputError,
} from '@/lib/ai-service';

const refineSchema = z.object({
  source: z.string().min(1).max(50000),
  message: z.string().min(1).max(2000),
  format: z.enum(['plantuml', 'mermaid']).optional().default('plantuml'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = refineSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { source, message, format } = parsed.data;

  try {
    const result = await refineDiagram({
      userId: session.user.id,
      currentSource: source,
      chatMessage: message,
      format,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof UnconfiguredProviderError) {
      return NextResponse.json(
        { error: 'AI provider not configured. Please add your API key in Settings.' },
        { status: 428 }
      );
    }
    if (err instanceof ProviderUnreachableError) {
      return NextResponse.json(
        { error: 'AI provider is unreachable. Check your endpoint URL.' },
        { status: 502 }
      );
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'AI provider rate limit reached. Please try again later.' },
        { status: 429 }
      );
    }
    if (err instanceof InvalidUmlOutputError) {
      return NextResponse.json(
        { error: 'AI returned an invalid diagram. Try rephrasing your description.' },
        { status: 422 }
      );
    }
    console.error('[POST /api/ai/refine]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
