import {
  AlertTriangle,
  Gavel,
  Loader2,
  MessageSquareQuote,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
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
import { SectionFrame } from './SectionFrame';

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
      <section className="result-shell result-shell-loading" aria-live="polite" aria-label="审判结果">
        <LiveAnalysis analysisState={analysisState} streamText={streamText} />
      </section>
    );
  }

  if (!result || !submittedForm) {
    return null;
  }

  return (
    <section className="result-shell" aria-label="审判结果">
      <header className="result-header">
        <div>
          <p className="eyebrow">Verdict Record</p>
          <h2>审判记录</h2>
          <p className="result-subtitle">以下结果基于最近一次成功提交的案卷生成，保留本次分析与改写依据。</p>
        </div>
        <div className="result-meta">
          <MetaChip label="平台" value={findOptionLabel(platformOptions, submittedForm.target_platform)} />
          <MetaChip label="目标" value={findOptionLabel(objectiveOptions, submittedForm.objective)} />
          <MetaChip label="强度" value={findOptionLabel(intensityOptions, submittedForm.intensity)} />
        </div>
      </header>

      {hasStaleDraft ? (
        <div className="result-banner" role="status">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>当前展示的是上一次提交的结果。左侧草稿已有改动，但尚未重新审判。</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="result-banner result-banner-loading" role="status">
          <Loader2 aria-hidden="true" className="spin" size={16} />
          <span>正在基于当前草稿重新合议，旧结果暂时保留展示。</span>
        </div>
      ) : null}

      {isLoading ? <LiveAnalysis compact analysisState={analysisState} streamText={streamText} /> : null}

      <div className="section-grid">
        <SectionFrame badge="案情归纳" icon={<ScrollText aria-hidden="true" size={18} />} subtitle="Case Summary" title="立案">
          <DefinitionList
            items={[
              ['文案类型', result.case_summary.content_type],
              ['主要意图', result.case_summary.main_intent],
              ['目标读者', result.case_summary.target_reader],
            ]}
          />
        </SectionFrame>

        <SectionFrame badge="问题证据" icon={<AlertTriangle aria-hidden="true" size={18} />} subtitle="Prosecution" title="控诉">
          <div className="charge-list">
            {result.prosecution.map((item) => (
              <article className="charge-card" key={`${item.charge}-${item.evidence}`}>
                <div className="charge-copy">
                  <strong>{item.charge}</strong>
                  <p>{item.evidence}</p>
                </div>
                <SeverityDots value={item.severity} />
              </article>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame badge="保留项" icon={<ShieldCheck aria-hidden="true" size={18} />} subtitle="Defense" title="辩护">
          <div className="plain-list">
            {result.defense.map((item) => (
              <article className="ledger-note" key={`${item.strength}-${item.reason}`}>
                <strong>{item.strength}</strong>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          badge={`${result.jury.length} 位`}
          icon={<UsersRound aria-hidden="true" size={18} />}
          subtitle="Jury"
          title="陪审"
        >
          <div className="jury-grid">
            {result.jury.map((item) => (
              <article className="jury-card" key={item.role}>
                <p className="jury-role">{item.role}</p>
                <strong>{item.reaction}</strong>
                <span>{item.suggestion}</span>
              </article>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame badge="结论" icon={<Gavel aria-hidden="true" size={18} />} subtitle="Verdict" title="判决">
          <DefinitionList
            items={[
              ['主要问题', result.verdict.main_problem],
              ['改写策略', result.verdict.rewrite_strategy],
            ]}
          />
        </SectionFrame>

        <SectionFrame
          badge="对照阅读"
          fullWidth
          icon={<Sparkles aria-hidden="true" size={18} />}
          subtitle="Rewrite"
          title="改写前后对照"
        >
          <div className="rewrite-layout">
            <article className="paper-card">
              <p className="paper-label">原始文案</p>
              <p className="paper-body">{submittedForm.original_text}</p>
            </article>
            <article className="paper-card paper-card-highlight">
              <p className="paper-label">改写稿</p>
              <h3>{result.rewritten_copy.title}</h3>
              <p className="paper-body">{result.rewritten_copy.body}</p>
              <strong className="paper-cta">{result.rewritten_copy.cta}</strong>
            </article>
          </div>
        </SectionFrame>

        <SectionFrame
          badge="双评分"
          fullWidth
          icon={<MessageSquareQuote aria-hidden="true" size={18} />}
          subtitle="Review Scores"
          title="复审评分提升"
        >
          <ScoreComparison scores={result.review_scores} />
        </SectionFrame>
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
    <div className={`live-analysis${compact ? ' live-analysis-compact' : ''}`} aria-live="polite">
      <header className="live-analysis-header">
        <div>
          <p className="eyebrow">Hearing Live</p>
          <h2>实时审理中</h2>
          <p>{activeStage.detail} 已完成 {liveDocket.parsedCount} 个审理分区，结果会逐段落入下方卷宗。</p>
        </div>
        <div className="live-status-pill">
          <Loader2 aria-hidden="true" className="spin" size={16} />
          <span>{activeStage.label}</span>
        </div>
      </header>

      <div
        className="live-progress"
        role="progressbar"
        aria-label="审理进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <i style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <ol className="trial-flow">
        {trialFlowStages.map((stage, index) => {
          const parsedState = liveDocket.items[index]?.status;
          const state =
            parsedState === 'parsed' ? 'done' : index === activeStageIndex || parsedState === 'active' ? 'active' : 'waiting';
          return (
            <li className={`trial-flow-item trial-flow-${state}`} aria-current={state === 'active' ? 'step' : undefined} key={stage.key}>
              <span>{index + 1}</span>
              <div>
                <strong>{stage.label}</strong>
                <p>{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="live-docket" aria-label="实时解析卷宗">
        <div className="live-docket-head">
          <span>实时解析卷宗</span>
          <strong>{liveDocket.parsedCount}/7 已成段</strong>
        </div>
        <div className="live-docket-grid">
          {liveDocket.items.map((item) => (
            <article className={`live-docket-card live-docket-${item.status}`} key={item.key}>
              <div className="live-docket-card-head">
                <span>{item.label}</span>
                <strong>{item.metric ?? statusLabel(item.status)}</strong>
              </div>
              <p>{item.summary}</p>
              {item.detail ? <small>{item.detail}</small> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: 'waiting' | 'active' | 'parsed') {
  if (status === 'parsed') {
    return '已完成';
  }
  if (status === 'active') {
    return '审理中';
  }
  return '待审';
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DefinitionList({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="definition-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SeverityDots({ value }: { value: number }) {
  return (
    <div className="severity-block" aria-label={`严重度 ${value}`}>
      <span>严重度 {value}</span>
      <div className="severity-dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <i className={index < value ? 'severity-dot-active' : ''} key={index} />
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
    <div className="score-comparison">
      <div className="score-summary">
        <article>
          <span>原文均分</span>
          <strong>{originalAverage.toFixed(1)}</strong>
        </article>
        <article>
          <span>改写后均分</span>
          <strong>{revisedAverage.toFixed(1)}</strong>
        </article>
        <article className="score-summary-highlight">
          <span>平均提升</span>
          <strong>{averageDelta >= 0 ? '+' : ''}{averageDelta.toFixed(1)}</strong>
        </article>
      </div>

      <div className="score-table">
        {rows.map((row) => (
          <article className="score-row" key={row.key}>
            <div className="score-row-heading">
              <div>
                <p>{row.label}</p>
                <span>
                  原文 {row.original} / 改写 {row.revised}
                </span>
              </div>
              <strong>{row.delta >= 0 ? '+' : ''}{row.delta}</strong>
            </div>
            <div className="score-tracks" aria-hidden="true">
              <div className="score-track">
                <i style={{ width: `${row.original * 10}%` }} />
              </div>
              <div className="score-track score-track-revised">
                <i style={{ width: `${row.revised * 10}%` }} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
