import { memo } from "react";
import type { PriceRange } from "./types";

const ABSOLUTE_MIN = 0;
const ABSOLUTE_MAX = 1000;
const STEP = 10;

const THUMB_CLASSES =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-200 " +
  "[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent focus-visible:[&::-webkit-slider-thumb]:outline focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-primary";

type PriceRangeFilterProps = {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
};

function PriceRangeFilterComponent({ value, onChange }: PriceRangeFilterProps) {
  const span = ABSOLUTE_MAX - ABSOLUTE_MIN;
  const minPercent = ((value.min - ABSOLUTE_MIN) / span) * 100;
  const maxPercent = ((value.max - ABSOLUTE_MIN) / span) * 100;

  const handleMinChange = (next: number) => {
    const clamped = Math.min(next, value.max - STEP);
    onChange({ ...value, min: Math.max(ABSOLUTE_MIN, clamped) });
  };

  const handleMaxChange = (next: number) => {
    const clamped = Math.max(next, value.min + STEP);
    onChange({ ...value, max: Math.min(ABSOLUTE_MAX, clamped) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-1.5 w-full rounded-full bg-outline-variant">
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          min={ABSOLUTE_MIN}
          max={ABSOLUTE_MAX}
          step={STEP}
          value={value.min}
          onChange={(event) => handleMinChange(Number(event.target.value))}
          className={`pointer-events-none absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent ${THUMB_CLASSES}`}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={ABSOLUTE_MIN}
          max={ABSOLUTE_MAX}
          step={STEP}
          value={value.max}
          onChange={(event) => handleMaxChange(Number(event.target.value))}
          className={`pointer-events-none absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent ${THUMB_CLASSES}`}
        />
      </div>

      <div className="flex items-center justify-between text-sm font-medium text-foreground">
        <span>${value.min}</span>
        <span>
          ${value.max}
          {value.max < ABSOLUTE_MAX ? "+" : ""}
        </span>
      </div>
    </div>
  );
}

export const PriceRangeFilter = memo(PriceRangeFilterComponent);
