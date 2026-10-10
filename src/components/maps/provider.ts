// Raster provider configuration. Engine-specific code lives in EventMap only.
export const mapProvider = {
  tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  initialZoom: 13,
  minZoom: 3,
  maxZoom: 19,
}
