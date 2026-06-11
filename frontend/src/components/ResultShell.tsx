import {
  ExclamationTriangleIcon,
  UpdateIcon,
  ChatBubbleIcon,
  CheckCircledIcon,
  MagicWandIcon,
  PersonIcon,
  LightningBoltIcon,
  ReaderIcon,
  CopyIcon
} from '@radix-ui/react-icons';
import { useState } from 'react';

import { LiveAnalysis } from './LiveAnalysis';
import { ScoreComparison } from './ScoreComparison';
import {
  findOptionLabel,
  intensityOptions,
  objectiveOptions,
  platformOptions,
} from '../lib/trial';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy = `【文案审判庭 - 重构卷宗】\n\n改写策略：${result.verdict.rewrite_strategy}\n\n标题：${result.rewritten_copy.title}\n\n正文：\n${result.rewritten_copy.body}\n\n行动呼吁(CTA)：\n${result.rewritten_copy.cta}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isLoading && !result) {
    return (
      <section className="court-result-shell court-shell-loading" aria-live="polite">
        <LiveAnalysis analysisState={analysisState} streamText={streamText} />
      </section>
    );
  }

  if (!result || !submittedForm) {
    return null;
  }

  return (
    <section className="court-result-shell" aria-label="分析评估结果">
      <header className="court-result-header">
        <div className="court-result-title">
          <ReaderIcon className="court-accent-icon" width={24} height={24} />
          <h2>智能评估视图</h2>
          <span className="court-meta-tags">
            {findOptionLabel(platformOptions, submittedForm.target_platform)} |{' '}
            {findOptionLabel(objectiveOptions, submittedForm.objective)} |{' '}
            {findOptionLabel(intensityOptions, submittedForm.intensity)}
          </span>
        </div>
      </header>

      {hasStaleDraft && (
        <div className="court-banner warning" role="status">
          <ExclamationTriangleIcon width={16} height={16} />
          <span>系统提示：检测到当前面板参数与展示的评估数据不一致，请点击“重审本案”以获取最新分析结果。</span>
        </div>
      )}

      {isLoading && (
        <div className="court-banner loading" role="status">
          <UpdateIcon className="spin" width={16} height={16} />
          <span>数据流正在处理中，新的分析报告即将生成。</span>
        </div>
      )}

      {isLoading && <LiveAnalysis compact analysisState={analysisState} streamText={streamText} />}

      <div className="court-dashboard-grid">
        {/* 左侧：分数雷达/柱状图面板 */}
        <div className="court-panel court-panel-scores">
          <div className="court-panel-header">
            <ChatBubbleIcon width={18} height={18} />
            <h3>质量提升对比</h3>
          </div>
          <ScoreComparison scores={result.review_scores} />
        </div>

        {/* 中间：评审动态气泡 */}
        <div className="court-panel court-panel-chat">
          <div className="court-panel-header">
            <PersonIcon width={18} height={18} />
            <h3>合议庭分析明细</h3>
          </div>
          <div className="court-chat-flow">
            {result.prosecution.map((item, i) => (
              <div 
                className="court-chat-bubble prosecution" 
                key={`p-${i}`}
                style={{ transform: `rotate(${(i % 2 === 0 ? 0.7 : -0.8) * (i % 3 === 0 ? 1.2 : 0.8)}deg)` }}
              >
                <span className="chat-avatar"><ExclamationTriangleIcon width={14} height={14}/> 缺陷诊断</span>
                <div className="chat-content">
                  <strong>{item.charge}</strong>
                  <p>{item.evidence}</p>
                </div>
              </div>
            ))}
            {result.defense.map((item, i) => (
              <div 
                className="court-chat-bubble defense" 
                key={`d-${i}`}
                style={{ transform: `rotate(${(i % 2 === 0 ? -0.6 : 0.7) * (i % 3 === 0 ? 1.1 : 0.9)}deg)` }}
              >
                <span className="chat-avatar"><CheckCircledIcon width={14} height={14}/> 优势保留</span>
                <div className="chat-content">
                  <strong>{item.strength}</strong>
                  <p>{item.reason}</p>
                </div>
              </div>
            ))}
            {result.jury.map((item, i) => (
              <div 
                className="court-chat-bubble jury" 
                key={`j-${i}`}
                style={{ transform: `rotate(${(i % 2 === 0 ? 0.5 : -0.5) * (i % 3 === 0 ? 1.3 : 0.7)}deg)` }}
              >
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
        <div className="court-panel court-panel-rewrite">
          <div className="court-panel-header glowing">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MagicWandIcon width={18} height={18} />
              <h3>判决：重构文案</h3>
            </div>
            <button 
              className={`court-copy-btn${copied ? ' copied' : ''}`}
              onClick={handleCopy}
              type="button"
            >
              {copied ? <CheckCircledIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
              <span>{copied ? '已录入案卷' : '复制重构文案'}</span>
            </button>
          </div>
          <div className="court-verdict-summary">
            <strong>改写策略:</strong> {result.verdict.rewrite_strategy}
          </div>
          <div className="court-rewritten-artifact">
            <div className={`court-stamp-badge${!isLoading ? ' stamped' : ''}`}>已判决</div>
            <h4>{result.rewritten_copy.title}</h4>
            <p className="court-body">{result.rewritten_copy.body}</p>
            <div className="court-cta">
              <LightningBoltIcon width={14} height={14}/>
              <span>{result.rewritten_copy.cta}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
