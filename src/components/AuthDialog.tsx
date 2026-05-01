import { KeyRound, Mail, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export type AuthDialogMode = 'forgot' | 'reset' | 'sign-in' | 'sign-up'

type AuthDialogProps = {
  initialMode?: AuthDialogMode
  onClose: () => void
  onForgotPassword: (email: string) => Promise<void>
  onResetPassword: (token: string, password: string) => Promise<void>
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  resetToken?: string | null
}

export default function AuthDialog({
  initialMode = 'sign-in',
  onClose,
  onForgotPassword,
  onResetPassword,
  onSignIn,
  onSignUp,
  resetToken = null,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthDialogMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (mode === 'sign-up') {
        await onSignUp(email, password)
      } else if (mode === 'forgot') {
        await onForgotPassword(email)
        setMessage('Password reset email sent if that account exists.')
      } else if (mode === 'reset') {
        await onResetPassword(resetToken ?? '', password)
        setMode('sign-in')
        setPassword('')
        setMessage('Password updated. Sign in with the new password.')
      } else {
        await onSignIn(email, password)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const title =
    mode === 'sign-up'
      ? 'Create account'
      : mode === 'forgot'
        ? 'Reset password'
        : mode === 'reset'
          ? 'Choose new password'
          : 'Sign in'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-teal-700">
              Mathplorer account
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode !== 'reset' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Email
              </span>
              <span className="mt-1.5 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
                <Mail size={15} className="text-slate-400" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  autoComplete="email"
                  required
                />
              </span>
            </label>
          )}

          {mode !== 'forgot' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Password
              </span>
              <span className="mt-1.5 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
                <KeyRound
                  size={15}
                  className="text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  autoComplete={
                    mode === 'sign-in' ? 'current-password' : 'new-password'
                  }
                  minLength={8}
                  required
                />
              </span>
            </label>
          )}

          {message && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mnl-button-primary w-full"
          >
            {isSubmitting ? 'Working...' : title}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          {mode !== 'sign-in' && (
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className="font-semibold text-teal-700 hover:text-teal-900"
            >
              Sign in
            </button>
          )}
          {mode !== 'sign-up' && mode !== 'reset' && (
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className="font-semibold text-teal-700 hover:text-teal-900"
            >
              Create account
            </button>
          )}
          {mode !== 'forgot' && mode !== 'reset' && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="font-semibold text-teal-700 hover:text-teal-900"
            >
              Forgot password
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
