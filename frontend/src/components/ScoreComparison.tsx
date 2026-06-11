import { useMemo } from 'react';

import { AnimatedNumber } from './AnimatedNumber';
import { buildScoreRows, calculateAverageScore } from '../lib/trial';
import type { TrialResponse } from '../types';

interface ScoreComparisonProps {
  scores: TrialResponse['review_scores'];
}

export function ScoreComparison({ scores }: ScoreComparisonProps) {
  const rows = useMemo(() => buildScoreRows(scores), [scores]);
  const originalAverage = calculateAverageScore(scores.original);
  const revisedAverage = calculateAverageScore(scores.revised);

  return (
    <div className="court-scores">
      <div className="court-scores-hero">
        <div className="court-score-circle original">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray={`${originalAverage * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="score-text">
            <span>原稿均分</span>
            <strong><AnimatedNumber value={originalAverage} /></strong>
          </div>
        </div>
        <div className="court-score-circle revised score-animate">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray={`${revisedAverage * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="score-text">
            <span>改写均分</span>
            <strong><AnimatedNumber value={revisedAverage} /></strong>
          </div>
        </div>
      </div>

      <div className="court-score-list">
        {rows.map((row) => (
          <div className="court-score-row" key={row.key}>
            <div className="row-info">
              <span>{row.label}</span>
              <strong className={row.delta > 0 ? 'positive' : ''}>{row.delta > 0 ? '+' : ''}{row.delta}</strong>
            </div>
            <div className="row-track">
              <div className="track-inner original" style={{ transform: `scaleX(${row.original / 10})` }} />
              <div className="track-inner revised" style={{ transform: `scaleX(${row.revised / 10})` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="court-scores-seal">
        <span>⚖️ 审判宣告印记</span>
        <p>本案卷宗经合议庭无情审判，评定改写方案确有显著提升，特此签发判决书，准予复制执行。</p>
      </div>
    </div>
  );
}
