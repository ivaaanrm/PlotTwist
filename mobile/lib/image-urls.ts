const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500";

export const posterUrl = (
  path: string | null | undefined,
  size: PosterSize = "w342"
): string | null => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);

export const backdropUrl = (
  path: string | null | undefined
): string | null => (path ? `${TMDB_IMAGE_BASE}/w780${path}` : null);

export const profileUrl = (
  path: string | null | undefined
): string | null => (path ? `${TMDB_IMAGE_BASE}/w185${path}` : null);
