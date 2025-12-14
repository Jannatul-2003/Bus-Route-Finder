"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"

interface HelpfulState {
  isHelpful: boolean
  helpfulCount: number
  isLoading: boolean
  error: string | null
}

export function useHelpfulInteraction(postId: string, initialCount: number = 0) {
  const { user } = useAuth()
  const [state, setState] = useState<HelpfulState>({
    isHelpful: false,
    helpfulCount: initialCount,
    isLoading: false,
    error: null
  })

  // Fetch initial helpful state for authenticated users
  useEffect(() => {
    if (!user || !postId) return

    const fetchHelpfulState = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        const response = await fetch(`/api/posts/${postId}/helpful`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch helpful state')
        }

        const data = await response.json()
        setState(prev => ({
          ...prev,
          isHelpful: data.isHelpful,
          isLoading: false
        }))
      } catch (error) {
        console.error('Error fetching helpful state:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        }))
      }
    }

    fetchHelpfulState()
  }, [user, postId])

  const toggleHelpful = async () => {
    if (!user || !postId || state.isLoading) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/posts/${postId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle helpful status')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        isHelpful: data.isHelpful,
        helpfulCount: data.helpfulCount,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error toggling helpful status:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }))
    }
  }

  return {
    ...state,
    toggleHelpful,
    canInteract: !!user
  }
}