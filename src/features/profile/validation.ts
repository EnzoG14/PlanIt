export type ProfileValues = {
  username: string; display_name: string; first_name: string; last_name: string
  birth_date: string; sex: string; bio: string; visibility: 'public' | 'private'
}
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>
export function normalizedProfile(values: ProfileValues): ProfileValues {
  return { ...values, username: values.username.trim().toLowerCase(), display_name: values.display_name.trim(),
    first_name: values.first_name.trim(), last_name: values.last_name.trim() }
}
export function validateProfile(raw: ProfileValues): ProfileErrors {
  const values = normalizedProfile(raw), errors: ProfileErrors = {}
  if (!/^[a-z0-9_]{3,24}$/.test(values.username)) errors.username = 'Usá entre 3 y 24 letras minúsculas, números o guiones bajos.'
  if (Array.from(values.display_name).length < 2 || Array.from(values.display_name).length > 60) errors.display_name = 'Usá un nombre visible de entre 2 y 60 caracteres.'
  if (Array.from(values.bio).length > 500) errors.bio = 'La biografía puede tener hasta 500 caracteres.'
  if (values.sex && !['female', 'male', 'other'].includes(values.sex)) errors.sex = 'Elegí una opción válida.'
  if (values.birth_date && (!/^\d{4}-\d{2}-\d{2}$/.test(values.birth_date) || !Number.isFinite(Date.parse(values.birth_date))
    || new Date(values.birth_date).toISOString().slice(0, 10) !== values.birth_date)) errors.birth_date = 'Ingresá una fecha válida.'
  if (!['public', 'private'].includes(values.visibility)) errors.visibility = 'Elegí Público o Privado.'
  return errors
}
export function sameProfile(a: ProfileValues, b: ProfileValues): boolean {
  return (['username', 'display_name', 'first_name', 'last_name', 'birth_date', 'sex', 'bio', 'visibility'] as const).every(key => a[key] === b[key])
}
