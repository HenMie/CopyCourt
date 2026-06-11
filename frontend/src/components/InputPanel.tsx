import {
  ExclamationTriangleIcon,
  UpdateIcon,
  MagicWandIcon,
  MixerHorizontalIcon,
  ChevronDownIcon
} from '@radix-ui/react-icons';
import type { FormEvent } from 'react';

import type { TrialRequest } from '../types';
import { findOptionLabel, intensityOptions, objectiveOptions, platformOptions } from '../lib/trial';

interface ExampleItem {
  id: string;
  label: string;
  payload: TrialRequest;
}

interface InputPanelProps {
  form: TrialRequest;
  examples: ExampleItem[];
  originalLength: number;
  isLoading: boolean;
  canSubmit: boolean;
  error: string | null;
  hasResult: boolean;
  hasStaleDraft: boolean;
  isCollapsed: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onExampleSelect: (payload: TrialRequest) => void;
  onFieldChange: <K extends keyof TrialRequest>(field: K, value: TrialRequest[K]) => void;
  onExpand: () => void;
  onAbort: () => void;
}

export function InputPanel({
  form,
  examples,
  originalLength,
  isLoading,
  canSubmit,
  error,
  hasResult,
  hasStaleDraft,
  isCollapsed,
  onSubmit,
  onExampleSelect,
  onFieldChange,
  onExpand,
  onAbort,
}: InputPanelProps) {
  if (isCollapsed) {
    return (
      <div className="court-collapsed-input">
        <button className="court-edit-btn" onClick={onExpand} type="button">
          <MixerHorizontalIcon width={14} height={14} />
          <span>调整配置与重新评估</span>
        </button>
      </div>
    );
  }

  const isNearingLimit = originalLength > 2800;

  return (
    <section className="court-input-stage" aria-labelledby="court-title">
      <div className="court-stage-header">
        <h2 id="court-title">文案审判庭</h2>
        <p>提交案卷，庭审即刻开始。接受多维度、无情的审判与重构。</p>
      </div>

      <div className="court-scanner-box">
        <form className="court-form" onSubmit={onSubmit}>
          <div className={`court-textarea-wrapper ${isNearingLimit ? 'nearing-limit' : ''}`}>
             <textarea
              id="original_text"
              className="court-textarea"
              maxLength={3000}
              minLength={20}
              onChange={(event) => onFieldChange('original_text', event.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  if (canSubmit && !isLoading) {
                    onSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }
              }}
              placeholder="请在此呈交涉案文案 (至少 20 字)..."
              required
              value={form.original_text}
            />
            <div className="court-textarea-footer">
              <span className={`char-count ${originalLength < 20 ? 'invalid' : ''} ${isNearingLimit ? 'warning' : ''}`}>
                {originalLength}/3000 字
              </span>
            </div>
          </div>

          <div className="court-options-pill-bar">
            <div className="court-pill-group">
              <div className="court-pill-select-wrapper">
                <select
                  className="court-pill-select"
                  onChange={(event) => onFieldChange('target_platform', event.target.value as TrialRequest['target_platform'])}
                  value={form.target_platform}
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="court-select-icon" />
              </div>
              <div className="court-pill-select-wrapper">
                <select
                  className="court-pill-select"
                  onChange={(event) => onFieldChange('objective', event.target.value as TrialRequest['objective'])}
                  value={form.objective}
                >
                  {objectiveOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="court-select-icon" />
              </div>
              <div className="court-pill-select-wrapper">
                <select
                  className="court-pill-select"
                  onChange={(event) => onFieldChange('intensity', event.target.value as TrialRequest['intensity'])}
                  value={form.intensity}
                >
                  {intensityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label} ({option.hint})</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="court-select-icon" />
              </div>
            </div>
            
            {isLoading ? (
              <button className="court-submit-btn abort-btn" type="button" onClick={onAbort}>
                <UpdateIcon className="spin" width={18} height={18} />
                <span>Objection! (停止审判)</span>
              </button>
            ) : (
              <button className="court-submit-btn" disabled={!canSubmit} type="submit">
                <MagicWandIcon className="court-icon" width={18} height={18} />
                <span>
                  {hasResult ? '重审本案' : (
                    <>
                      敲锤立案 <kbd className="court-kbd">⌘</kbd>+<kbd className="court-kbd">Enter</kbd>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
          
          {error && (
            <div className="court-error" role="alert">
              <ExclamationTriangleIcon width={16} height={16} />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      <div className="court-examples">
        <span className="court-examples-title">调阅过往卷宗：</span>
        <div className="court-examples-list">
          {examples.map((example) => (
            <button
              className="court-example-btn"
              key={example.id}
              onClick={() => onExampleSelect(example.payload)}
              type="button"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
