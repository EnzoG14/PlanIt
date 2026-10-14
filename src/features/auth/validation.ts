export type AuthValues = { email: string; password: string; display_name: string }
export type FieldErrors = Partial<Record<keyof AuthValues, string>>

export function validateAuth(values: AuthValues, register: boolean): FieldErrors {
  const errors: FieldErrors = {}
  if (register && (Array.from(values.display_name.trim()).length < 2 || Array.from(values.display_name.trim()).length > 60)) errors.display_name = 'Usá un nombre de entre 2 y 60 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Ingresá un email válido.'
  if (!values.password) errors.password = 'Ingresá tu contraseña.'
  else if (register && Array.from(values.password).length < 6) errors.password = 'Usá al menos 6 caracteres. Supabase puede exigir una contraseña más segura.'
  return errors
}

export function safeReturnPath(value: string | null): string {
  return value && ['/map', '/my-events', '/events/new', '/me', '/me/interests', '/invite'].includes(value) ? value : '/map'
}

export function authErrorMessage(code?: string): string {
  switch (code) {
    case 'invalid_credentials': return 'El email o la contraseña no son correctos.'
    case 'email_not_confirmed': return 'Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.'
    case 'weak_password': return 'La contraseña no cumple la seguridad requerida. Elegí una más larga y difícil de adivinar.'
    case 'user_already_exists': case 'email_exists': return 'No se pudo crear la cuenta. Si ya te registraste, ingresá con tus credenciales.'
    case 'over_email_send_rate_limit': case 'over_request_rate_limit': return 'Hubo demasiados intentos. Esperá unos minutos antes de volver a intentar.'
    case 'signup_disabled': return 'El registro no está disponible en este momento.'
    default: return 'No pudimos completar la solicitud. Revisá los datos y la conexión y volvé a intentar.'
  }
}
