import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import type { TrialResponse } from './types';

const mockResult: TrialResponse = {
  case_summary: {
    content_type: '课程介绍',
    main_intent: '介绍AI写作课程',
    target_reader: '大学生',
  },
  prosecution: [{ charge: '开头不够抓人', evidence: '直接介绍课程内容，缺少痛点。', severity: 3 }],
  defense: [{ strength: '信息可信', reason: '适合人群和学习内容清楚。' }],
  jury: [
    { role: '普通用户', reaction: '能看懂，但没有马上报名的冲动。', suggestion: '先讲收益。' },
    { role: '平台运营', reaction: '信息完整。', suggestion: '压缩首段。' },
    { role: 'AI味检测官', reaction: '表达自然。', suggestion: '保留真实语气。' },
    { role: '挑剔用户', reaction: '案例不够具体。', suggestion: '补一个作业场景。' },
    { role: '品牌/组织方', reaction: '风险可控。', suggestion: '不要夸大效果。' },
  ],
  verdict: {
    main_problem: '价值点出现太晚。',
    rewrite_strategy: '先给学习收益，再说明课程内容。',
  },
  rewritten_copy: {
    title: '用AI把课程作业写得更清楚',
    body: '这门课程用真实案例带你学习提示词编写、资料整理和内容改写。',
    cta: '欢迎报名体验。',
  },
  review_scores: {
    original: {
      clarity: 6,
      appeal: 6,
      authenticity: 8,
      platform_fit: 6,
      risk_control: 8,
    },
    revised: {
      clarity: 9,
      appeal: 8,
      authenticity: 9,
      platform_fit: 8,
      risk_control: 10,
    },
  },
};

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function makeStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

function makeSuccessStreamResponse(): Response {
  const jsonText = JSON.stringify(mockResult);
  return makeStreamResponse([
    sse('status', { status: 'started' }),
    sse('delta', { text: jsonText.slice(0, 120) }),
    sse('delta', { text: jsonText.slice(120) }),
    sse('complete', { result: mockResult }),
  ]);
}

describe('CopyCourt app', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => makeSuccessStreamResponse()));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('fills a built-in example', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /课程介绍文案/ }));

    expect(screen.getByLabelText('原始文案')).toHaveValue(
      '这门课程将带你学习AI工具的基础使用方法，包括提示词编写、资料整理和内容改写。适合没有技术基础但想提高学习效率的同学，通过案例练习掌握日常学习中可直接使用的方法。',
    );
  });

  it('streams trial events, shows live parsing, and renders final result', async () => {
    const user = userEvent.setup();
    let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
    const encoder = new TextEncoder();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          new ReadableStream({
            start(nextController) {
              controller = nextController;
              nextController.enqueue(encoder.encode(sse('status', { status: 'started' })));
              nextController.enqueue(encoder.encode(sse('delta', { text: '{"case_summary":' })));
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream' }, status: 200 },
        ),
      ),
    );
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: /^开庭审判$/ })[0]);

    await screen.findByText('实时审理中');
    expect(screen.getByText('实时解析卷宗')).toBeInTheDocument();
    expect(screen.queryByText('结构化输出流')).not.toBeInTheDocument();
    expect(screen.queryByText('{"case_summary":')).not.toBeInTheDocument();

    controller?.enqueue(encoder.encode(sse('delta', { text: JSON.stringify(mockResult).slice('{"case_summary":'.length) })));
    controller?.enqueue(encoder.encode(sse('complete', { result: mockResult })));
    controller?.close();

    await waitFor(() => expect(screen.getByText('用AI把课程作业写得更清楚')).toBeInTheDocument());
    expect(screen.getByText('AI味检测官')).toBeInTheDocument();
    expect(screen.getByText('平均提升')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/trials/stream',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows readable error state when backend stream returns an error', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        makeStreamResponse([
          sse('status', { status: 'started' }),
          sse('error', {
            error: {
              code: 'missing_api_key',
              message: '缺少 OPENAI_API_KEY，请在环境变量或 .env 中配置后重试。',
            },
          }),
        ]),
      ),
    );
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: /^开庭审判$/ })[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('缺少 OPENAI_API_KEY'));
  });

  it('shows readable error state when backend request fails before streaming', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: 'missing_api_key',
                message: '缺少 OPENAI_API_KEY，请在环境变量或 .env 中配置后重试。',
              },
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: /^开庭审判$/ })[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('缺少 OPENAI_API_KEY'));
  });

  it('keeps the previous result and marks stale draft when the form changes after success', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: /^开庭审判$/ })[0]);
    await waitFor(() => expect(screen.getByText('用AI把课程作业写得更清楚')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /修改案卷/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /修改案卷/ }));
    await user.type(screen.getByLabelText('目标受众'), '补充受众');

    expect(screen.getByText('表单已更改，结果未更新。重新开庭后将生成新的审判记录。')).toBeInTheDocument();
    expect(screen.getByText('当前展示的是上一次提交的结果。左侧草稿已有改动，但尚未重新审判。')).toBeInTheDocument();
  });
});
