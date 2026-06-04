import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  ClipboardPenLine,
  Gavel,
  Loader2,
  PencilLine,
} from 'lucide-react';
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
      <section className="input-panel input-panel-collapsed" aria-labelledby="docket-title">
        <header className="panel-head">
          <div className="panel-head-title">
            <div className="panel-head-icon">
              <ClipboardPenLine aria-hidden="true" size={18} />
            </div>
            <div>
              <p className="eyebrow">Case Intake</p>
              <h2 id="docket-title">提交案卷</h2>
            </div>
          </div>
        </header>

        <div className="collapsed-docket" aria-label="当前案卷摘要">
          <span>当前案卷</span>
          <strong>{originalLength} 字</strong>
          <p>
            {findOptionLabel(platformOptions, form.target_platform)} / {findOptionLabel(objectiveOptions, form.objective)} /{' '}
            {findOptionLabel(intensityOptions, form.intensity)}
          </p>
        </div>

        <button className="secondary-button" onClick={onExpand} type="button">
          <PencilLine aria-hidden="true" size={16} />
          <span>修改案卷</span>
        </button>
      </section>
    );
  }

  return (
    <section className="input-panel" aria-labelledby="docket-title">
      <header className="panel-head">
        <div className="panel-head-title">
          <div className="panel-head-icon">
            <ClipboardPenLine aria-hidden="true" size={20} />
          </div>
          <div>
            <p className="eyebrow">Case Intake</p>
            <h2 id="docket-title">提交案卷</h2>
          </div>
        </div>
      </header>

      <div className="intake-note">
        <p>输入原始文案、平台与目标后，系统将生成完整审判记录、改写稿与复审评分提升。</p>
      </div>

      <div className="example-group" aria-label="内置示例">
        {examples.map((example) => (
          <button
            className="example-button"
            key={example.id}
            onClick={() => onExampleSelect(example.payload)}
            type="button"
          >
            <BookOpenCheck aria-hidden="true" size={16} />
            <span>{example.label}</span>
          </button>
        ))}
      </div>

      {hasStaleDraft ? (
        <div className="draft-alert" role="status">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>表单已更改，结果未更新。重新开庭后将生成新的审判记录。</span>
        </div>
      ) : null}

      <form className="trial-form" onSubmit={onSubmit}>
        <label className="field-block" htmlFor="original_text">
          <span>原始文案</span>
          <textarea
            id="original_text"
            aria-describedby="copy-length"
            maxLength={3000}
            minLength={20}
            onChange={(event) => onFieldChange('original_text', event.target.value)}
            placeholder="输入需要审判和改写的文案"
            required
            value={form.original_text}
          />
        </label>

        <div className="field-meta" id="copy-length">
          <span>{originalLength}/3000</span>
          <span>{originalLength < 20 ? '至少 20 字才能立案' : '案卷已达到立案长度'}</span>
        </div>

        <div className="field-grid">
          <label className="field-block" htmlFor="target_platform">
            <span>目标平台</span>
            <select
              id="target_platform"
              onChange={(event) => onFieldChange('target_platform', event.target.value as TrialRequest['target_platform'])}
              value={form.target_platform}
            >
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block" htmlFor="audience">
            <span>目标受众</span>
            <input
              id="audience"
              maxLength={160}
              onChange={(event) => onFieldChange('audience', event.target.value)}
              placeholder="可留空，由模型辅助推断"
              value={form.audience ?? ''}
            />
          </label>
        </div>

        <fieldset className="choice-field">
          <legend>传播目标</legend>
          <div className="segmented-control segmented-control-objective">
            {objectiveOptions.map((option) => (
              <label key={option.value}>
                <input
                  checked={form.objective === option.value}
                  name="objective"
                  onChange={() => onFieldChange('objective', option.value)}
                  type="radio"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-field">
          <legend>语气强度</legend>
          <div className="intensity-grid">
            {intensityOptions.map((option) => (
              <label className={`tone-card${form.intensity === option.value ? ' tone-card-active' : ''}`} key={option.value}>
                <input
                  checked={form.intensity === option.value}
                  name="intensity"
                  onChange={() => onFieldChange('intensity', option.value)}
                  type="radio"
                />
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <div className="error-banner" role="alert">
            <AlertTriangle aria-hidden="true" size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <button className="submit-button" disabled={!canSubmit} type="submit">
          {isLoading ? <Loader2 aria-hidden="true" className="spin" size={18} /> : <Gavel aria-hidden="true" size={18} />}
          <span>{hasResult ? '重新开庭' : '开庭审判'}</span>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
    </section>
  );
}
