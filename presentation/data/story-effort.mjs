// Presentation estimates authorized on 29/10/2026, not historical team estimates.
// Shirt sizes are a visual convention for this deck; points never represent hours.
export const effortScale = [
  { points: 1, size: 'XS', background: '#f1eeff', foreground: '#060b27' },
  { points: 2, size: 'S', background: '#c5b5ff', foreground: '#060b27' },
  { points: 3, size: 'M', background: '#565f8a', foreground: '#ffffff' },
  { points: 5, size: 'L', background: '#0753ff', foreground: '#ffffff' },
  { points: 8, size: 'XL', background: '#5b34d6', foreground: '#ffffff' },
  { points: 13, size: 'XXL', background: '#060b27', foreground: '#ffffff' },
]

const releaseEstimates = [
  [3, 3, 8, 8, 5, 3, 3],
  [3, 3, 3, 5, 5, 2, 5],
  [5, 5, 5, 3, 3, 5, 3, 3, 5],
  [3, 2, 3, 5, 2, 5, 8, 8, 8],
  [3, 3, 5, 5, 3, 5, 8, 8],
  [2, 5, 5, 3, 3, 5],
  [8, 8, 5, 5, 3, 2, 13],
]

export const storyEffort = Object.fromEntries(releaseEstimates.flatMap((values, release) =>
  values.map((points, index) => [`RF-R${release + 1}-${String(index + 1).padStart(2, '0')}`, points]),
))
