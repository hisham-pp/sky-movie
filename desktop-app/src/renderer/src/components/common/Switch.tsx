export function Switch({
  checked,
  onChange,
  label,
  id
}: {
  checked: boolean;
  onChange(checked: boolean): void;
  label: string;
  id?: string;
}) {
  return (
    <label className="switch-row" htmlFor={id}>
      <span className="switch-track">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-thumb" aria-hidden="true" />
      </span>
      {label}
    </label>
  );
}
