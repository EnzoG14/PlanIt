export type Coordinates = { latitude: number; longitude: number }
export type MapBounds = { south: number; north: number; west: number; east: number }
export const defaultLocation: Coordinates = { latitude: -34.6037, longitude: -58.3816 }

export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(new Error('La ubicación necesita un navegador compatible y una conexión HTTPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(position => {
      resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude })
    }, error => {
      reject(new Error(error.code === 1 ? 'No autorizaste el acceso a tu ubicación.' : error.code === 3 ? 'Se agotó el tiempo para obtener tu ubicación.' : 'No pudimos obtener tu ubicación.'))
    }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true })
  })
}
