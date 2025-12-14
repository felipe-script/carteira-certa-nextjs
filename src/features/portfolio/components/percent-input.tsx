import { Input } from "@/components/ui/input";

export function PercentInput(props: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        className="pl-0 text-right tabular-nums"
        value={String(Number.isFinite(props.value) ? props.value : 0)}
        min={0}
        step={0.01}
        onChange={(e) => props.onChange(Number(e.target.value || 0))}
        aria-label={props.ariaLabel}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        %
      </span>
    </div>
  );
}