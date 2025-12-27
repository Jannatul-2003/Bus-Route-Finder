import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommentCard } from '../CommentCard'
import type { CommentWithAuthor } from '@/lib/types/community'

describe('CommentCard', () => {
  const mockComment: CommentWithAuthor = {
    id: 'comment-1',
    post_id: 'post-1',
    author_id: 'user-1',
    content: 'This is a test comment',
    is_resolution: false,
    contact_info: null,
    helpful_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    author: {
      id: 'user-1',
      email: 'commenter@example.com'
    }
  }

  it('should display author email when available', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('commenter@example.com')).toBeTruthy()
    expect(screen.getByText('This is a test comment')).toBeTruthy()
    expect(screen.getByText('2 helpful')).toBeTruthy()
  })

  it('should display fallback when author email is not available', () => {
    const commentWithoutAuthor = { ...mockComment, author: undefined }
    
    render(<CommentCard comment={commentWithoutAuthor} />)

    expect(screen.getByText('Anonymous')).toBeTruthy()
    expect(screen.getByText('This is a test comment')).toBeTruthy()
  })

  it('should show solution badge for resolution comments', () => {
    const resolutionComment = { ...mockComment, is_resolution: true }
    
    render(<CommentCard comment={resolutionComment} />)

    expect(screen.getByText('Solution')).toBeTruthy()
    expect(screen.getByText('commenter@example.com')).toBeTruthy()
  })
})