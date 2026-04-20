type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "focus-ring relative h-7 w-12 rounded-full transition",
        checked ? "bg-electric-blue" : "bg-mid-gray"
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-6" : "left-1"
        ].join(" ")}
      />
    </button>
  );
}
