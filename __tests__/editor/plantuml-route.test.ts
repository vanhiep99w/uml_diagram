/**
 * Tests for POST /api/plantuml/render route
 * Tests the route handler function directly (not via HTTP).
 */

import { POST } from '@/app/api/plantuml/render/route';

// Mock global fetch
global.fetch = jest.fn();

describe('POST /api/plantuml/render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when no body is provided', async () => {
    const request = new Request('http://localhost/api/plantuml/render', {
      method: 'POST',
      body: null,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when body is missing encoded content', async () => {
    const request = new Request('http://localhost/api/plantuml/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('calls external PlantUML URL and proxies the response when given valid encoded content', async () => {
    const mockSvgContent = '<svg>plantuml diagram</svg>';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockSvgContent, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    const encodedContent = 'SyfFKj2rKt3CoKnELR1Io4ZDoSa70000';
    const request = new Request('http://localhost/api/plantuml/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encoded: encodedContent }),
    });

    const response = await POST(request);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Verify the external URL contains the encoded content
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodedContent);

    // Response should be proxied
    expect(response.status).toBe(200);
  });
});
