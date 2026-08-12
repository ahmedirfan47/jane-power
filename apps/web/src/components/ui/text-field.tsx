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
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-txt outline-none transition placeholder:text-muted-2 focus:border-gold/60"
      />
    </label>
  );
}