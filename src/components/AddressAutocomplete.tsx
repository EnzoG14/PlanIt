import { useEffect, useRef, useState } from 'react'
import { hasGeoapifyKey, searchAddresses, type AddressSuggestion } from '../features/location/autocomplete'
import { Icon } from './Icon'

type Props = { address: string; resolved: boolean; disabled: boolean; locating: boolean; error?: string; change: (value: string) => void; select: (value: AddressSuggestion) => void }

export function AddressAutocomplete({ address, resolved, disabled, locating, error, change, select }: Props) {
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [active, setActive] = useState(-1)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ query: string; status: 'loading' | 'ready' | 'error'; items: AddressSuggestion[]; message?: string }>({ query: '', status: 'ready', items: [] })
  const revision = useRef(0)
  const query = address.trim()
  const searching = focused && !dismissed && !disabled && !locating && !resolved && query.length >= 3 && hasGeoapifyKey
  useEffect(() => {
    const version = ++revision.current
    if (!searching) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setState({ query, status: 'loading', items: [] })
      void searchAddresses(query, controller.signal).then(items => {
        if (version === revision.current && !controller.signal.aborted) setState({ query, status: 'ready', items })
      }).catch(failure => {
        if (version === revision.current && !controller.signal.aborted) setState({ query, status: 'error', items: [], message: failure instanceof Error ? failure.message : 'No pudimos buscar direcciones. Reintentá.' })
      })
    }, 400)
    return () => { clearTimeout(timer); controller.abort(); revision.current += 1 }
  }, [query, searching, attempt])
  const current = searching && state.query === query
  const items = current ? state.items : []
  const expanded = items.length > 0
  function choose(item: AddressSuggestion) {
    revision.current += 1
    setDismissed(true); setActive(-1); select(item)
  }
  let status = 'Escribí al menos 3 caracteres y elegí una sugerencia, o usá tu ubicación actual si estás allí.'
  if (locating) status = 'Obteniendo tu ubicación…'
  else if (resolved) status = 'Ubicación lista para guardar.'
  else if (!hasGeoapifyKey) status = 'Las sugerencias no están configuradas. Podés usar tu ubicación actual si estás en el lugar.'
  else if (current && state.status === 'error') status = state.message ?? 'No pudimos buscar direcciones. Reintentá.'
  else if (searching) status = !current || state.status === 'loading' ? 'Buscando direcciones…' : items.length ? items.length === 1 ? '1 sugerencia disponible.' : `${items.length} sugerencias disponibles.` : 'No encontramos direcciones. Probá con calle, número y ciudad.'

  return <div className="form-field address-autocomplete" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setActive(-1) } }}>
    <label htmlFor="event-address">Dirección</label>
    <div className="field-control"><Icon name="pin" /><input id="event-address" name="address" value={address} disabled={disabled} required placeholder="Calle, número y ciudad" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls="event-address-options" aria-activedescendant={expanded && active >= 0 ? `event-address-option-${active}` : undefined} aria-invalid={Boolean(error)} aria-describedby={`event-address-help${error ? ' event-address-error' : ''}`} onFocus={() => setFocused(true)} onChange={event => { revision.current += 1; setDismissed(false); setActive(-1); change(event.target.value) }} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return
      if (event.key === 'Escape') { event.preventDefault(); setDismissed(true); setActive(-1) }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length) { event.preventDefault(); setActive(index => event.key === 'ArrowDown' ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1)) }
      if (event.key === 'Enter' && searching) { event.preventDefault(); if (active >= 0 && items[active]) choose(items[active]) }
    }} /></div>
    {expanded && <ul id="event-address-options" role="listbox" aria-label="Direcciones sugeridas" className="address-options">{items.map((item, index) => <li key={`${item.id}:${index}`} id={`event-address-option-${index}`} role="option" aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => choose(item)}>{item.address}</li>)}</ul>}
    <p id="event-address-help" className="field-hint" role="status">{status}</p>
    {current && state.status === 'error' && <button type="button" className="secondary-button" disabled={disabled} onClick={() => { setFocused(true); setAttempt(value => value + 1) }}>Reintentar búsqueda</button>}
    {error && <p id="event-address-error" className="field-error">{error}</p>}
    <p className="field-hint address-attribution"><a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>
  </div>
}
