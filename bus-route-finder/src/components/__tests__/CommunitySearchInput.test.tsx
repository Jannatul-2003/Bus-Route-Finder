import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CommunitySearchInput } from '../CommunitySearchInput'

describe('CommunitySearchInput', () => {
  const defaultProps = {
    searchQuery: '',
    searchRadius: 5000,
    isRadiusSet: false,
    onSearchChange: vi.fn(),
    onRadiusChange: vi.fn(),
    onRadiusSearch: vi.fn(),
    onNameSearch: vi.fn(),
    disabled: false
  }

  describe('Basic functionality', () => {
    it('should render search radius input with label', () => {
      render(<CommunitySearchInput {...defaultProps} />)
      
      expect(screen.getByLabelText(/Search Radius/)).toBeTruthy()
      expect(screen.getByText('Search Radius (meters)')).toBeTruthy()
    })

    it('should render community name search input with label', () => {
      render(<CommunitySearchInput {...defaultProps} />)
      
      expect(screen.getByLabelText(/Search by Name/)).toBeTruthy()
      expect(screen.getByPlaceholderText('Search communities by name...')).toBeTruthy()
    })

    it('should display help text for radius input', () => {
      render(<CommunitySearchInput {...defaultProps} />)
      
      expect(screen.getByText('Enter radius in meters (100-50000). Validation happens when you click Search.')).toBeTruthy()
    })

    it('should display help text for name search', () => {
      render(<CommunitySearchInput {...defaultProps} />)
      
      expect(screen.getByText('Search globally by community name')).toBeTruthy()
    })

    it('should call onRadiusChange when radius input changes', () => {
      const onRadiusChange = vi.fn()
      render(<CommunitySearchInput {...defaultProps} onRadiusChange={onRadiusChange} />)
      
      const radiusInput = screen.getByLabelText(/Search Radius/)
      fireEvent.change(radiusInput, { target: { value: '2000' } })
      
      expect(onRadiusChange).toHaveBeenCalledWith(2000)
    })

    it('should call onSearchChange when name input changes', () => {
      const onSearchChange = vi.fn()
      render(<CommunitySearchInput {...defaultProps} onSearchChange={onSearchChange} />)
      
      const nameInput = screen.getByPlaceholderText('Search communities by name...')
      fireEvent.change(nameInput, { target: { value: 'test community' } })
      
      expect(onSearchChange).toHaveBeenCalledWith('test community')
    })

    it('should call onRadiusSearch when radius search button is clicked', () => {
      const onRadiusSearch = vi.fn()
      render(<CommunitySearchInput {...defaultProps} onRadiusSearch={onRadiusSearch} searchRadius={5000} />)
      
      const searchButton = screen.getAllByText('Search')[0] // First search button is for radius
      fireEvent.click(searchButton)
      
      expect(onRadiusSearch).toHaveBeenCalledWith(5000)
    })

    it('should call onNameSearch when name search button is clicked', () => {
      const onNameSearch = vi.fn()
      render(<CommunitySearchInput {...defaultProps} onNameSearch={onNameSearch} searchQuery="test" />)
      
      const searchButton = screen.getAllByText('Search')[1] // Second search button is for name
      fireEvent.click(searchButton)
      
      expect(onNameSearch).toHaveBeenCalled()
    })

    it('should disable radius search button when no radius is set', () => {
      render(<CommunitySearchInput {...defaultProps} searchRadius={0} />)
      
      const searchButton = screen.getAllByText('Search')[0]
      expect(searchButton.hasAttribute('disabled')).toBe(true)
    })

    it('should disable name search button when no query is entered', () => {
      render(<CommunitySearchInput {...defaultProps} searchQuery="" />)
      
      const searchButton = screen.getAllByText('Search')[1]
      expect(searchButton.hasAttribute('disabled')).toBe(true)
    })

    it('should show validation error for invalid radius input', () => {
      render(<CommunitySearchInput {...defaultProps} />)
      
      const radiusInput = screen.getByLabelText(/Search Radius/)
      fireEvent.change(radiusInput, { target: { value: 'abc' } })
      
      expect(screen.getByText('Please enter a valid integer')).toBeTruthy()
    })

    it('should validate radius range when search button is clicked', () => {
      render(<CommunitySearchInput {...defaultProps} searchRadius={50} />)
      
      const searchButton = screen.getAllByText('Search')[0]
      fireEvent.click(searchButton)
      
      expect(screen.getByText('Minimum radius is 100 meters')).toBeTruthy()
    })

    it('should validate maximum radius when search button is clicked', () => {
      render(<CommunitySearchInput {...defaultProps} searchRadius={60000} />)
      
      const searchButton = screen.getAllByText('Search')[0]
      fireEvent.click(searchButton)
      
      expect(screen.getByText('Maximum radius is 50,000 meters (50km)')).toBeTruthy()
    })
  })
})