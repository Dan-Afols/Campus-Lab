import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Option = { value: string; label: string };

type SelectProps = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function Select({ label, value, options, onChange }: SelectProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  return (
    <label className="grid gap-2">
      <span className="text-label text-dark-gray dark:text-mid-gray">{label}</span>
      <div className="rounded-md border border-mid-gray/40 bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center gap-2 border-b border-mid-gray/20 px-3 py-2">
          <Search className="h-4 w-4 text-mid-gray" />
          <input
            className="focus-ring w-full border-0 bg-transparent text-body-sm"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="focus-ring h-11 w-full rounded-md border-0 bg-transparent px-3 text-body-md"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {filtered.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
