import { createContext, useContext } from 'react'

// Variante de estado de una pantalla extra (ej. "joined", "readonly"). La define la URL (?v=) o queda null.
export const VariantContext = createContext<string | null>(null)
export const useVariant = () => useContext(VariantContext)
