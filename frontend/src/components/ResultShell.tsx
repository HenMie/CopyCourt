import {
  ExclamationTriangleIcon,
  UpdateIcon,
  ChatBubbleIcon,
  CheckCircledIcon,
  MagicWandIcon,
  PersonIcon,
  LightningBoltIcon,
  ReaderIcon
} from '@radix-ui/react-icons';
import { useMemo } from 'react';

import {
  buildScoreRows,
  calculateAverageScore,
  findOptionLabel,
  intensityOptions,
  objectiveOptions,
  platformOptions,
  trialFlowStages,
} from '../lib/trial';
import { buildLiveDocket } from '../lib/liveParsing';
import type { TrialAnalysisState } from '../lib/trial';
import type { TrialRequest, TrialResponse } from '../types';

interface ResultShellProps {
  result: TrialResponse | null;
  submittedForm: TrialRequest | null;
  isLoading: boolean;
  hasStaleDraft: boolean;
  streamText: string;
  analysisState: TrialAnalysisState;
}

export function ResultShell({
  result,
  submittedForm,
  isLoading,
  hasStaleDraft,
  streamText,
  analysisState,
}: ResultShellProps) {
  if (isLoading && !result) {
    return (
      <section className="holo-result-shell holo-shell-loading" aria-live="polite">
        <LiveAnalysis analysisState={analysisState} streamText={streamText} />
      </section>
    );
  }

  if (!result || !submittedForm) {
    return null;
  }

  return (
    <section className="holo-result-shell" aria-label="分析评估结果">
      <header className="holo-result-header">
        <div className="holo-result-title">
          <ReaderIcon className="holo-accent-icon" width={24} height={24} />
          <h2>智能评估视图</h2>
          <span className="holo-meta-tags">
            {findOptionLabel(platformOptions, submittedForm.target_platform)} |{' '}
            {findOptionLabel(objectiveOptions, submittedForm.objective)} |{' '}
            {findOptionLabel(intensityOptions, submittedForm.intensity)}
          </span>
        </div>
      </header>

      {hasStaleDraft && (
        <div className="holo-banner warning" role="status">
          <ExclamationTriangleIcon width={16} height={16} />
          <span>系统提示：检测到当前面板参数与展示的评估数据不一致，请点击“重新生成”以获取最新分析结果。</span>
        </div>
      )}

      {isLoading && (
        <div className="holo-banner loading" role="status">
          <UpdateIcon className="spin" width={16} height={16} />
          <span>数据流正在处理中，新的分析报告即将生成。</span>
        </div>
      )}

      {isLoading && <LiveAnalysis compact analysisState={analysisState} streamText={streamText} />}

      <div className="holo-dashboard-grid">
        {/* 左侧：分数雷达/柱状图面板 */}
        <div className="holo-panel holo-panel-scores">
          <div className="holo-panel-header">
            <ChatBubbleIcon width={18} height={18} />
            <h3>质量提升对比</h3>
          </div>
          <ScoreComparison scores={result.review_scores} />
        </div>

        {/* 中间：评审动态气泡 */}
        <div className="holo-panel holo-panel-chat">
          <div className="holo-panel-header">
            <PersonIcon width={18} height={18} />
            <h3>合议庭分析明细</h3>
          </div>
          <div className="holo-chat-flow">
            {result.prosecution.map((item, i) => (
              <div className="holo-chat-bubble prosecution" key={`p-${i}`}>
                <span className="chat-avatar"><ExclamationTriangleIcon width={14} height={14}/> 缺陷诊断</span>
                <div className="chat-content">
                  <strong>{item.charge}</strong>
                  <p>{item.evidence}</p>
                </div>
              </div>
            ))}
            {result.defense.map((item, i) => (
              <div className="holo-chat-bubble defense" key={`d-${i}`}>
                <span className="chat-avatar"><CheckCircledIcon width={14} height={14}/> 优势保留</span>
                <div className="chat-content">
                  <strong>{item.strength}</strong>
                  <p>{item.reason}</p>
                </div>
              </div>
            ))}
            {result.jury.map((item, i) => (
              <div className="holo-chat-bubble jury" key={`j-${i}`}>
                <span className="chat-avatar"><PersonIcon width={14} height={14}/> 专家评审 ({item.role})</span>
                <div className="chat-content">
                  <strong>{item.reaction}</strong>
                  <p>{item.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：结论与重塑文案 */}
        <div className="holo-panel holo-panel-rewrite">
          <div className="holo-panel-header glowing">
            <MagicWandIcon width={18} height={18} />
            <h3>优选改写结果</h3>
          </div>
          <div className="holo-verdict-summary">
            <strong>改写策略:</strong> {result.verdict.rewrite_strategy}
          </div>
          <div className="holo-rewritten-artifact">
            <h4>{result.rewritten_copy.title}</h4>
            <p className="holo-body">{result.rewritten_copy.body}</p>
            <div className="holo-cta">
              <LightningBoltIcon width={14} height={14}/>
              <span>{result.rewritten_copy.cta}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveAnalysis({
  analysisState,
  compact = false,
  streamText,
}: {
  analysisState: TrialAnalysisState;
  compact?: boolean;
  streamText: string;
}) {
  const liveDocket = useMemo(() => buildLiveDocket(streamText), [streamText]);
  const activeStageIndex = Math.max(analysisState.stageIndex, liveDocket.latestStageIndex);
  const activeStage = trialFlowStages[activeStageIndex] ?? trialFlowStages[0];
  const progress = ((activeStageIndex + 1) / trialFlowStages.length) * 100;

  return (
    <div className={`holo-live-analysis ${compact ? 'compact' : ''}`}>
      <div className="holo-live-header">
        <div className="holo-live-title">
          <UpdateIcon className="spin" width={20} height={20} />
          <h3>深度分析进行中... [{activeStage.label}]</h3>
        </div>
        <div className="holo-progress-bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="holo-live-docket">
        {liveDocket.items.map((item) => (
          <div className={`holo-live-card status-${item.status}`} key={item.key}>
            <strong>{item.label}</strong>
            <p>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreComparison({ scores }: { scores: TrialResponse['review_scores'] }) {
  const rows = useMemo(() => buildScoreRows(scores), [scores]);
  const originalAverage = calculateAverageScore(scores.original);
  const revisedAverage = calculateAverageScore(scores.revised);
  const averageDelta = revisedAverage - originalAverage;

  return (
    <div className="holo-scores">
      <div className="holo-scores-hero">
        <div className="holo-score-circle original">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray={`${originalAverage * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="score-text">
            <span>原稿均分</span>
            <strong>{originalAverage.toFixed(1)}</strong>
          </div>
        </div>
        <div className="holo-score-circle revised">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray={`${revisedAverage * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="score-text">
            <span>改写均分</span>
            <strong>{revisedAverage.toFixed(1)}</strong>
          </div>
        </div>
      </div>
      
      <div className="holo-score-list">
        {rows.map((row) => (
          <div className="holo-score-row" key={row.key}>
            <div className="row-info">
              <span>{row.label}</span>
              <strong className={row.delta > 0 ? 'positive' : ''}>{row.delta > 0 ? '+' : ''}{row.delta}</strong>
            </div>
            <div className="row-track">
              <div className="track-inner original" style={{ width: `${row.original * 10}%` }} />
              <div className="track-inner revised" style={{ width: `${row.revised * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
