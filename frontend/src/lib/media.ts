export const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
export const PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185"

export function getPosterUrl(posterPath?: string | null): string | null {
  if (!posterPath) {
    return null
  }
  return `${POSTER_BASE_URL}${posterPath}`
}

export function getProfileUrl(profilePath?: string | null): string | null {
  if (!profilePath) {
    return null
  }
  return `${PROFILE_BASE_URL}${profilePath}`
}

export function formatRating(value?: number | null): string | null {
  if (typeof value !== "number") {
    return null
  }
  return value.toFixed(1)
}

export function formatTmdbRating(value?: number | null): string | null {
  if (typeof value !== "number") {
    return null
  }
  return (value / 2).toFixed(1)
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  })
}

export function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) {
    return "just now"
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
