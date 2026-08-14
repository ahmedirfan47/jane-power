export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="mb-5 block">
      <span className="t-label mb-2 block text-[10px]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full border border-rule bg-bg px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink-4"
        style={{ borderRadius: "var(--radius-sm)" }}
      />
    </label>
  );
}