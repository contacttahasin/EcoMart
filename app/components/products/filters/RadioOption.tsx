import { memo } from "react";

type RadioOptionProps = {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
};

function RadioOptionComponent({ id, name, label, checked, onChange }: RadioOptionProps) {
  return (
    <label
      htmlFor={id}
      className="group -mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-secondary-container/50"
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-outline-variant bg-white transition-colors duration-200 checked:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <span className="pointer-events-none absolute h-2 w-2 scale-0 rounded-full bg-primary transition-transform duration-200 peer-checked:scale-100" />
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export const RadioOption = memo(RadioOptionComponent);
