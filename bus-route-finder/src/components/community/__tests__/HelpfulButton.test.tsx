import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { HelpfulButton } from '../HelpfulButton'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    error: null
  })
}))

// Mock the useHelpfulInteraction hook
vi.mock('@/hooks/useHelpfulInteraction', () => ({
  useHelpfulInteraction: () => ({
    isHelpful: false,
    helpfulCount: 5,
    isLoading: false,
    error: null,
    toggleHelpful: vi.fn(),
    canInteract: true
  })
}))

describe('HelpfulButton', () => {
  it('should render helpful button with count', () => {
    render(
      <HelpfulButton 
        postId="test-post-1" 
        initialCount={5} 
        variant="compact"
      />
    )

    expect(screen.getByText('5')).toBeTruthy()
  })

  it('should render full button variant', () => {
    render(
      <HelpfulButton 
        postId="test-post-1" 
        initialCount={3} 
        variant="default"
      />
    )

    expect(screen.getByText(/Mark Helpful \(5\)/)).toBeTruthy()
  })
})