import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    id,
    type = 'text',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`w-full rounded-lg border bg-white dark:bg-navy-950/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            Icon ? 'pl-10 pr-3.5' : 'px-3.5'
          } py-2.5 min-h-[44px] ${
            error
              ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
              : 'border-slate-300 dark:border-navy-700'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    id,
    rows = 4,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        className={`w-full rounded-lg border bg-white dark:bg-navy-950/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 px-3.5 py-2.5 ${
          error
            ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
            : 'border-slate-300 dark:border-navy-700'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    options = [],
    className = '',
    id,
    required = false,
    placeholder = 'Select an option',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        required={required}
        className={`w-full rounded-lg border bg-white dark:bg-navy-950/60 text-slate-900 dark:text-slate-100 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 px-3.5 py-2.5 min-h-[44px] ${
          error
            ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
            : 'border-slate-300 dark:border-navy-700'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
});
