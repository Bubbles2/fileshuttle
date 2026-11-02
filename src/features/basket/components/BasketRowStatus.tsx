import { Check, CircleAlert, CircleMinus, CircleStop, LoaderCircle, X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';
import { StatusPill } from '../../../components/ui/StatusPill';
import type { CopyItemProgress, CopyPhase } from '../../copy/types';

interface BasketRowStatusProps {
  id: string;
  name: string;
  progress: CopyItemProgress | undefined;
  phase: CopyPhase;
  onRemove: (id: string) => void;
}

/** A remove button before copying; a status pill once the copy starts. */
export function BasketRowStatus({ id, name, progress, phase, onRemove }: BasketRowStatusProps) {
  if (phase === 'idle') {
    return (
      <IconButton
        variant="ghost"
        label={`Remove ${name} from the basket`}
        data-remove-item={id}
        onClick={() => {
          onRemove(id);
        }}
      >
        <X size={18} strokeWidth={2.2} aria-hidden="true" />
      </IconButton>
    );
  }

  switch (progress?.status) {
    case 'copying':
      return (
        <StatusPill tone="info" icon={<LoaderCircle size={14} strokeWidth={2.6} aria-hidden="true" className="motion-safe:animate-spin" />}>
          Copying…
        </StatusPill>
      );
    case 'copied':
      return (
        <StatusPill tone="success" icon={<Check size={14} strokeWidth={3} aria-hidden="true" />}>
          Copied
        </StatusPill>
      );
    case 'skipped':
      return (
        <StatusPill tone="neutral" icon={<CircleMinus size={14} strokeWidth={2.6} aria-hidden="true" />}>
          Skipped
        </StatusPill>
      );
    case 'failed':
      return (
        <StatusPill tone="danger" icon={<CircleAlert size={14} strokeWidth={2.6} aria-hidden="true" />}>
          Failed
        </StatusPill>
      );
    case 'stopped':
      return (
        <StatusPill tone="neutral" icon={<CircleStop size={14} strokeWidth={2.6} aria-hidden="true" />}>
          Stopped
        </StatusPill>
      );
    default:
      return <StatusPill tone="neutral">Waiting</StatusPill>;
  }
}
