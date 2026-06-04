import type { ApiErrorBody, TrialRequest, TrialResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class TrialApiError extends Error {
  constructor(
    message: string,
    public readonly code = 'request_failed',
  ) {
    super(message);
  }
}

export async function createTrial(payload: TrialRequest): Promise<TrialResponse> {
  const response = await fetch(`${API_BASE_URL}/api/trials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new TrialApiError(body?.error?.message ?? '审判请求失败，请稍后重试。', body?.error?.code);
  }

  return (await response.json()) as TrialResponse;
}

export type TrialStreamEvent =
  | { type: 'status'; status: string }
  | { type: 'delta'; text: string; accumulatedText: string }
  | { type: 'complete'; result: TrialResponse }
  | { type: 'error'; code: string; message: string };

interface RawSseEvent {
  event: string;
  data: string;
}

function parseSseChunk(buffer: string): { events: RawSseEvent[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const remainder = parts.pop() ?? '';

  const events = parts
    .map((part) => {
      const lines = part.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLines = lines.filter((line) => line.startsWith('data:'));

      return {
        event: eventLine?.slice('event:'.length).trim() ?? 'message',
        data: dataLines.map((line) => line.slice('data:'.length).trimStart()).join('\n'),
      };
    })
    .filter((event) => event.data.length > 0);

  return { events, remainder };
}

function parseStreamEvent(rawEvent: RawSseEvent, accumulatedText: string): TrialStreamEvent | null {
  const data = JSON.parse(rawEvent.data) as Record<string, unknown>;

  if (rawEvent.event === 'status') {
    return { type: 'status', status: String(data.status ?? 'running') };
  }

  if (rawEvent.event === 'delta') {
    const text = String(data.text ?? '');
    return { type: 'delta', text, accumulatedText: accumulatedText + text };
  }

  if (rawEvent.event === 'complete') {
    return { type: 'complete', result: data.result as TrialResponse };
  }

  if (rawEvent.event === 'error') {
    const error = data.error as ApiErrorBody['error'] | undefined;
    return {
      type: 'error',
      code: error?.code ?? 'stream_failed',
      message: error?.message ?? '审判流式响应中断，请稍后重试。',
    };
  }

  return null;
}

export async function streamTrial(
  payload: TrialRequest,
  onEvent: (event: TrialStreamEvent) => void,
  signal?: AbortSignal,
): Promise<TrialResponse> {
  const response = await fetch(`${API_BASE_URL}/api/trials/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new TrialApiError(body?.error?.message ?? '审判流式请求失败，请稍后重试。', body?.error?.code);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedText = '';
  let finalResult: TrialResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.remainder;

    for (const rawEvent of parsed.events) {
      const streamEvent = parseStreamEvent(rawEvent, accumulatedText);
      if (!streamEvent) {
        continue;
      }

      if (streamEvent.type === 'delta') {
        accumulatedText = streamEvent.accumulatedText;
      } else if (streamEvent.type === 'complete') {
        finalResult = streamEvent.result;
      } else if (streamEvent.type === 'error') {
        throw new TrialApiError(streamEvent.message, streamEvent.code);
      }

      onEvent(streamEvent);
    }
  }

  if (!finalResult) {
    throw new TrialApiError('审判流式响应未返回完整结果，请稍后重试。', 'missing_stream_result');
  }

  return finalResult;
}
