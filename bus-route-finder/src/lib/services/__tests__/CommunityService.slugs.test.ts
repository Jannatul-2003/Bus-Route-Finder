import { describe, it, expect } from 'vitest'
import { generatePostSlug, validateSlug } from '../../utils/slugs'

describe('Post Slug Generation Integration', () => {

  describe('slug generation integration', () => {
    it('should generate valid slugs from post titles', () => {
      const testTitles = [
        'Lost Phone on Bus Route 123',
        'Emergency: Road Blocked!',
        'Found Wallet Near Station',
        'Bus Delay Report - Route A1',
        'Community Meeting Tomorrow'
      ]

      testTitles.forEach(title => {
        const slug = generatePostSlug(title)
        expect(validateSlug(slug)).toBe(true)
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      })
    })

    it('should handle edge cases in title conversion', () => {
      const edgeCases = [
        { title: '', expected: '' },
        { title: '   ', expected: '' },
        { title: '!!!', expected: '' },
        { title: 'A', expected: 'a' },
        { title: '123', expected: '123' },
        { title: 'Hello---World', expected: 'hello-world' },
        { title: '   Hello World   ', expected: 'hello-world' }
      ]

      edgeCases.forEach(({ title, expected }) => {
        const slug = generatePostSlug(title)
        expect(slug).toBe(expected)
      })
    })

    it('should generate different slugs for different titles', () => {
      const titles = [
        'Lost Phone',
        'Found Phone',
        'Bus Delay',
        'Emergency Alert'
      ]

      const slugs = titles.map(title => generatePostSlug(title))
      const uniqueSlugs = new Set(slugs)
      
      expect(uniqueSlugs.size).toBe(titles.length)
    })

    it('should generate consistent slugs for same title', () => {
      const title = 'Lost Phone on Bus Route 123'
      const slug1 = generatePostSlug(title)
      const slug2 = generatePostSlug(title)
      
      expect(slug1).toBe(slug2)
    })

    it('should handle special characters correctly', () => {
      const specialCases = [
        { title: 'Bus & Train Schedule', expected: 'bus-train-schedule' },
        { title: 'Route #123 Update', expected: 'route-123-update' },
        { title: 'Lost @ Station', expected: 'lost-station' },
        { title: 'Help! Emergency!!!', expected: 'help-emergency' }
      ]

      specialCases.forEach(({ title, expected }) => {
        const slug = generatePostSlug(title)
        expect(slug).toBe(expected)
      })
    })

    it('should handle unicode and non-English characters', () => {
      const unicodeCases = [
        { title: 'বাস রুট আপডেট', expected: '' }, // Bengali - should be empty after filtering
        { title: 'Bus রুট 123', expected: 'bus-123' }, // Mixed - should keep English/numbers
        { title: 'Café Meeting', expected: 'caf-meeting' }
      ]

      unicodeCases.forEach(({ title, expected }) => {
        const slug = generatePostSlug(title)
        expect(slug).toBe(expected)
      })
    })
  })

  describe('slug validation', () => {
    it('should validate properly formatted slugs', () => {
      const validSlugs = [
        'hello-world',
        'bus-route-123',
        'lost-phone',
        'emergency-alert',
        'test',
        'a',
        '123',
        'hello-world-test-123'
      ]

      validSlugs.forEach(slug => {
        expect(validateSlug(slug)).toBe(true)
      })
    })

    it('should reject improperly formatted slugs', () => {
      const invalidSlugs = [
        '',
        '-hello',
        'hello-',
        'hello--world',
        'Hello-World',
        'hello_world',
        'hello world',
        'hello.world',
        'hello@world',
        'a'.repeat(256) // too long
      ]

      invalidSlugs.forEach(slug => {
        expect(validateSlug(slug)).toBe(false)
      })
    })
  })
})