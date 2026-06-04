import type {
  Intensity,
  Objective,
  ReviewScoreComparison,
  ScoreSet,
  TargetPlatform,
  TrialRequest,
} from '../types';

export const platformOptions: Array<{ value: TargetPlatform; label: string }> = [
  { value: 'general', label: '通用传播' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'wechat', label: '微信图文' },
  { value: 'campus', label: '校园活动' },
  { value: 'ecommerce', label: '电商转化' },
];

export const objectiveOptions: Array<{ value: Objective; label: string }> = [
  { value: 'interest', label: '激发兴趣' },
  { value: 'trust', label: '建立信任' },
  { value: 'conversion', label: '促进转化' },
  { value: 'clarity', label: '提升清晰度' },
  { value: 'engagement', label: '提升互动' },
];

export const intensityOptions: Array<{ value: Intensity; label: string; hint: string }> = [
  { value: 'safe', label: '稳妥', hint: '更克制正式，适合公告与官方口径。' },
  { value: 'balanced', label: '均衡', hint: '兼顾吸引力和可信度，适合多数传播场景。' },
  { value: 'bold', label: '大胆', hint: '允许更强钩子，但仍禁止夸张失真。' },
];

export const scoreLabels: Array<{ key: keyof ScoreSet; label: string }> = [
  { key: 'clarity', label: '清晰度' },
  { key: 'appeal', label: '吸引力' },
  { key: 'authenticity', label: '真实感' },
  { key: 'platform_fit', label: '平台适配' },
  { key: 'risk_control', label: '风险控制' },
];

export const trialFlowStages = [
  { key: 'filing', label: '立案', detail: '拆解文案类型、主要意图与目标读者。' },
  { key: 'prosecution', label: '控诉', detail: '扫描模糊表达、钩子不足和风险表述。' },
  { key: 'defense', label: '辩护', detail: '保留原文里已经成立的有效信息。' },
  { key: 'jury', label: '陪审', detail: '合成 5 位固定角色的真实反馈。' },
  { key: 'verdict', label: '判决', detail: '凝练主问题和改写策略。' },
  { key: 'rewrite', label: '改写', detail: '生成可直接使用的改写稿。' },
  { key: 'review', label: '复审', detail: '对原文与改写稿做双评分对照。' },
] as const;

export type TrialFlowStage = (typeof trialFlowStages)[number];

export interface TrialAnalysisState {
  requestId: number;
  status: 'idle' | 'running' | 'settling';
  stageIndex: number;
  startedAt: number | null;
}

export function normalizeTrialRequest(payload: TrialRequest): TrialRequest {
  return {
    ...payload,
    original_text: payload.original_text.trim(),
    audience: payload.audience?.trim() || undefined,
  };
}

export function areTrialRequestsEqual(left: TrialRequest | null, right: TrialRequest | null): boolean {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = normalizeTrialRequest(left);
  const normalizedRight = normalizeTrialRequest(right);

  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

export function findOptionLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function buildScoreRows(scores: ReviewScoreComparison): Array<{
  key: keyof ScoreSet;
  label: string;
  original: number;
  revised: number;
  delta: number;
}> {
  return scoreLabels.map(({ key, label }) => ({
    key,
    label,
    original: scores.original[key],
    revised: scores.revised[key],
    delta: scores.revised[key] - scores.original[key],
  }));
}

export function calculateAverageScore(scoreSet: ScoreSet): number {
  const values = Object.values(scoreSet);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
