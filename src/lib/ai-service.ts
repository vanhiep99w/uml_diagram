import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { decryptApiKey } from '@/lib/crypto';

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

export class UnconfiguredProviderError extends Error {
  constructor(message = 'UnconfiguredProviderError: No AI provider configured. Please add your API key in Settings.') {
    super(message);
    this.name = 'UnconfiguredProviderError';
  }
}

export class ProviderUnreachableError extends Error {
  constructor(endpoint?: string) {
    const detail = endpoint ? ` (${endpoint})` : '';
    super(`ProviderUnreachableError: Unable to reach the AI provider${detail}. Check your endpoint URL and network connectivity.`);
    this.name = 'ProviderUnreachableError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'RateLimitError: Too many requests. Please wait a moment before trying again.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InvalidUmlOutputError extends Error {
  constructor(received: string) {
    super(`InvalidUmlOutputError: AI response did not contain valid UML source. Received: ${received.slice(0, 100)}`);
    this.name = 'InvalidUmlOutputError';
  }
}

// ---------------------------------------------------------------------------
// Output validation helpers
// ---------------------------------------------------------------------------

const MERMAID_START_TOKENS = [
  'graph',
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'erDiagram',
  'gantt',
  'pie',
  'gitGraph',
  'mindmap',
  'timeline',
];

const MERMAID_START_REGEX = new RegExp(
  `^(${MERMAID_START_TOKENS.join('|')})`,
  'm'
);

export function isValidPlantUml(source: string): boolean {
  return source.trimStart().startsWith('@startuml');
}

export function isValidMermaid(source: string): boolean {
  if (!source.trim()) return false;
  return MERMAID_START_REGEX.test(source.trim());
}

// ---------------------------------------------------------------------------
// Clarifying question detection
// ---------------------------------------------------------------------------

const CLARIFY_PREFIX = 'CLARIFY:';

function extractClarifyingQuestion(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith(CLARIFY_PREFIX)) {
    return trimmed.slice(CLARIFY_PREFIX.length).trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// URL validation helper (SSRF prevention)
// ---------------------------------------------------------------------------

function validateApiBaseUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid API base URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('API base URL must use HTTPS');
  }
  const host = parsed.hostname;
  // Block private/loopback/link-local ranges (IPv4 + IPv6)
  if (
    /^(localhost|0\.0\.0\.0|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/.test(host) ||
    host === '::1' ||
    /^f[cd][0-9a-f]{2}:/i.test(host) // IPv6 ULA fc00::/7 (covers both fc::/8 and fd::/8)
  ) {
    throw new Error('API base URL cannot point to a private network address');
  }
}

// ---------------------------------------------------------------------------
// Provider setup helper
// ---------------------------------------------------------------------------

interface UserSettings {
  encryptedApiKey: string | null;
  preferredModel: string;
  apiBaseUrl?: string | null;
}

async function getProviderConfig(userId: string): Promise<{ client: OpenAI; model: string }> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  }) as UserSettings | null;

  if (!settings || !settings.encryptedApiKey) {
    throw new UnconfiguredProviderError();
  }

  const apiKey = decryptApiKey(settings.encryptedApiKey);

  const clientOptions: { apiKey: string; baseURL?: string } = { apiKey };
  if (settings.apiBaseUrl) {
    validateApiBaseUrl(settings.apiBaseUrl);
    clientOptions.baseURL = settings.apiBaseUrl;
  }

  const client = new OpenAI(clientOptions);
  const model = settings.preferredModel || 'gpt-4';

  return { client, model };
}

// ---------------------------------------------------------------------------
// Error mapping helper
// ---------------------------------------------------------------------------

function mapProviderError(err: unknown, endpoint?: string): never {
  const error = err as { code?: string; status?: number; message?: string };

  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET'
  ) {
    throw new ProviderUnreachableError(endpoint);
  }

  if (error.status === 429) {
    throw new RateLimitError();
  }

  throw err;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

