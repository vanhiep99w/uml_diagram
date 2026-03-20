import { NextRequest, NextResponse } from 'next/server';

const PLANTUML_SAFE = /^[A-Za-z0-9\-_~]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.encoded) {
    return NextResponse.json({ error: 'Missing encoded content' }, { status: 400 });
  }
  if (!PLANTUML_SAFE.test(body.encoded)) {
    return NextResponse.json({ error: 'Invalid encoded content' }, { status: 400 });
  }
  // Proxy to PlantUML server
  const url = `https://www.plantuml.com/plantuml/svg/${body.encoded}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return NextResponse.json({ error: 'PlantUML render failed' }, { status: response.status });
    }
    const svg = await response.text();
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  } finally {
    clearTimeout(timeout);
  }
}
