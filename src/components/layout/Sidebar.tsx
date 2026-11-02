import { Bot, Layers, ScrollText, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type View = 'library' | 'claude' | 'agents';

const ITEMS: { view: View; label: string; hint: string; Icon: LucideIcon; tile: string }[] = [
  { view: 'library', label: 'Skills & Agents', hint: 'Pick and copy skills and agents', Icon: Layers, tile: 'from-indigo-500 to-violet-500' },
  { view: 'claude', label: 'Spec', hint: 'CLAUDE_GENERAL_GUIDANCE.md', Icon: ScrollText, tile: 'from-amber-400 to-orange-500' },
  { view: 'agents', label: 'Agents', hint: 'AGENTS_GENERAL_GUIDANCE.md', Icon: Bot, tile: 'from-emerald-400 to-teal-600' },
];

interface SidebarProps {
  view: View;
  onChange: (view: View) => void;
}

/** Switches between the skills/agents library and the two guidance documents. A column on wide screens, a row on phones. */
export function Sidebar({ view, onChange }: SidebarProps) {
  return (
    <nav
      aria-label="Sections"
      className="flex gap-2 overflow-x-auto border-b border-chrome-line bg-surface px-3 py-2 lg:sticky lg:top-0 lg:h-screen lg:w-30 lg:flex-none lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0 lg:px-2 lg:py-5"
    >
      {ITEMS.map(({ view: itemView, label, hint, Icon, tile }) => {
        const active = view === itemView;
        return (
          <button
            key={itemView}
            type="button"
            title={hint}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              onChange(itemView);
            }}
            className={cn(
              'flex min-w-24 flex-none cursor-pointer flex-col items-center gap-1.5 rounded-panel border-2 px-2 py-2.5 text-caption font-bold transition-colors lg:min-w-0',
              active ? 'border-accent bg-accent-soft text-ink' : 'border-transparent text-ink-soft hover:bg-chip',
            )}
          >
            <span aria-hidden="true" className={cn('flex size-11 items-center justify-center rounded-control bg-linear-to-br text-white shadow-lifted', tile)}>
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
