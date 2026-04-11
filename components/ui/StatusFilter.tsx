"use client";

interface FilterOption {
  label: string;
  value: string;
}

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

export default function StatusFilter({ value, onChange, options }: StatusFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input w-auto min-w-[140px]"
    >
      <option value="">All</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
