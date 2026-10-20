import { BackButton } from '../components/BackButton'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { GradientButton } from '../components/GradientButton'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { avatarValidation, checkMyAvatar, cleanUnregisteredAvatar, loadUnregisteredAvatars, discardMyAvatarUpload, loadMyAvatar, loadMyProfile, ProfileSaveError, refreshMyRelations, saveMyAvatar, saveMyProfile, type AvatarAttempt, type OwnProfile } from '../features/profile/api'
import { normalizedProfile, sameProfile, validateProfile, type ProfileErrors, type ProfileValues } from '../features/profile/validation'
import './profile.css'
import './edit-profile.css'

export function EditProfilePage() {
  const { session } = useAuth()
  return session ? <ProfileEditor key={`${session.user.id}:${session.access_token}`} userId={session.user.id} /> : null
}
function ProfileEditor({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<OwnProfile | null>(null), [values, setValues] = useState<ProfileValues | null>(null)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [fields, setFields] = useState<ProfileErrors>({})
  const [uncertain, setUncertain] = useState(false), [avatarUncertain, setAvatarUncertain] = useState(false)
  const [pending, setPending] = useState<AvatarAttempt | null>(null), [preview, setPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null), [publish, setPublish] = useState(false)
  const [unregistered, setUnregistered] = useState<string[] | null>(null)
  const attempted = useRef<ProfileValues | null>(null), removing = useRef(false)
  const lifetime = useRef({ active: true, controller: new AbortController() }), locked = useRef(false)
  const privacyDialog = useRef<HTMLDialogElement>(null), leaveDialog = useRef<HTMLDialogElement>(null)
  const cancelPrivacy = useRef<HTMLButtonElement>(null), stay = useRef<HTMLButtonElement>(null), saveButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const dirty = !!profile && !!values && !sameProfile(normalizedProfile(values), profile)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (dirty || !!pending || busy || uncertain || avatarUncertain) && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload(event => { if (dirty || pending || busy || uncertain || avatarUncertain) { event.preventDefault(); event.returnValue = '' } })
  async function load() {
    const life = lifetime.current
    setLoading(true); setError(''); setNotice(''); setAvatarUrl(null)
    try {
      const current = await loadMyProfile(userId, life.controller.signal)
      if (!life.active) return
      setProfile(current); setValues(current)
      // Optional recovery stays automatic; it never removes uploads on entry.
      void loadUnregisteredAvatars(userId, life.controller.signal).then(paths => {
        if (life.active) setUnregistered(paths)
      }).catch(() => { /* Profile editing remains available if the optional scan fails. */ })
    } catch { if (life.active) setError('No pudimos cargar tu perfil. Revisá la conexión y reintentá.') }
    finally { if (life.active) setLoading(false) }
  }
  useEffect(() => {
    const life = { active: true, controller: new AbortController() }; lifetime.current = life
    document.title = 'Editar perfil · PlanIt'; void load()
    return () => { life.active = false; life.controller.abort() }
    // Identity/token changes remount the editor and cancel its requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!pending) { setPreview(null); return }
    const url = URL.createObjectURL(pending.file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [pending])
  useEffect(() => {
    if (!profile?.avatar_file_id) { setAvatarUrl(null); return }
    const controller = new AbortController()
    let expiry: number | undefined
    async function renew() {
      setAvatarUrl(null); window.clearTimeout(expiry)
      if (document.visibilityState !== 'visible') return
      try {
        const url = await loadMyAvatar(userId, profile!.avatar_file_id, controller.signal)
        if (!controller.signal.aborted) { setAvatarUrl(url); expiry = window.setTimeout(() => setAvatarUrl(null), 55000) }
      } catch { /* Optional photo: keep editing available. */ }
    }
    void renew(); window.addEventListener('focus', renew); document.addEventListener('visibilitychange', renew)
    return () => { controller.abort(); window.clearTimeout(expiry); window.removeEventListener('focus', renew); document.removeEventListener('visibilitychange', renew) }
  }, [userId, profile?.avatar_file_id])
  useEffect(() => {
    if (publish) { privacyDialog.current?.showModal(); cancelPrivacy.current?.focus() }
    else privacyDialog.current?.close()
  }, [publish])
  useEffect(() => {
    if (blocker.state === 'blocked') { returnFocus.current = document.activeElement as HTMLElement; leaveDialog.current?.showModal(); stay.current?.focus() }
    else leaveDialog.current?.close()
  }, [blocker.state])
  function closePublish() { privacyDialog.current?.close(); setPublish(false); saveButton.current?.focus() }
  function keepEditing() { leaveDialog.current?.close(); if (blocker.state === 'blocked') blocker.reset(); returnFocus.current?.focus() }
  function patch<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues(previous => previous ? { ...previous, [key]: value } : previous)
    setFields(previous => ({ ...previous, [key]: undefined })); setNotice('')
  }
  async function save(checkOnly = false, confirmedPublish = false) {
    if (locked.current || !values || !profile) return
    const expected = checkOnly ? attempted.current : normalizedProfile(values)
    if (!expected) return
    const errors = validateProfile(expected); setFields(errors)
    if (Object.keys(errors).length) { document.getElementById(`profile-${Object.keys(errors)[0]}`)?.focus(); return }
    locked.current = true; setBusy(true); setError(''); setNotice('')
    const life = lifetime.current
    let ack = checkOnly
    try {
      if (!checkOnly) {
        const fresh = await loadMyProfile(userId, life.controller.signal)
        if (!life.active) return
        setProfile(fresh)
        if (fresh.visibility === 'private' && expected.visibility === 'public' && !confirmedPublish) { setPublish(true); return }
        attempted.current = expected
        await saveMyProfile(userId, expected, life.controller.signal); ack = true
      }
      const current = await loadMyProfile(userId, life.controller.signal)
      if (!life.active) return
      if (!sameProfile(expected, current)) {
        setUncertain(true); setError('El estado actual todavía no confirma estos cambios. Comprobá nuevamente antes de guardar otra vez.'); return
      }
      setProfile(current); setValues(current); setUncertain(false)
      setNotice('Tus datos y privacidad quedaron guardados.')
      try { await refreshMyRelations(userId, life.controller.signal) }
      catch { if (life.active) setError('El perfil quedó guardado, pero no pudimos actualizar las relaciones. Volvé a intentar guardar los cambios.') }
    } catch (failure) {
      if (life.active) {
        const unknown = ack || (failure instanceof ProfileSaveError && failure.uncertain)
        setUncertain(unknown); setError(failure instanceof ProfileSaveError ? failure.message : 'No pudimos consultar el estado. Revisá la conexión y reintentá.')
        if (failure instanceof ProfileSaveError && failure.field) setFields({ [failure.field]: failure.message })
        if (unknown) {
          try {
            const current = await loadMyProfile(userId, life.controller.signal)
            if (life.active && sameProfile(expected, current)) {
              setProfile(current); setValues(current); setUncertain(false); setError(''); setNotice('Comprobamos que tus datos y privacidad quedaron guardados.')
              try { await refreshMyRelations(userId, life.controller.signal) } catch { if (life.active) setError('No pudimos actualizar las relaciones. Volvé a intentar guardar los cambios.') }
            }
          } catch { /* Keep the attempted values locked until a confirmed read. */ }
        }
      }
    } finally { locked.current = false; if (life.active) setBusy(false) }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(uncertain) }
  async function choose(file: File | undefined) {
    if (!file || locked.current || pending) return
    setError(''); setNotice('')
    const invalid = avatarValidation(file)
    if (invalid) { setError(invalid); return }
    locked.current = true; setBusy(true)
    const life = lifetime.current
    try {
      const bitmap = await createImageBitmap(file); bitmap.close()
      if (life.active) setPending({ file, path: `${userId}/${crypto.randomUUID()}.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]}`, previousId: profile!.avatar_file_id, uploaded: false })
    } catch { if (life.active) setError('No pudimos leer esa imagen. Elegí otro JPEG, PNG o WebP válido.') }
    finally { locked.current = false; if (life.active) setBusy(false) }
  }
  async function photo(action: 'save' | 'remove' | 'check' | 'discard') {
    if (locked.current || !profile) return
    locked.current = true; setBusy(true); setError(''); setNotice('')
    const life = lifetime.current
    if (action === 'remove') removing.current = true
    if (action === 'save') removing.current = false
    let ack = action === 'check'
    try {
      if (action === 'discard') {
        if (pending) await discardMyAvatarUpload(userId, pending, life.controller.signal)
        const current = await loadMyProfile(userId, life.controller.signal)
        if (life.active) { setPending(null); setProfile(current); setAvatarUncertain(false); setNotice('Selección descartada; los archivos ya registrados se conservan.') }
        return
      }
      const target = removing.current ? null : pending
      if (action !== 'check') { await saveMyAvatar(userId, target, target ? target.previousId : profile.avatar_file_id, life.controller.signal); ack = true }
      const checked = await checkMyAvatar(userId, target, life.controller.signal)
      if (!life.active) return
      setProfile(checked.profile)
      if (checked.saved) { setPending(null); setAvatarUncertain(false); setNotice(removing.current ? 'Foto retirada del perfil.' : 'Tu foto quedó guardada.') }
      else { setAvatarUncertain(false); setError('La foto elegida no figura en el perfil. Podés reintentar la misma carga o descartarla.') }
    } catch (failure) {
      if (life.active) { setAvatarUncertain(ack || (failure instanceof ProfileSaveError && failure.uncertain)); setError(failure instanceof ProfileSaveError ? failure.message : 'No pudimos comprobar la foto. Revisá la conexión y reintentá.'); }
    } finally { locked.current = false; if (life.active) setBusy(false) }
  }
  async function recovery(clean = false) {
    if (locked.current) return
    locked.current = true; setBusy(true); setError(''); setNotice('')
    const life = lifetime.current
    try {
      if (clean && unregistered) for (const path of unregistered) await cleanUnregisteredAvatar(userId, path, life.controller.signal)
      const paths = (await loadUnregisteredAvatars(userId, life.controller.signal)).filter(path => path !== pending?.path)
      if (life.active) { setUnregistered(paths); setNotice(clean ? 'Limpieza completada.' : '') }
    } catch { if (life.active) setError('No pudimos revisar las cargas. Revisá la conexión y reintentá.') }
    finally { locked.current = false; if (life.active) setBusy(false) }
  }
  const disabled = busy || uncertain || avatarUncertain
  return <section className="edit-profile-page">
    <BackButton to="/me" state={{ focusEdit: true }} />
    <header><h1>Editar perfil</h1><p>Elegí cómo te ven y qué querés contar.</p></header>
    {loading && <div role="status"><StatusMessage title="Cargando tu perfil">Consultando los datos de tu cuenta…</StatusMessage></div>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {!loading && !profile && <GradientButton onClick={() => void load()}>Reintentar</GradientButton>}
    {!loading && profile && values && <>
      <section className="edit-profile-photo" aria-labelledby="profile-photo-title">
        <div className="profile-avatar">{preview || avatarUrl ? <img src={preview ?? avatarUrl!} alt={preview ? 'Vista previa de tu foto' : 'Tu foto actual'} onError={() => setAvatarUrl(null)} /> : <span><Icon name="user" /></span>}</div>
        <div><h2 id="profile-photo-title">Tu foto</h2><p id="profile-photo-hint">JPEG, PNG o WebP · hasta 5 MiB.<br />La foto se guarda por separado.</p>
          {!pending && <label className="secondary-button profile-photo-picker">Elegir foto<input aria-label="Elegir foto" aria-describedby="profile-photo-hint" type="file" accept="image/*" disabled={disabled} onChange={event => { void choose(event.target.files?.[0]); event.target.value = '' }} /></label>}
          {pending && <p className="profile-photo-filename">{pending.file.name}</p>}
          <div className="profile-photo-actions">
            {pending && !avatarUncertain && <GradientButton disabled={disabled} onClick={() => void photo('save')}>Guardar foto</GradientButton>}
            {avatarUncertain && <GradientButton disabled={busy || uncertain} onClick={() => void photo('check')}>Comprobar foto</GradientButton>}
            {pending && <button className="text-button" disabled={busy || uncertain} onClick={() => void photo('discard')}>Descartar foto y limpiar carga</button>}
            {!pending && profile.avatar_file_id && !avatarUncertain && <button className="text-button" disabled={disabled} onClick={() => void photo('remove')}>Quitar foto</button>}
          </div>
        </div>
      </section>
      <div className="profile-upload-recovery">
        {!!unregistered?.length && <div><p>Hay {unregistered.length} cargas sin vincular entre las últimas 100. Cerrá otras sesiones de carga antes de limpiarlas. Las fotos registradas se conservan.</p><button className="secondary-button" disabled={disabled} onClick={() => void recovery(true)}>Limpiar cargas sin vincular</button></div>}
      </div>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={disabled} className="profile-fields"><legend>Datos de tu perfil</legend>
          <FormField id="profile-display_name" label="Nombre visible" icon="user" autoComplete="nickname" value={values.display_name} error={fields.display_name} onChange={event => patch('display_name', event.target.value)} required />
          <FormField id="profile-username" label="Username" icon="user" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={values.username} error={fields.username} aria-describedby="profile-username-hint" onChange={event => patch('username', event.target.value)} required />
          <small id="profile-username-hint">Entre 3 y 24 letras, números o guiones bajos. Se guarda en minúsculas.</small>
          <div className="profile-text-field"><label htmlFor="profile-bio">Biografía</label><textarea id="profile-bio" rows={4} value={values.bio} aria-invalid={!!fields.bio} aria-describedby={fields.bio ? 'profile-bio-hint profile-bio-error' : 'profile-bio-hint'} onChange={event => patch('bio', event.target.value)} /><small id="profile-bio-hint">{Array.from(values.bio).length}/500 caracteres. Visible en perfiles públicos y para seguidores aceptados.</small>{fields.bio && <p className="field-error" id="profile-bio-error">{fields.bio}</p>}</div>
          <fieldset className="profile-privacy"><legend>Privacidad</legend><p>Tu nombre visible, username y foto pueden verse sin seguirte, salvo bloqueo.</p>
            <label><input type="radio" name="visibility" checked={values.visibility === 'public'} onChange={() => patch('visibility', 'public')} /><span><strong>Público</strong><small>Tu biografía y eventos públicos son visibles para otras cuentas.</small></span></label>
            <label><input type="radio" name="visibility" checked={values.visibility === 'private'} onChange={() => patch('visibility', 'private')} /><span><strong>Privado</strong><small>Tu biografía y eventos públicos quedan para seguidores aceptados. Los actuales se conservan.</small></span></label>
          </fieldset>
          <fieldset className="profile-private-fields"><legend>Datos personales opcionales</legend><p>Estos datos son privados y no aparecen en tu perfil social.</p>
            <div className="profile-name-fields"><FormField id="profile-first_name" label="Nombre" icon="user" autoComplete="given-name" value={values.first_name} onChange={event => patch('first_name', event.target.value)} /><FormField id="profile-last_name" label="Apellido" icon="user" autoComplete="family-name" value={values.last_name} onChange={event => patch('last_name', event.target.value)} /></div>
            <FormField id="profile-birth_date" label="Fecha de nacimiento" icon="calendar" type="date" autoComplete="bday" value={values.birth_date} error={fields.birth_date} onChange={event => patch('birth_date', event.target.value)} />
            <div className="profile-text-field"><label htmlFor="profile-sex">Sexo</label><select id="profile-sex" value={values.sex} onChange={event => patch('sex', event.target.value)}><option value="">Sin indicar</option><option value="female">Femenino</option><option value="male">Masculino</option><option value="other">Otro</option></select></div>
          </fieldset>
        </fieldset>
        <div className="profile-save-actions"><p role="status">{notice || (busy ? 'Comprobando los cambios…' : uncertain ? 'Guardado pendiente de comprobar.' : avatarUncertain ? 'Foto pendiente de comprobar.' : dirty ? 'Tenés cambios sin guardar.' : 'Tus datos están actualizados.')}</p><button className="gradient-link gradient-button" ref={saveButton} disabled={busy || avatarUncertain || (!dirty && !uncertain)} type="submit">{busy ? 'Procesando…' : uncertain ? 'Comprobar guardado' : 'Guardar datos y privacidad'}</button>

        </div>
      </form>
    </>}
    <dialog ref={privacyDialog} className="profile-edit-dialog" aria-labelledby="profile-publish-title" aria-describedby="profile-publish-description" onCancel={event => { event.preventDefault(); closePublish() }}>
      <h2 id="profile-publish-title">¿Hacer público tu perfil?</h2><p id="profile-publish-description">Tu biografía y eventos públicos serán visibles para otras cuentas. Todas las solicitudes pendientes sin bloqueo quedarán aceptadas al guardar.</p><div><button ref={cancelPrivacy} className="secondary-button" onClick={closePublish}>Seguir editando</button><GradientButton onClick={() => { closePublish(); void save(false, true) }}>Hacer público y guardar</GradientButton></div>
    </dialog>
    <dialog ref={leaveDialog} className="profile-edit-dialog" aria-labelledby="profile-leave-title" onCancel={event => { event.preventDefault(); keepEditing() }}><h2 id="profile-leave-title">¿Salir de Editar perfil?</h2><p>{busy || uncertain || avatarUncertain ? 'Hay una operación pendiente de comprobar. Una solicitud enviada podría haberse guardado.' : 'Se descartarán los cambios locales. Las fotos que ya subiste pueden requerir limpieza al volver.'}</p><div><button ref={stay} className="secondary-button" onClick={keepEditing}>Seguir editando</button><GradientButton onClick={() => { if (blocker.state === 'blocked') blocker.proceed() }}>Salir y descartar edición</GradientButton></div></dialog>
  </section>
}
