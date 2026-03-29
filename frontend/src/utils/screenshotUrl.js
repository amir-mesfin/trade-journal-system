/** Resolve display URL for a screenshot: Cloudinary HTTPS, or legacy local filename. */
export function resolveScreenshotUrl(shot) {
  if (shot == null) return ''
  if (typeof shot === 'string') {
    if (shot.startsWith('http')) return shot
    return `/uploads/trades/${shot}`
  }
  if (typeof shot === 'object' && shot.url) {
    const u = shot.url
    if (u.startsWith('http')) return u
    if (u.startsWith('/')) return u
    return `/uploads/trades/${u}`
  }
  return ''
}

export function screenshotKey(shot, index) {
  const u = resolveScreenshotUrl(shot)
  return u ? `${u}-${index}` : `shot-${index}`
}
