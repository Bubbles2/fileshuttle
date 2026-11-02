import { KeyRound, PlugZap } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConnectionNoticeProps {
  problem: 'needs-link' | 'offline';
}

const CONTENT: Record<ConnectionNoticeProps['problem'], { title: string; icon: ReactNode; body: ReactNode }> = {
  'needs-link': {
    title: 'Open FileShuttle from its launch link',
    icon: <KeyRound size={20} strokeWidth={2} />,
    body: (
      <>
        This FileShuttle was started with <code className="font-mono text-caption">--require-key</code>, and this browser
        doesn’t have the key yet (or has an old one). Open the link printed in the terminal; it looks like{' '}
        <code className="font-mono text-caption">http://localhost:3000/#key=…</code>. You only need to do this once per
        browser.
      </>
    ),
  },
  offline: {
    title: 'FileShuttle’s server isn’t running',
    icon: <PlugZap size={20} strokeWidth={2} />,
    body: (
      <>
        Start it with <code className="font-mono text-caption">npm run dev</code> in the project folder, then open the link it
        prints.
      </>
    ),
  },
};

/** Shown when API calls would fail: no or outdated launch key, or no server. */
export function ConnectionNotice({ problem }: ConnectionNoticeProps) {
  const { title, icon, body } = CONTENT[problem];
  return (
    <section
      aria-labelledby="connection-title"
      className="flex items-start gap-3.5 rounded-panel border border-warning-line bg-warning-bg px-5 py-4 shadow-card"
    >
      <div aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-warning-soft text-warning-ink">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id="connection-title" className="m-0 text-lead font-bold text-warning-ink">
          {title}
        </h2>
        <p className="m-0 text-label text-warning-ink">{body}</p>
      </div>
    </section>
  );
}
