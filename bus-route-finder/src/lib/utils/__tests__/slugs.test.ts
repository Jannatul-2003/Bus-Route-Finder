import { describe, it, expect } from 'vitest'
import {
  generatePostSlug,
  validateSlug,
  generateCommunitySlug,
  ensureUniqueSlug,
  extractSlugFromPath,
  buildSlugPath
} from '../slugs'

describe('Slug Generation Utilities', () => {
  describe('generatePostSlug', () => {
    it('should convert title to lowercase slug', () => {
      expect(generatePostSlug('Hello World')).toBe('hello-world')
    })

    it('should remove special characters', () => {
      expect(generatePostSlug('Hello! @#$% World?')).toBe('hello-world')
    })

    it('should replace multiple spaces with single hyphen', () => {
      expect(generatePostSlug('Hello    World   Test')).toBe('hello-world-test')
    })

    it('should replace multiple hyphens with single hyphen', () => {
      expect(generatePostSlug('Hello---World')).toBe('hello-world')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(generatePostSlug('---Hello World---')).toBe('hello-world')
    })

    it('should handle empty string', () => {
      expect(generatePostSlug('')).toBe('')
    })

    it('should handle numbers and letters', () => {
      expect(generatePostSlug('Bus Route 123 Update')).toBe('bus-route-123-update')
    })
  })

  describe('validateSlug', () => {
    it('should validate correct slugs', () => {
      expect(validateSlug('hello-world')).toBe(true)
      expect(validateSlug('bus-route-123')).toBe(true)
      expect(validateSlug('test')).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(validateSlug('')).toBe(false)
      expect(validateSlug('-hello')).toBe(false)
      expect(validateSlug('hello-')).toBe(false)
      expect(validateSlug('hello--world')).toBe(false)
      expect(validateSlug('Hello-World')).toBe(false)
      expect(validateSlug('hello_world')).toBe(false)
      expect(validateSlug('hello world')).toBe(false)
    })

    it('should reject slugs that are too long', () => {
      const longSlug = 'a'.repeat(256)
      expect(validateSlug(longSlug)).toBe(false)
    })
  })

  describe('generateCommunitySlug', () => {
    it('should generate community slug from name', () => {
      expect(generateCommunitySlug('Dhaka Central')).toBe('dhaka-central')
      expect(generateCommunitySlug('Old Town Community')).toBe('old-town-community')
    })

    it('should handle special characters in community names', () => {
      expect(generateCommunitySlug('Dhaka & Chittagong')).toBe('dhaka-chittagong')
    })
  })

  describe('ensureUniqueSlug', () => {
    it('should return original slug if unique', () => {
      const existingSlugs = ['hello-world', 'test-post']
      expect(ensureUniqueSlug('new-post', existingSlugs)).toBe('new-post')
    })

    it('should append number if slug exists', () => {
      const existingSlugs = ['hello-world', 'test-post']
      expect(ensureUniqueSlug('hello-world', existingSlugs)).toBe('hello-world-1')
    })

    it('should increment number until unique', () => {
      const existingSlugs = ['hello-world', 'hello-world-1', 'hello-world-2']
      expect(ensureUniqueSlug('hello-world', existingSlugs)).toBe('hello-world-3')
    })
  })

  describe('extractSlugFromPath', () => {
    it('should extract slug from community path', () => {
      const path = '/community/c/dhaka-central'
      const pattern = '/community/c/[slug]'
      expect(extractSlugFromPath(path, pattern)).toBe('dhaka-central')
    })

    it('should extract slug from post path', () => {
      const path = '/community/c/dhaka-central/post/p/lost-phone'
      const pattern = '/community/c/[slug]/post/p/[slug]'
      expect(extractSlugFromPath(path, pattern)).toBe('dhaka-central')
    })

    it('should return null for non-matching paths', () => {
      const path = '/different/path'
      const pattern = '/community/c/[slug]'
      expect(extractSlugFromPath(path, pattern)).toBe(null)
    })
  })

  describe('buildSlugPath', () => {
    it('should build community path', () => {
      const pattern = '/community/c/[slug]'
      const slugs = { slug: 'dhaka-central' }
      expect(buildSlugPath(pattern, slugs)).toBe('/community/c/dhaka-central')
    })

    it('should build post path with multiple slugs', () => {
      const pattern = '/community/c/[communitySlug]/post/p/[postSlug]'
      const slugs = { communitySlug: 'dhaka-central', postSlug: 'lost-phone' }
      expect(buildSlugPath(pattern, slugs)).toBe('/community/c/dhaka-central/post/p/lost-phone')
    })
  })
})