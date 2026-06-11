import { UpdateIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';

import { buildLiveDocket } from '../lib/liveParsing';
import { trialFlowStages, type TrialAnalysisState } from '../lib/trial';

interface LiveAnalysisProps {
  analysisState: TrialAnalysisState;
  compact?: boolean;
  streamText: string;
}

export function LiveAnalysis({
  analysisState,
  compact = false,
  streamText,
}: LiveAnalysisProps) {
  const liveDocket = useMemo(() => buildLiveDocket(streamText), [streamText]);
  const activeStageIndex = Math.max(analysisState.stageIndex, liveDocket.latestStageIndex);
  const activeStage = trialFlowStages[activeStageIndex] ?? trialFlowStages[0];
  const progress = ((activeStageIndex + 1) / trialFlowStages.length) * 100;

  return (
    <div className={`court-live-analysis ${compact ? 'compact' : ''}`}>
      <div className="court-live-header">
        <div className="court-live-title">
          <UpdateIcon className="spin" width={20} height={20} />
          <h3>庭审进行中... [{activeStage.label}]</h3>
        </div>
        <div className="court-progress-bar">
          <i style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>

      <div className="court-live-docket">
        {liveDocket.items.map((item, i) => (
          <div 
            className={`court-live-card status-${item.status}`} 
            key={item.key}
            style={{ transform: `rotate(${(i % 2 === 0 ? 0.8 : -0.7)}deg)` }}
          >
            <strong>{item.label}</strong>
            <p>
              {item.summary}
              {item.status === 'active' && <span className="court-stenographer-cursor" />}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
