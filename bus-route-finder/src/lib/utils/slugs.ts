/**
 * Utility functions for generating and validating URL-safe slugs
 */

/**
 * Generate a URL-safe slug from a title
 * @param title The title to convert to a slug
 * @returns A URL-safe slug
 */
export function generatePostSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim()
}

/**
 * Validate if a slug is properly formatted
 * @param slug The slug to validate
 * @returns True if the slug is valid
 */
export function validateSlug(slug: string): boolean {
  // Check if slug matches expected format: lowercase letters, numbers, and hyphens only
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  
  return (
    slug.length > 0 &&
    slug.length <= 255 &&
    slugRegex.test(slug) &&
    !slug.startsWith('-') &&
    !slug.endsWith('-')
  )
}

/**
 * Generate a community slug from community name
 * @param name The community name to convert to a slug
 * @returns A URL-safe community slug
 */
export function generateCommunitySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim()
}

/**
 * Ensure a slug is unique by appending a number if necessary
 * This is a client-side helper - the actual uniqueness check should be done server-side
 * @param baseSlug The base slug to make unique
 * @param existingSlugs Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let finalSlug = baseSlug
  let counter = 0
  
  while (existingSlugs.includes(finalSlug)) {
    counter++
    finalSlug = `${baseSlug}-${counter}`
  }
  
  return finalSlug
}

/**
 * Extract slug from a URL path
 * @param path The URL path containing the slug
 * @param pattern The pattern to match (e.g., '/community/c/[slug]')
 * @returns The extracted slug or null if not found
 */
export function extractSlugFromPath(path: string, pattern: string): string | null {
  // Convert pattern to regex by replacing [slug] with capture group
  const regexPattern = pattern.replace(/\[slug\]/g, '([^/]+)')
  const regex = new RegExp(`^${regexPattern}$`)
  const match = path.match(regex)
  
  return match ? match[1] : null
}

/**
 * Build a slug-based URL path
 * @param pattern The URL pattern with [slug] placeholders
 * @param slugs Object containing slug values
 * @returns The complete URL path
 */
export function buildSlugPath(
  pattern: string, 
  slugs: { [key: string]: string }
): string {
  let path = pattern
  
  // Replace all [key] patterns with corresponding slug values
  Object.entries(slugs).forEach(([key, value]) => {
    path = path.replace(new RegExp(`\\[${key}\\]`, 'g'), value)
  })
  
  return path
}