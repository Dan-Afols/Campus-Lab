type SegmentItem = { value: string; label: string };

type SegmentedControlProps = {
  items: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ items, value, onChange }: SegmentedControlProps) {
  return (
    <div className="grid min-h-[44px] grid-cols-2 rounded-full bg-light-gray p-1 dark:bg-dark-border">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[
            "focus-ring rounded-full px-3 py-2 text-body-sm",
            item.value === value ? "bg-white text-near-black shadow-level-1" : "text-dark-gray dark:text-mid-gray"
          ].join(" ")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
