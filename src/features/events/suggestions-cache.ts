import { invalidateContent } from '../../lib/session-content'

// Shared startup data is also invalidated after changing interests.
export function clearSuggestions() { invalidateContent('suggestions:') }
