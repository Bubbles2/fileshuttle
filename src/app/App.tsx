import { lazy, Suspense, useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { ConnectionNotice } from '../components/layout/ConnectionNotice';
import { Sidebar, type View } from '../components/layout/Sidebar';
import { BasketPanel } from '../features/basket/components/BasketPanel';
import { CopyOptionsCard } from '../features/copy/components/CopyOptionsCard';
import { InputListCard } from '../features/inventory/components/InputListCard';
import { SourceListPanel } from '../features/inventory/components/SourceListPanel';
import { useFileShuttle } from './useFileShuttle';
import { useServerConnection } from './useServerConnection';

// The Markdown renderer is only downloaded when a guide is first opened.
const GuideView = lazy(async () => ({ default: (await import('../features/guides/components/GuideView')).GuideView }));

export function App() {
  const shuttle = useFileShuttle();
  const connection = useServerConnection();
  const [view, setView] = useState<View>('library');

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader steps={shuttle.steps} />
      <div className="flex flex-col lg:flex-row lg:items-start">
        <Sidebar view={view} onChange={setView} />
        <main className="mx-auto flex w-full max-w-330 min-w-0 flex-col gap-6 px-4 pt-7 pb-12 sm:px-8">
          {(connection === 'needs-link' || connection === 'offline') && <ConnectionNotice problem={connection} />}
          {/* The library stays mounted while a guide is open, so filters and ticks survive the switch. */}
          <div hidden={view !== 'library'} className="flex flex-col gap-6">
            <InputListCard {...shuttle.input} />
            <div className="flex flex-wrap items-start gap-6">
              <SourceListPanel key={shuttle.sourceKey} {...shuttle.source} />
              <section aria-labelledby="basket-title" className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
                <BasketPanel {...shuttle.basket} />
                <CopyOptionsCard {...shuttle.copy} />
              </section>
            </div>
          </div>
          {view !== 'library' && (
            <Suspense fallback={<p className="m-0 text-label text-muted">Loading the guide…</p>}>
              <GuideView
                key={view}
                name={view}
                destination={shuttle.copy.destination}
                destinationError={shuttle.copy.destinationError}
                policy={shuttle.copy.policy}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
