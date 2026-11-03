import { useId } from 'react';
import type { Platform } from '../../../app/defaults';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'Mac' },
];

interface PlatformPickerProps {
  value: Platform;
  disabled: boolean;
  onChange: (value: Platform) => void;
}

/** Segmented control built on native radios, like the conflict policy picker. Mac fills in the Mac folders. */
export function PlatformPicker({ value, disabled, onChange }: PlatformPickerProps) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-label font-bold">Computer</legend>
      <div className="flex flex-wrap gap-1 rounded-row bg-chip p-1">
        {PLATFORMS.map((platform) => (
          <label
            key={platform.value}
            className="flex min-h-11 flex-[1_1_120px] cursor-pointer items-center justify-center rounded-tile text-label font-bold text-muted transition-[background-color,color,box-shadow] hover:text-ink has-checked:bg-surface has-checked:text-ink has-checked:shadow-segment has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed"
          >
            <input
              type="radio"
              name={name}
              value={platform.value}
              checked={value === platform.value}
              onChange={() => {
                onChange(platform.value);
              }}
              className="sr-only"
            />
            {platform.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
