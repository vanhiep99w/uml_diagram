import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testConnection } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  // req is accepted to conform to Next.js route handler signature
  void req;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await testConnection({ userId: session.user.id });

  if (result.success) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  return NextResponse.json({ success: false, error: result.error }, { status: 200 });
}
