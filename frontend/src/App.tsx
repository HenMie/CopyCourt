import {
  Scale,
} from 'lucide-react';
import { FormEvent, useMemo, useRef, useState } from 'react';

import { streamTrial, TrialApiError, type TrialStreamEvent } from './api';
import { InputPanel } from './components/InputPanel';
import { ResultShell } from './components/ResultShell';
import { examples } from './examples';
import { areTrialRequestsEqual, normalizeTrialRequest, trialFlowStages, type TrialAnalysisState } from './lib/trial';
import type { TrialRequest, TrialResponse } from './types';

const initialForm = examples[0].payload;

function App() {
  const [form, setForm] = useState<TrialRequest>(initialForm);
  const [submittedForm, setSubmittedForm] = useState<TrialRequest | null>(null);
  const [result, setResult] = useState<TrialResponse | null>(null);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const [analysisState, setAnalysisState] = useState<TrialAnalysisState>({
    requestId: 0,
    status: 'idle',
    stageIndex: 0,
    startedAt: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const originalLength = form.original_text.trim().length;
  const canSubmit = originalLength >= 20 && originalLength <= 3000 && !isLoading;
  const normalizedDraft = useMemo(() => normalizeTrialRequest(form), [form]);
  const hasStaleDraft = submittedForm ? !areTrialRequestsEqual(normalizedDraft, submittedForm) : false;
  const hasAnalysisSurface = isLoading || Boolean(result);
  const isInputCollapsed = hasAnalysisSurface && !isInputExpanded;
  const workspaceClassName = [
    'workspace',
    hasAnalysisSurface ? 'workspace-has-results' : 'workspace-intake',
    hasAnalysisSurface ? (isInputCollapsed ? 'workspace-result-focus' : 'workspace-input-focus') : null,
  ]
    .filter(Boolean)
    .join(' ');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    const requestId = analysisState.requestId + 1;

    setIsLoading(true);
    setIsInputExpanded(false);
    setError(null);
    setStreamText('');
    setAnalysisState({
      requestId,
      status: 'running',
      stageIndex: 0,
      startedAt: Date.now(),
    });

    try {
      const nextResult = await streamTrial(
        normalizedDraft,
        (streamEvent) => handleStreamEvent(streamEvent, requestId),
        abortController.signal,
      );
      setResult(nextResult);
      setSubmittedForm(normalizedDraft);
      setAnalysisState((current) =>
        current.requestId === requestId
          ? { ...current, status: 'settling', stageIndex: trialFlowStages.length - 1 }
          : current,
      );
    } catch (caughtError) {
      if (!(caughtError instanceof DOMException && caughtError.name === 'AbortError')) {
        const message =
          caughtError instanceof TrialApiError ? caughtError.message : '审判请求失败，请检查后端服务是否运行。';
        setError(message);
        setIsInputExpanded(true);
        setAnalysisState((current) => (current.requestId === requestId ? { ...current, status: 'idle' } : current));
      }
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  }

  function handleStreamEvent(streamEvent: TrialStreamEvent, requestId: number) {
    if (streamEvent.type === 'delta') {
      setStreamText(streamEvent.accumulatedText);
      setAnalysisState((current) =>
        current.requestId === requestId
          ? {
              ...current,
              stageIndex: inferStageIndex(streamEvent.accumulatedText, current.stageIndex),
            }
          : current,
      );
    }

    if (streamEvent.type === 'complete') {
      setAnalysisState((current) =>
        current.requestId === requestId
          ? {
              ...current,
              status: 'settling',
              stageIndex: trialFlowStages.length - 1,
            }
          : current,
      );
    }
  }

  function handleFieldChange<K extends keyof TrialRequest>(field: K, value: TrialRequest[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="app-shell">
      <header className="court-header">
        <div className="court-header-copy">
          <p className="overline">CopyCourt</p>
          <h1>文案审判庭</h1>
          <p className="court-header-note">从问题识别到改写复审，完整呈现文案优化依据。</p>
        </div>
        <div className="status-strip" aria-label="当前模式">
          <Scale aria-hidden="true" size={18} />
          <span>文案分析工作台</span>
        </div>
      </header>

      <div className={workspaceClassName}>
        <InputPanel
          canSubmit={canSubmit}
          error={error}
          examples={examples}
          form={form}
          hasResult={Boolean(result)}
          hasStaleDraft={hasStaleDraft}
          isCollapsed={isInputCollapsed}
          isLoading={isLoading}
          onExpand={() => setIsInputExpanded(true)}
          onExampleSelect={(payload) => {
            setForm(payload);
            setError(null);
            setIsInputExpanded(true);
          }}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          originalLength={originalLength}
        />
        {hasAnalysisSurface ? (
          <ResultShell
            analysisState={analysisState}
            hasStaleDraft={hasStaleDraft}
            isLoading={isLoading}
            result={result}
            submittedForm={submittedForm}
            streamText={streamText}
          />
        ) : null}
      </div>
    </main>
  );
}

function inferStageIndex(text: string, fallback: number): number {
  const stageNeedles = [
    '"case_summary"',
    '"prosecution"',
    '"defense"',
    '"jury"',
    '"verdict"',
    '"rewritten_copy"',
    '"review_scores"',
  ];

  const nextIndex = stageNeedles.reduce((latest, needle, index) => (text.includes(needle) ? index : latest), 0);
  return Math.max(fallback, nextIndex);
}

export default App;
