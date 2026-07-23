import { Star } from "lucide-react";
import { memo } from "react";
import { CheckboxOption } from "./CheckboxOption";

const RATING_OPTIONS = [5, 4, 3, 2, 1];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: rating }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-primary text-primary" />
        ))}
      </span>
      <span className="text-sm text-foreground">&amp; Up</span>
    </span>
  );
}

type RatingFilterProps = {
  selected: number[];
  onToggle: (rating: number) => void;
  idPrefix?: string;
};

function RatingFilterComponent({ selected, onToggle, idPrefix = "" }: RatingFilterProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">Rating</legend>
      {RATING_OPTIONS.map((rating) => (
        <CheckboxOption
          key={rating}
          id={`${idPrefix}rating-${rating}`}
          label={<StarRow rating={rating} />}
          ariaLabel={`${rating} star${rating > 1 ? "s" : ""} & up`}
          checked={selected.includes(rating)}
          onChange={() => onToggle(rating)}
        />
      ))}
    </fieldset>
  );
}

export const RatingFilter = memo(RatingFilterComponent);
