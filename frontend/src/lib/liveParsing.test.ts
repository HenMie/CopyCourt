import { describe, expect, it } from 'vitest';

import { buildLiveDocket } from './liveParsing';
import type { TrialResponse } from '../types';

const completeResult: TrialResponse = {
  case_summary: {
    content_type: '校园活动文案',
    main_intent: '邀请学生参加社团开放夜',
    target_reader: '大一新生',
  },
  prosecution: [{ charge: '钩子偏弱', evidence: '开头像普通通知。', severity: 4 }],
  defense: [{ strength: '信息完整', reason: '时间地点清楚。' }],
  jury: [
    { role: '普通用户', reaction: '能看懂但不够想去。', suggestion: '先讲现场体验。' },
    { role: '平台运营', reaction: '适合校园公告。', suggestion: '强化行动号召。' },
    { role: 'AI味检测官', reaction: '表达自然。', suggestion: '保留真实语气。' },
    { role: '挑剔用户', reaction: '缺少非去不可的理由。', suggestion: '补低门槛信息。' },
    { role: '品牌/组织方', reaction: '风险可控。', suggestion: '突出组织方调性。' },
  ],
  verdict: {
    main_problem: '价值点不够靠前。',
    rewrite_strategy: '先给参与理由，再说明安排。',
  },
  rewritten_copy: {
    title: '周五晚来开放夜，找到你的第一个社团',
    body: '带着好奇心来就可以。',
    cta: '周五晚七点见。',
  },
  review_scores: {
    original: {
      clarity: 6,
      appeal: 5,
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

describe('buildLiveDocket', () => {
  it('marks a visible but incomplete section as active, not parsed', () => {
    const docket = buildLiveDocket('{"case_summary":{"content_type":"校园活动文案"');

    expect(docket.items[0]).toMatchObject({
      label: '立案',
      status: 'active',
      summary: '等待模型归纳文案类型',
    });
    expect(docket.parsedCount).toBe(0);
  });

  it('extracts completed sections from accumulated JSON stream text', () => {
    const source = JSON.stringify({
      case_summary: completeResult.case_summary,
      prosecution: completeResult.prosecution,
    });
    const docket = buildLiveDocket(source);

    expect(docket.items[0]).toMatchObject({
      status: 'parsed',
      summary: '校园活动文案',
      metric: '大一新生',
    });
    expect(docket.items[1]).toMatchObject({
      status: 'parsed',
      summary: '钩子偏弱',
      metric: '1 条',
    });
    expect(docket.items[2].status).toBe('waiting');
    expect(docket.parsedCount).toBe(2);
  });

  it('summarizes all seven stages and review average after completion', () => {
    const docket = buildLiveDocket(JSON.stringify(completeResult));

    expect(docket.parsedCount).toBe(7);
    expect(docket.latestStageIndex).toBe(6);
    expect(docket.items[5]).toMatchObject({
      label: '改写',
      summary: '周五晚来开放夜，找到你的第一个社团',
    });
    expect(docket.items[6]).toMatchObject({
      label: '复审',
      summary: '改写后均分 8.8',
      metric: '双评分',
    });
  });
});
