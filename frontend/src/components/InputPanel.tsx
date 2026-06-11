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
}: InputPanelProps) {
  if (isCollapsed) {
    return (
      <div className="holo-collapsed-input">
        <button className="holo-edit-btn" onClick={onExpand} type="button">
          <MixerHorizontalIcon width={14} height={14} />
          <span>调整配置与重新评估</span>
        </button>
      </div>
    );
  }

  return (
    <section className="holo-input-stage" aria-labelledby="holo-title">
      <div className="holo-stage-header">
        <h2 id="holo-title">文案分析工作台</h2>
        <p>输入原始文案，配置传播要素，系统将自动进行多维度的结构化评估与高级重构。</p>
      </div>

      <div className="holo-scanner-box">
        <form className="holo-form" onSubmit={onSubmit}>
          <div className="holo-textarea-wrapper">
             <textarea
              id="original_text"
              className="holo-textarea"
              maxLength={3000}
              minLength={20}
              onChange={(event) => onFieldChange('original_text', event.target.value)}
              placeholder="请在此输入需要评估的原始文案内容 (至少 20 字)..."
              required
              value={form.original_text}
            />
            <div className="holo-textarea-footer">
              <span className={`char-count ${originalLength < 20 ? 'invalid' : ''}`}>
                {originalLength}/3000 字
              </span>
            </div>
          </div>

          <div className="holo-options-pill-bar">
            <div className="holo-pill-group">
              <div className="holo-pill-select-wrapper">
                <select
                  className="holo-pill-select"
                  onChange={(event) => onFieldChange('target_platform', event.target.value as TrialRequest['target_platform'])}
                  value={form.target_platform}
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="holo-select-icon" />
              </div>
              <div className="holo-pill-select-wrapper">
                <select
                  className="holo-pill-select"
                  onChange={(event) => onFieldChange('objective', event.target.value as TrialRequest['objective'])}
                  value={form.objective}
                >
                  {objectiveOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="holo-select-icon" />
              </div>
              <div className="holo-pill-select-wrapper">
                <select
                  className="holo-pill-select"
                  onChange={(event) => onFieldChange('intensity', event.target.value as TrialRequest['intensity'])}
                  value={form.intensity}
                >
                  {intensityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label} ({option.hint})</option>
                  ))}
                </select>
                <ChevronDownIcon width={14} height={14} className="holo-select-icon" />
              </div>
            </div>
            
            <button className="holo-submit-btn" disabled={!canSubmit} type="submit">
               {isLoading ? (
                 <UpdateIcon className="spin holo-icon-pulse" width={18} height={18} />
               ) : (
                 <MagicWandIcon className="holo-icon" width={18} height={18} />
               )}
               <span>{hasResult ? '重新生成' : '启动深度分析'}</span>
            </button>
          </div>
          
          {error && (
            <div className="holo-error" role="alert">
              <ExclamationTriangleIcon width={16} height={16} />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      <div className="holo-examples">
        <span className="holo-examples-title">快速装载测试样例：</span>
        <div className="holo-examples-list">
          {examples.map((example) => (
            <button
              className="holo-example-btn"
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
