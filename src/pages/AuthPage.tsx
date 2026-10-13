import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { GradientButton } from '../components/GradientButton'
import { Icon } from '../components/Icon'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { authErrorMessage, safeReturnPath, validateAuth, type FieldErrors } from '../features/auth/validation'
import { supabase } from '../lib/supabase'
import './auth.css'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register'
  const { session, loading, error: sessionError } = useAuth()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [values, setValues] = useState({ email: '', password: '', display_name: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const sending = useRef(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  useEffect(() => { document.title = `${register ? 'Crear cuenta' : 'Ingresar'} · PlanIt` }, [register])
  useEffect(() => { if (error || confirmation) feedbackRef.current?.focus() }, [error, confirmation])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || !supabase) return
    setError('')
    const validation = validateAuth(values, register)
    setErrors(validation)
    if (Object.keys(validation).length) {
      const ref = validation.display_name ? nameRef : validation.email ? emailRef : passwordRef
      ref.current?.focus()
      return
    }
    sending.current = true
    setBusy(true)
    try {
      const result = register
        ? await supabase.auth.signUp({ email: values.email.trim(), password: values.password, options: { data: { display_name: values.display_name.trim() }, emailRedirectTo: `${window.location.origin}/map` } })
        : await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password })
      if (result.error) setError(authErrorMessage(result.error.code))
      // Supabase can conceal duplicate registrations with an identity-less user.
      // Do not claim a new account or confirmation email in that case.
      else if (register && !result.data.session && result.data.user?.identities?.length === 0) setError(authErrorMessage('user_already_exists'))
      else if (register && !result.data.session) {
        setValues(current => ({ ...current, password: '' }))
        setConfirmation(true)
      }
    } catch { setError(authErrorMessage()) }
    finally { sending.current = false; setBusy(false) }
  }

  if (loading) return <StatusMessage title="Comprobando sesión">Esperá un momento para continuar.</StatusMessage>
  if (sessionError) return null
  if (session) return <Navigate to={next} replace />
  return <div className="auth-page">
    <ScreenHeader title={register ? 'Creá tu cuenta' : 'Ingresá a PlanIt'} description={register ? 'Completá tus datos para empezar.' : 'Ingresá para descubrir eventos cerca tuyo.'} icon={register ? 'user' : 'login'} />
    {confirmation ? <div ref={feedbackRef} tabIndex={-1} className="auth-feedback">
      <StatusMessage title="Revisá tu correo"><span className="auth-confirmation-line">Si el email admite el registro, recibirás un enlace para confirmar tu cuenta.</span><span className="auth-confirmation-line">Si ya tenés una cuenta, ingresá con tus credenciales.</span><span className="auth-confirmation-line">No se inició una sesión todavía.</span></StatusMessage>
      <Link className="secondary-link" to="/login">Ir a ingresar</Link>
    </div> : <form onSubmit={submit} noValidate aria-busy={busy} className="auth-form">
      {register && <FormField id="display-name" label="Nombre visible" icon="user" name="display_name" autoComplete="nickname" placeholder="Cómo querés que te llamen" value={values.display_name} inputRef={nameRef} required disabled={busy} error={errors.display_name} onChange={event => setValues({ ...values, display_name: event.target.value })} />}
      <FormField id="email" label="Email" icon="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="tu@email.com" value={values.email} inputRef={emailRef} required disabled={busy} error={errors.email} onChange={event => setValues({ ...values, email: event.target.value })} />
      <div className="auth-password-field">
        <FormField id="password" label="Contraseña" icon="lock" name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Al menos 6 caracteres' : 'Tu contraseña'} aria-describedby={register ? 'password-hint' : undefined} value={values.password} inputRef={passwordRef} required disabled={busy} error={errors.password} onChange={event => setValues({ ...values, password: event.target.value })} trailing={<button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} disabled={busy} onClick={() => setShowPassword(value => !value)}><Icon name={showPassword ? 'eyeOff' : 'eye'} /></button>} />
        {register && <p className="auth-field-hint" id="password-hint">Al menos 6 caracteres.</p>}
      </div>
      {error && <div ref={feedbackRef} tabIndex={-1} className="auth-feedback"><StatusMessage title={register ? 'No se pudo crear la cuenta' : 'No se pudo ingresar'} tone="error">{error}</StatusMessage></div>}
      <GradientButton type="submit" disabled={busy || !supabase}>{busy ? (register ? 'Creando cuenta…' : 'Ingresando…') : (register ? 'Crear cuenta' : 'Continuar')}</GradientButton>
      <p className="auth-switch">{register ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'} <Link to={`/${register ? 'login' : 'register'}${next !== '/map' ? `?next=${encodeURIComponent(next)}` : ''}`}>{register ? 'Ingresar' : 'Crear cuenta'}</Link></p>
      <span className="sr-only" role="status">{busy ? 'Solicitud en curso. Esperá un momento.' : ''}</span>
    </form>}
  </div>
}
