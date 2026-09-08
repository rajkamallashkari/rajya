import { Switch } from "@/shared/ui";

export function PreferenceSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
      <span>{label}</span>
      <Switch aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
