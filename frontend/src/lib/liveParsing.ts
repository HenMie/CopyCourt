import { trialFlowStages } from './trial';
import type { ReviewScoreComparison, TrialResponse } from '../types';

type StageKey = (typeof trialFlowStages)[number]['key'];

export interface LiveDocketItem {
  key: StageKey;
  label: string;
  status: 'waiting' | 'active' | 'parsed';
  summary: string;
  detail?: string;
  metric?: string;
}

export interface LiveDocket {
  items: LiveDocketItem[];
  parsedCount: number;
  latestStageIndex: number;
}

function findValueStart(source: string, key: string): number {
  const keyIndex = source.indexOf(`"${key}"`);
  if (keyIndex < 0) {
    return -1;
  }

  const colonIndex = source.indexOf(':', keyIndex + key.length + 2);
  if (colonIndex < 0) {
    return -1;
  }

  let cursor = colonIndex + 1;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }

  return cursor;
}

function extractBalancedValue(source: string, startIndex: number, open: string, close: string): string | null {
  if (source[startIndex] !== open) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function extractJsonValue<T>(source: string, key: string, type: 'object' | 'array'): T | null {
  const startIndex = findValueStart(source, key);
  if (startIndex < 0) {
    return null;
  }

  const segment =
    type === 'object'
      ? extractBalancedValue(source, startIndex, '{', '}')
      : extractBalancedValue(source, startIndex, '[', ']');

  if (!segment) {
    return null;
  }

  try {
    return JSON.parse(segment) as T;
  } catch {
    return null;
  }
}

function seen(source: string, key: string): boolean {
  return source.includes(`"${key}"`);
}

function averageScore(scores: ReviewScoreComparison): number {
  const values = Object.values(scores.revised);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function makeItem(
  source: string,
  key: StageKey,
  label: string,
  jsonKey: keyof TrialResponse,
  parsed: boolean,
  summary: string,
  detail?: string,
  metric?: string,
): LiveDocketItem {
  return {
    key,
    label,
    status: parsed ? 'parsed' : seen(source, jsonKey) ? 'active' : 'waiting',
    summary,
    detail,
    metric,
  };
}

export function buildLiveDocket(source: string): LiveDocket {
  const caseSummary = extractJsonValue<TrialResponse['case_summary']>(source, 'case_summary', 'object');
  const prosecution = extractJsonValue<TrialResponse['prosecution']>(source, 'prosecution', 'array');
  const defense = extractJsonValue<TrialResponse['defense']>(source, 'defense', 'array');
  const jury = extractJsonValue<TrialResponse['jury']>(source, 'jury', 'array');
  const verdict = extractJsonValue<TrialResponse['verdict']>(source, 'verdict', 'object');
  const rewrittenCopy = extractJsonValue<TrialResponse['rewritten_copy']>(source, 'rewritten_copy', 'object');
  const reviewScores = extractJsonValue<TrialResponse['review_scores']>(source, 'review_scores', 'object');

  const items: LiveDocketItem[] = [
    makeItem(
      source,
      'filing',
      '立案',
      'case_summary',
      Boolean(caseSummary),
      caseSummary?.content_type ?? '等待模型归纳文案类型',
      caseSummary ? caseSummary.main_intent : '正在捕捉主要意图和目标读者',
      caseSummary?.target_reader,
    ),
    makeItem(
      source,
      'prosecution',
      '控诉',
      'prosecution',
      Boolean(prosecution),
      prosecution?.[0]?.charge ?? '等待检方列出核心问题',
      prosecution?.[0]?.evidence ?? '正在扫描钩子、价值表达和风险措辞',
      prosecution ? `${prosecution.length} 条` : undefined,
    ),
    makeItem(
      source,
      'defense',
      '辩护',
      'defense',
      Boolean(defense),
      defense?.[0]?.strength ?? '等待辩方保留原文有效信息',
      defense?.[0]?.reason ?? '正在识别可继承的真实、清晰和低风险部分',
      defense ? `${defense.length} 项` : undefined,
    ),
    makeItem(
      source,
      'jury',
      '陪审',
      'jury',
      Boolean(jury),
      jury?.[0] ? `${jury[0].role}：${jury[0].reaction}` : '等待 5 位陪审角色反馈',
      jury?.[0]?.suggestion ?? '正在汇总普通用户、运营、AI味检测官、挑剔用户和组织方意见',
      jury ? `${jury.length} 位` : undefined,
    ),
    makeItem(
      source,
      'verdict',
      '判决',
      'verdict',
      Boolean(verdict),
      verdict?.main_problem ?? '等待法官锁定主问题',
      verdict?.rewrite_strategy ?? '正在形成改写策略',
    ),
    makeItem(
      source,
      'rewrite',
      '改写',
      'rewritten_copy',
      Boolean(rewrittenCopy),
      rewrittenCopy?.title ?? '等待改写稿标题',
      rewrittenCopy?.cta ?? '正在生成正文和行动号召',
    ),
    makeItem(
      source,
      'review',
      '复审',
      'review_scores',
      Boolean(reviewScores),
      reviewScores ? `改写后均分 ${averageScore(reviewScores).toFixed(1)}` : '等待双评分对照',
      reviewScores ? '原文基线与改写后复审已完成' : '正在计算清晰度、吸引力、真实感、平台适配和风险控制',
      reviewScores ? '双评分' : undefined,
    ),
  ];

  const latestStageIndex = items.reduce(
    (latest, item, index) => (item.status !== 'waiting' ? index : latest),
    0,
  );

  return {
    items,
    latestStageIndex,
    parsedCount: items.filter((item) => item.status === 'parsed').length,
  };
}