function buildGenerateSystemPrompt(format: 'plantuml' | 'mermaid', diagramType: string): string {
  const formatInstructions =
    format === 'plantuml'
      ? 'Return ONLY raw PlantUML source starting with @startuml and ending with @enduml. No prose, no markdown code fences.'
      : `Return ONLY raw Mermaid source starting with a valid Mermaid diagram type keyword (e.g. graph, flowchart, sequenceDiagram, etc). No prose, no markdown code fences.`;

  return (
    `You are a UML diagram generator. Generate a ${diagramType} diagram.\n` +
    `${formatInstructions}\n` +
    `If the description is too ambiguous to generate a meaningful diagram, respond with exactly: ` +
    `CLARIFY: <your clarifying question>`
  );
}

function buildRefineSystemPrompt(format: 'plantuml' | 'mermaid'): string {
  const formatInstructions =
    format === 'plantuml'
      ? 'Return ONLY the complete updated raw PlantUML source starting with @startuml. No prose, no markdown code fences.'
      : 'Return ONLY the complete updated raw Mermaid source. No prose, no markdown code fences.';

  return `You are a UML diagram editor. The user wants to refine an existing diagram.\n${formatInstructions}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const AI_TIMEOUT_MS = 30_000;

export async function generateDiagram(params: {
  userId: string;
  description: string;
  diagramType: string;
  format?: 'plantuml' | 'mermaid';
}): Promise<{ source: string; format: 'plantuml' | 'mermaid' } | { clarifyingQuestion: string }> {
  const { userId, description, diagramType, format = 'plantuml' } = params;

  const { client, model } = await getProviderConfig(userId);

  const systemPrompt = buildGenerateSystemPrompt(format, diagramType);

  let response;
  try {
    response = await Promise.race([
      client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description },
        ],
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })), AI_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    mapProviderError(err);
  }

  const content = (response as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content?.trim() ?? '';

  const clarifyingQuestion = extractClarifyingQuestion(content);
  if (clarifyingQuestion !== null) {
    return { clarifyingQuestion };
  }

  if (format === 'plantuml') {
    if (!isValidPlantUml(content)) {
      throw new InvalidUmlOutputError(content);
    }
  } else {
    if (!isValidMermaid(content)) {
      throw new InvalidUmlOutputError(content);
    }
  }

  return { source: content, format };
}

export async function refineDiagram(params: {
  userId: string;
  currentSource: string;
  chatMessage: string;
  format: 'plantuml' | 'mermaid';
}): Promise<{ source: string }> {
  const { userId, currentSource, chatMessage, format } = params;

  const { client, model } = await getProviderConfig(userId);

  const systemPrompt = buildRefineSystemPrompt(format);

  let response;
  try {
    response = await Promise.race([
      client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current diagram:\n${currentSource}\n\nInstruction: ${chatMessage}` },
        ],
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })), AI_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    mapProviderError(err);
  }

  const content = (response as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content?.trim() ?? '';

  if (format === 'plantuml') {
    if (!isValidPlantUml(content)) {
      throw new InvalidUmlOutputError(content);
    }
  } else {
    if (!isValidMermaid(content)) {
      throw new InvalidUmlOutputError(content);
    }
  }

  return { source: content };
}

export async function testConnection(params: {
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId } = params;

  let client: OpenAI;
  let model: string;

  try {
    const config = await getProviderConfig(userId);
    client = config.client;
    model = config.model;
  } catch (err) {
    if (err instanceof UnconfiguredProviderError) {
      return { success: false, error: 'Please configure your AI provider in Settings.' };
    }
    return { success: false, error: 'Failed to load provider configuration.' };
  }

  try {
    await Promise.race([
      client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })), AI_TIMEOUT_MS)
      ),
    ]);
    return { success: true };
  } catch (err) {
    const error = err as { code?: string; status?: number; message?: string };
    let errorMessage = 'Connection test failed.';

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      errorMessage = 'Unable to reach the AI provider. Check your endpoint URL and network connectivity.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid or expired API key. Please update your API key in Settings.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else {
      errorMessage = 'Unable to connect to the AI provider. Please check your endpoint and try again.';
    }

    return { success: false, error: errorMessage };
  }
}
