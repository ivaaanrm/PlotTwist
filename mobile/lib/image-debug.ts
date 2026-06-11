export function logImageError(
  label: string,
  uri: string | null | undefined,
  error: unknown,
) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[image] ${label} failed`, { uri, error });
  }
}
