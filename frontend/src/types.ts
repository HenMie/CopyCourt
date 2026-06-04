export type TargetPlatform = 'general' | 'xiaohongshu' | 'douyin' | 'wechat' | 'campus' | 'ecommerce';
export type Objective = 'interest' | 'trust' | 'conversion' | 'clarity' | 'engagement';
export type Intensity = 'safe' | 'balanced' | 'bold';

export interface TrialRequest {
  original_text: string;
  target_platform: TargetPlatform;
  audience?: string;
  objective: Objective;
  intensity: Intensity;
}

export interface ScoreSet {
  clarity: number;
  appeal: number;
  authenticity: number;
  platform_fit: number;
  risk_control: number;
}

export interface ReviewScoreComparison {
  original: ScoreSet;
  revised: ScoreSet;
}

export interface TrialResponse {
  case_summary: {
    content_type: string;
    main_intent: string;
    target_reader: string;
  };
  prosecution: Array<{
    charge: string;
    evidence: string;
    severity: number;
  }>;
  defense: Array<{
    strength: string;
    reason: string;
  }>;
  jury: Array<{
    role: '普通用户' | '平台运营' | 'AI味检测官' | '挑剔用户' | '品牌/组织方';
    reaction: string;
    suggestion: string;
  }>;
  verdict: {
    main_problem: string;
    rewrite_strategy: string;
  };
  rewritten_copy: {
    title: string;
    body: string;
    cta: string;
  };
  review_scores: ReviewScoreComparison;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}
