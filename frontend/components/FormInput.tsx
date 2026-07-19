export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
      />
    </label>
  );
}
