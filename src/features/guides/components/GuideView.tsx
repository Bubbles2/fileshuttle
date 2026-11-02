import { CircleAlert, Copy, FileText, LoaderCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { ConflictPolicy, GuideName, GuideVariant } from '../../../../shared/api.ts';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { joinPath } from '../../../utils/paths';
import { useGuide } from '../hooks/useGuide';
import { useGuideCopy } from '../hooks/useGuideCopy';
import { GuideCopyResult } from './GuideCopyResult';
import { MarkdownContent } from './MarkdownContent';

const TITLES: Record<GuideName, string> = {
  claude: 'Spec: Claude general guidance',
  agents: 'Agents: general guidance',
};

/** The guide is copied into the destination folder under this name. */
export const GUIDE_COPY_NAME = 'spec.md';

interface GuideViewProps {
  name: GuideName;
  /** The Destination folder chosen on the Skills & Agents screen. */
  destination: string;
  destinationError: string | null;
  policy: ConflictPolicy;
}

/** Shows one guidance Markdown file (full or summary) and copies it into the destination as spec.md. */
export function GuideView({ name, destination, destinationError, policy }: GuideViewProps) {
  const [variant, setVariant] = useState<GuideVariant>('full');
  const { state, reload } = useGuide(name, variant);
  const guideCopy = useGuideCopy();
  const summary = variant === 'summary';
  const copyTarget = destinationError ? null : joinPath(destination.trim(), GUIDE_COPY_NAME);

  function copyGuide() {
    if (state.status !== 'ready' || !copyTarget) return;
    void guideCopy.copy({ source: state.guide.path, destination: destination.trim(), policy, targetName: GUIDE_COPY_NAME });
  }

  return (
    <Panel as="section" aria-labelledby="guide-title" className="flex flex-col gap-4 p-6 sm:p-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="guide-title" className="m-0 text-title font-extrabold">
            {TITLES[name]}
            {summary && ' (summary)'}
          </h2>
          {state.status === 'ready' && <span className="font-mono text-caption break-all text-muted">{state.guide.path}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={summary ? 'primary' : 'outline'}
            aria-pressed={summary}
            onClick={() => {
              setVariant(summary ? 'full' : 'summary');
              guideCopy.reset();
            }}
          >
            <FileText size={16} aria-hidden="true" />
            Summary
          </Button>
          <Button
            variant="outline"
            disabled={state.status !== 'ready' || !copyTarget || guideCopy.state.status === 'copying'}
            title={copyTarget ? `Copy to ${copyTarget}` : 'Choose a destination folder on the Skills & Agents screen first'}
            onClick={copyGuide}
          >
            <Copy size={16} aria-hidden="true" />
            {guideCopy.state.status === 'copying' ? 'Copying…' : 'Copy'}
          </Button>
          <Button variant="mutedText" onClick={reload} disabled={state.status === 'loading'}>
            <RefreshCw size={16} aria-hidden="true" />
            Reload
          </Button>
        </div>
        <p className="m-0 text-meta text-muted">
          {copyTarget ? (
            <>
              Copy saves the {summary ? 'summary' : 'full guide'} as <span className="font-mono text-ink">{copyTarget}</span>.
            </>
          ) : (
            'Choose a valid Destination folder on the Skills & Agents screen to enable Copy.'
          )}
        </p>
        {guideCopy.state.status === 'done' && <GuideCopyResult result={guideCopy.state.result} />}
      </div>

      {state.status === 'loading' && (
        <p className="m-0 flex items-center gap-2 text-label text-muted">
          <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin" />
          Loading…
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="m-0 flex items-start gap-2 rounded-control bg-warning-bg px-3 py-2 text-label font-semibold text-warning-ink">
          <CircleAlert size={18} aria-hidden="true" className="mt-0.5 flex-none" />
          {state.message}
        </p>
      )}
      {state.status === 'ready' && <MarkdownContent markdown={state.guide.content} />}
    </Panel>
  );
}
