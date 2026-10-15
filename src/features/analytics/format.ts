const percent = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

export function formatOccupancyPercent(value: number | null): string {
  return value === null || !Number.isFinite(value) || value < 0 ? 'N/D' : `${percent.format(value)} %`
}
