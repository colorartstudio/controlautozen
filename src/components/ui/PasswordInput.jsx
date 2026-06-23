import { useId, useState } from 'react'

function EyeIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M10.58 10.58A2 2 0 0 0 12 14a1.98 1.98 0 0 0 1.42-.58"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M9.88 5.09A9.77 9.77 0 0 1 12 4.8c4.68 0 8.63 2.91 10 7.2a10.9 10.9 0 0 1-4.13 5.46"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M6.61 6.62A10.96 10.96 0 0 0 2 12c.72 2.25 2.18 4.16 4.09 5.49A9.84 9.84 0 0 0 12 19.2c.76 0 1.5-.09 2.2-.26"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12C3.6 7.9 7.4 5 12 5s8.4 2.9 10 7c-1.6 4.1-5.4 7-10 7S3.6 16.1 2 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function PasswordInput({
  className = '',
  description,
  label = 'Senha',
  name,
  onChange,
  placeholder,
  value,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = useId()

  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-100">{label}</span>
        {description ? (
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {description}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 pr-14 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950 ${className}`}
          type={isVisible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-2 inline-flex items-center justify-center rounded-xl px-3 text-slate-300 transition hover:bg-white/8 hover:text-white"
          aria-controls={inputId}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setIsVisible((current) => !current)}
        >
          <EyeIcon isVisible={isVisible} />
        </button>
      </div>
    </label>
  )
}
