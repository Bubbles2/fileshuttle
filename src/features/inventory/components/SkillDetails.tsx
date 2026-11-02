import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { pluralize } from '../../../utils/paths';
import type { InventoryItem } from '../types';

function Detail({ term, wide = false, children }: { term: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', wide && 'sm:col-span-2')}>
      <dt className="text-caption font-bold tracking-[0.06em] text-muted uppercase">{term}</dt>
      <dd className="m-0 text-meta break-words text-ink">{children}</dd>
    </div>
  );
}

function Tags({ values, mono = false }: { values: string[]; mono?: boolean }) {
  if (values.length === 0) return <span className="text-muted">None</span>;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {values.map((value) => (
        <li key={value} className={cn('rounded-md bg-chip px-2 py-0.5 text-caption text-ink-soft', mono && 'font-mono')}>
          {value}
        </li>
      ))}
    </ul>
  );
}

function copiesSummary({ copies, distinctVersions, worktreeCopies }: InventoryItem): string {
  const parts = [
    copies === null ? null : pluralize(copies, 'copy', 'copies'),
    distinctVersions === null ? null : pluralize(distinctVersions, 'distinct version'),
    worktreeCopies === null ? null : `${worktreeCopies} in worktree folders`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Not recorded';
}

/** Everything else the inventory knows about a skill, shown when its "Show details" box is ticked. */
export function SkillDetails({ id, item }: { id: string; item: InventoryItem }) {
  return (
    <dl id={id} className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 rounded-control border border-line bg-surface-subtle p-3.5 motion-safe:animate-enter sm:grid-cols-2">
      <Detail term="Category">{item.category || <span className="text-muted">Not set</span>}</Detail>
      <Detail term="Technology">{item.technology || <span className="text-muted">Not set</span>}</Detail>
      <Detail term="Copies">{copiesSummary(item)}</Detail>
      <Detail term="Other names in SKILL.md">
        <Tags values={item.otherNames} mono />
      </Detail>
      <Detail term={`Found in ${pluralize(item.foundIn.length, 'project')}`} wide>
        <Tags values={item.foundIn} mono />
      </Detail>
      <Detail term="Central copy" wide>
        <span className="font-mono text-caption">{item.centralCopy}</span>
        {item.location !== item.centralCopy && (
          <span className="mt-0.5 block font-mono text-caption text-muted">→ {item.location}</span>
        )}
      </Detail>
    </dl>
  );
}
