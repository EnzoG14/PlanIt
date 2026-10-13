import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { GradientButton } from '../components/GradientButton'
import { useAuth } from '../features/auth/useAuth'
import { InterestsSaveError, loadInterestsEditor, loadMyInterests, sameInterests, saveMyInterests } from '../features/interests/api'
import type { Category } from '../features/events/validation'
import './interests.css'

export function InterestsPage() {
  const { session } = useAuth()
  return session ? <InterestsEditor key={session.user.id} userId={session.user.id} /> : null
}
function InterestsEditor({ userId }: { userId: string }) {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [persisted, setPersisted] = useState<string[]>([])
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [uncertain, setUncertain] = useState(false)
  const lifetime = useRef<{ active: boolean; revision: number; controller: AbortController }>({ active: false, revision: 0, controller: new AbortController() })
  const locked = useRef(false), attempted = useRef<string[]>([])
  const heading = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDialogElement>(null), stay = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const dirty = !sameInterests(selected, persisted)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (dirty || busy || uncertain) && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload(event => { if (dirty || busy || uncertain) { event.preventDefault(); event.returnValue = '' } })

  const load = useCallback(async (preserve = false) => {
    if (locked.current) return
    const life = lifetime.current
    const request = ++life.revision
    setLoading(true); setError(''); setNotice('')
    try {
      const data = await loadInterestsEditor(userId, life.controller.signal)
      if (!life.active || request !== life.revision) return
      setCategories(data.categories); setPersisted(data.selected)
      setSelected(previous => preserve ? previous.filter(id => data.categories.some(category => category.id === id)) : data.selected)
    } catch {
      if (life.active && request === life.revision) setError('No pudimos cargar tus intereses. Revisá la conexión y reintentá.')
    } finally {
      if (life.active && request === life.revision) setLoading(false)
    }
  }, [userId])
  useEffect(() => {
    lifetime.current = { active: true, revision: 0, controller: new AbortController() }
    document.title = 'Mis intereses · PlanIt'
    const title = heading.current?.querySelector('h1')
    title?.setAttribute('tabindex', '-1')
    // Run after the shared layout's route focus effect, including cached lazy routes.
    const frame = window.requestAnimationFrame(() => title?.focus())
    void load()
    const current = lifetime.current
    return () => { window.cancelAnimationFrame(frame); current.active = false; current.revision++; current.controller.abort() }
    // A new account remounts the editor. Token refresh preserves unsaved edits.
  }, [userId, load])
  useEffect(() => {
    if (blocker.state === 'blocked') {
      trigger.current = document.activeElement as HTMLElement
      dialog.current?.showModal(); stay.current?.focus()
    } else dialog.current?.close()
  }, [blocker.state])
  function keepEditing() {
    if (blocker.state === 'blocked') blocker.reset()
    dialog.current?.close()
    if (trigger.current?.isConnected) trigger.current.focus()
  }
  async function save(checkOnly = false) {
    if (locked.current || loading) return
    locked.current = true; setBusy(true); setError(''); setNotice('')
    const request = ++lifetime.current.revision
    const expected = checkOnly ? attempted.current : [...selected]
    attempted.current = expected
    let ack = checkOnly
    try {
      if (!checkOnly) {
        const result = await saveMyInterests(userId, expected, lifetime.current.controller.signal)
        ack = true
        if (!sameInterests(result, expected)) throw new InterestsSaveError('La respuesta no coincide con la selección. Comprobá el guardado.', true)
      }
      const current = await loadMyInterests(userId, lifetime.current.controller.signal)
      if (!lifetime.current.active || request !== lifetime.current.revision) return
      const ids = current.map(category => category.id)
      setPersisted(ids); setUncertain(false)
      if (sameInterests(ids, expected)) {
        setSelected(ids); setNotice('Tus intereses quedaron guardados.')
      } else setError('La selección no figura guardada. Revisá tus cambios y volvé a guardar.')
    } catch (failure) {
      if (lifetime.current.active && request === lifetime.current.revision) {
        setUncertain(ack || (failure instanceof InterestsSaveError && failure.uncertain))
        setError(failure instanceof InterestsSaveError ? failure.message : 'No pudimos comprobar el guardado. Revisá la conexión y comprobá el estado.')
      }
    } finally {
      locked.current = false
      if (lifetime.current.active && request === lifetime.current.revision) setBusy(false)
    }
  }
  return <section className="interests-page" aria-label="Preferencias de categorías">
    <Link className="secondary-link interests-back" to="/me" state={{ focusInterests: true }}><Icon name="back" />Volver a mi perfil</Link>
    <div ref={heading}><ScreenHeader title="Mis intereses" description="Elegí las categorías que te interesan. Podés cambiarlas cuando quieras." icon="category" /></div>
    {loading && <div role="status"><StatusMessage title="Cargando intereses">Consultando categorías y preferencias de tu cuenta…</StatusMessage></div>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {!loading && !categories && <GradientButton onClick={() => void load()}>Reintentar</GradientButton>}
    {categories && <>
      <fieldset disabled={busy || loading || uncertain} className="interests-categories"><legend>Categorías</legend>
        {!categories.length && <StatusMessage title="No hay categorías disponibles">Volvé a consultar más tarde.</StatusMessage>}
        <div className="interests-grid">{categories.map(category => <button type="button" key={category.id} aria-pressed={selected.includes(category.id)}
          disabled={!category.is_active && !persisted.includes(category.id)} onClick={() => {
            setSelected(value => value.includes(category.id) ? value.filter(id => id !== category.id) : [...value, category.id]); setNotice('')
          }}><span className="interests-option-name">{category.name}{selected.includes(category.id) && <Icon name="check" />}</span>
          {!category.is_active && <span className="interests-unavailable">No disponible para nuevas selecciones</span>}</button>)}</div>
      </fieldset>
      <div className="interests-actions">
        <p role="status">{notice || (busy ? 'Comprobando tus preferencias…' : uncertain ? 'Guardado pendiente de comprobar.' : dirty ? 'Tenés cambios sin guardar.' : 'La selección coincide con tus preferencias guardadas.')}</p>
        <GradientButton disabled={busy || loading || (!dirty && !uncertain)} onClick={() => void save(uncertain)}>{busy ? 'Guardando…' : uncertain ? 'Comprobar guardado' : 'Guardar intereses'}</GradientButton>
        <button className="text-button" disabled={busy || loading || uncertain} onClick={() => void load(true)}>Actualizar categorías</button>
      </div>
    </>}
    <dialog ref={dialog} className="interests-dialog" aria-labelledby="interests-leave-title" aria-describedby="interests-leave-description" onCancel={event => { event.preventDefault(); keepEditing() }}>
      <h2 id="interests-leave-title">¿Salir de Mis intereses?</h2>
      <p id="interests-leave-description">{busy || uncertain ? 'Hay un guardado pendiente de comprobar. Salir descarta la edición local; una solicitud enviada podría haberse guardado.' : 'Tenés cambios sin guardar. Si salís, se descartarán.'}</p>
      <div><button ref={stay} className="secondary-button" onClick={keepEditing}>Seguir editando</button><button className="gradient-link" onClick={() => { if (blocker.state === 'blocked') blocker.proceed() }}>Descartar cambios</button></div>
    </dialog>
  </section>
}
