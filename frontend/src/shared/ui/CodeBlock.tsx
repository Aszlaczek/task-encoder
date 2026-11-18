type CodeBlockProps = {
  value: string;
  label: string;
};

/** Pole wynikowe z własnym przewijaniem — można je focusować klawiaturą. */
export function CodeBlock({ value, label }: CodeBlockProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <pre
        tabIndex={0}
        aria-label={label}
        className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        {value}
      </pre>
    </div>
  );
}
