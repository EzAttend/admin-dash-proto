interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#e5e5e5]">
        {label}
        {required && <span className="text-accent-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#737373]">{hint}</p>}
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2 border border-[#333] rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all text-white placeholder:text-[#525252]';

export const selectClass =
  'w-full px-3 py-2 border border-[#333] rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all text-white';
