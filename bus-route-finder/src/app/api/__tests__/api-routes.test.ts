import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Integration tests for API routes
 * 
 * These tests verify that the API endpoints are properly structured
 * and handle validation correctly.
 */

describe('API Routes - Enhanced Queries', () => {
  describe('/api/stops/within-threshold', () => {
    it('should validate required parameters', async () => {
      const { GET } = await import('../stops/within-threshold/route')
      
      // Missing all parameters
      const request = new NextRequest('http://localhost:3000/api/stops/within-threshold')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })
    
    it('should validate latitude range', async () => {
      const { GET } = await import('../stops/within-threshold/route')
      
      const request = new NextRequest('http://localhost:3000/api/stops/within-threshold?lat=100&lng=90&threshold=500')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid latitude')
    })
    
    it('should validate longitude range', async () => {
      const { GET } = await import('../stops/within-threshold/route')
      
      const request = new NextRequest('http://localhost:3000/api/stops/within-threshold?lat=23.8&lng=200&threshold=500')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid longitude')
    })
    
    it('should validate threshold range (Requirements 1.3: 100-5000 meters)', async () => {
      const { GET } = await import('../stops/within-threshold/route')
      
      // Below minimum
      let request = new NextRequest('http://localhost:3000/api/stops/within-threshold?lat=23.8&lng=90.4&threshold=50')
      let response = await GET(request)
      let data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid threshold')
      
      // Above maximum
      request = new NextRequest('http://localhost:3000/api/stops/within-threshold?lat=23.8&lng=90.4&threshold=6000')
      response = await GET(request)
      data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid threshold')
    })
  })
  
  describe('/api/buses/between-stops', () => {
    it('should validate required parameters', async () => {
      const { GET } = await import('../buses/between-stops/route')
      
      // Missing all parameters
      const request = new NextRequest('http://localhost:3000/api/buses/between-stops')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })
    
    it('should validate that stops are different', async () => {
      const { GET } = await import('../buses/between-stops/route')
      
      const stopId = 'same-stop-id'
      const request = new NextRequest(`http://localhost:3000/api/buses/between-stops?onboarding=${stopId}&offboarding=${stopId}`)
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid stop selection')
    })
  })
  
  describe('/api/route-stops/journey-length', () => {
    it('should validate required parameters', async () => {
      const { GET } = await import('../route-stops/journey-length/route')
      
      // Missing all parameters
      const request = new NextRequest('http://localhost:3000/api/route-stops/journey-length')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })
    
    it('should validate direction parameter', async () => {
      const { GET } = await import('../route-stops/journey-length/route')
      
      const request = new NextRequest('http://localhost:3000/api/route-stops/journey-length?busId=bus1&onboardingOrder=1&offboardingOrder=5&direction=invalid')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid direction')
    })
    
    it('should validate stop order values are non-negative integers', async () => {
      const { GET } = await import('../route-stops/journey-length/route')
      
      // Negative onboarding order
      let request = new NextRequest('http://localhost:3000/api/route-stops/journey-length?busId=bus1&onboardingOrder=-1&offboardingOrder=5&direction=outbound')
      let response = await GET(request)
      let data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid onboarding order')
      
      // Negative offboarding order
      request = new NextRequest('http://localhost:3000/api/route-stops/journey-length?busId=bus1&onboardingOrder=1&offboardingOrder=-5&direction=outbound')
      response = await GET(request)
      data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid offboarding order')
    })
    
    it('should validate stop order relationship (Requirements 4.2: onboarding before offboarding)', async () => {
      const { GET } = await import('../route-stops/journey-length/route')
      
      // Onboarding >= offboarding
      const request = new NextRequest('http://localhost:3000/api/route-stops/journey-length?busId=bus1&onboardingOrder=5&offboardingOrder=5&direction=outbound')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid stop order')
    })
  })
})
