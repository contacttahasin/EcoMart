import { Check } from "lucide-react";
import { memo } from "react";
import type { ReactNode } from "react";

type CheckboxOptionProps = {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
};

function CheckboxOptionComponent({ id, label, checked, onChange, ariaLabel }: CheckboxOptionProps) {
  return (
    <label
      htmlFor={id}
      className="group -mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-secondary-container/50"
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.checked)}
          className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-outline-variant bg-white transition-colors duration-200 checked:border-primary checked:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute h-3 w-3 scale-0 text-white transition-transform duration-200 peer-checked:scale-100"
        />
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export const CheckboxOption = memo(CheckboxOptionComponent);
