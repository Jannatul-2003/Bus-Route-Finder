/**
 * CommunityService Usage Examples
 * 
 * This file demonstrates how to use the CommunityService for managing
 * the Area-Based Community System.
 */

import { CommunityService } from './CommunityService'
import { getSupabaseClient } from '../supabase/client'

// Initialize the service
const supabase = getSupabaseClient()
const communityService = new CommunityService(supabase)

// ==================== COMMUNITIES ====================

async function exampleCreateCommunity() {
  const community = await communityService.createCommunity({
    name: 'Downtown Commuters',
    description: 'Community for commuters in the downtown area',
    center_latitude: 40.7128,
    center_longitude: -74.0060,
    radius_meters: 2000 // 2km radius
  })
  console.log('Created community:', community)
}

async function exampleGetNearbyCommunities() {
  // Get communities within 5km of user's location
  const communities = await communityService.getNearbyCommunities(
    40.7128, // latitude
    -74.0060, // longitude
    5000 // 5km radius
  )
  console.log('Nearby communities:', communities)
}

async function exampleUpdateCommunity(communityId: string) {
  const updated = await communityService.updateCommunity(communityId, {
    description: 'Updated description',
    radius_meters: 3000
  })
  console.log('Updated community:', updated)
}

// ==================== COMMUNITY MEMBERS ====================

async function exampleJoinCommunity(communityId: string, userId: string) {
  const member = await communityService.joinCommunity(
    communityId,
    userId,
    {
      new_posts: true,
      lost_items: true,
      delays: true,
      emergencies: true
    }
  )
  console.log('Joined community:', member)
}

async function exampleGetUserCommunities(userId: string) {
  const communities = await communityService.getCommunitiesByUser(userId)
  console.log('User communities:', communities)
}

async function exampleLeaveCommunity(communityId: string, userId: string) {
  await communityService.leaveCommunity(communityId, userId)
  console.log('Left community')
}

// ==================== COMMUNITY POSTS ====================

async function exampleCreateDiscussionPost(communityId: string, userId: string) {
  const post = await communityService.createPost({
    community_id: communityId,
    author_id: userId,
    post_type: 'discussion',
    title: 'Best time to catch the morning bus?',
    content: 'What time do you usually catch the bus to avoid crowds?'
  })
  console.log('Created discussion post:', post)
}

async function exampleCreateLostItemPost(communityId: string, userId: string, busId: string) {
  const post = await communityService.createPost({
    community_id: communityId,
    author_id: userId,
    post_type: 'lost_item',
    title: 'Lost wallet on Bus 42',
    content: 'I lost my brown leather wallet on Bus 42 this morning around 8:30 AM',
    item_category: 'wallet',
    item_description: 'Brown leather wallet with ID cards',
    location_latitude: 40.7128,
    location_longitude: -74.0060,
    bus_id: busId
  })
  console.log('Created lost item post:', post)
}

async function exampleGetCommunityPosts(communityId: string) {
  // Get all active posts
  const allPosts = await communityService.getPostsByCommunity(communityId, {
    status: 'active',
    limit: 20
  })
  
  // Get only lost items
  const lostItems = await communityService.getPostsByCommunity(communityId, {
    postType: 'lost_item',
    status: 'active'
  })
  
  console.log('All posts:', allPosts)
  console.log('Lost items:', lostItems)
}

async function exampleUpdatePostStatus(postId: string) {
  // Mark a lost item as resolved
  const updated = await communityService.updatePost(postId, {
    status: 'resolved'
  })
  console.log('Updated post:', updated)
}

// ==================== POST COMMENTS ====================

async function exampleCreateComment(postId: string, userId: string) {
  const comment = await communityService.createComment({
    post_id: postId,
    author_id: userId,
    content: 'I found a wallet matching this description! Please contact me.'
  })
  console.log('Created comment:', comment)
}

async function exampleCreateResolutionComment(postId: string, userId: string) {
  const comment = await communityService.createComment({
    post_id: postId,
    author_id: userId,
    content: 'I have your wallet! Found it on the bus.',
    is_resolution: true,
    contact_info: 'Contact me at [email]'
  })
  console.log('Created resolution comment:', comment)
}

async function exampleGetPostComments(postId: string) {
  const comments = await communityService.getCommentsByPost(postId)
  console.log('Post comments:', comments)
}

// ==================== NOTIFICATIONS ====================

async function exampleCreateNotification(userId: string, postId: string) {
  const notification = await communityService.createNotification({
    user_id: userId,
    post_id: postId,
    notification_type: 'found_item',
    title: 'Someone found your lost item!',
    message: 'A user commented on your lost wallet post'
  })
  console.log('Created notification:', notification)
}

async function exampleGetUnreadNotifications(userId: string) {
  const notifications = await communityService.getUnreadNotifications(userId)
  console.log('Unread notifications:', notifications)
}

async function exampleMarkNotificationAsRead(notificationId: string) {
  await communityService.markNotificationAsRead(notificationId)
  console.log('Marked notification as read')
}

async function exampleMarkAllNotificationsAsRead(userId: string) {
  await communityService.markAllNotificationsAsRead(userId)
  console.log('Marked all notifications as read')
}

// ==================== FREQUENT ROUTES ====================

async function exampleAddFrequentRoute(
  userId: string,
  busId: string,
  onboardingStopId: string,
  offboardingStopId: string
) {
  const route = await communityService.addFrequentRoute({
    user_id: userId,
    bus_id: busId,
    onboarding_stop_id: onboardingStopId,
    offboarding_stop_id: offboardingStopId
  })
  console.log('Added frequent route:', route)
}

async function exampleGetUserFrequentRoutes(userId: string) {
  const routes = await communityService.getUserFrequentRoutes(userId)
  console.log('User frequent routes:', routes)
}

// ==================== COMPLETE WORKFLOW EXAMPLE ====================

async function exampleCompleteWorkflow() {
  const userId = 'user-123'
  const userLat = 40.7128
  const userLng = -74.0060
  
  // 1. Find nearby communities
  const nearbyCommunities = await communityService.getNearbyCommunities(
    userLat,
    userLng,
    5000
  )
  
  if (nearbyCommunities.length === 0) {
    // 2. Create a new community if none exist
    const newCommunity = await communityService.createCommunity({
      name: 'My Local Community',
      description: 'Community for local commuters',
      center_latitude: userLat,
      center_longitude: userLng,
      radius_meters: 2000
    })
    
    // 3. Join the community
    await communityService.joinCommunity(newCommunity.id, userId)
    
    console.log('Created and joined new community:', newCommunity)
  } else {
    // 3. Join the nearest community
    const nearestCommunity = nearbyCommunities[0]
    await communityService.joinCommunity(nearestCommunity.id, userId)
    
    console.log('Joined nearest community:', nearestCommunity)
  }
  
  // 4. Get user's communities
  const userCommunities = await communityService.getCommunitiesByUser(userId)
  const communityId = userCommunities[0].id
  
  // 5. Create a post
  const post = await communityService.createPost({
    community_id: communityId,
    author_id: userId,
    post_type: 'discussion',
    title: 'Hello everyone!',
    content: 'Just joined this community. Looking forward to connecting with fellow commuters!'
  })
  
  // 6. Get community posts
  const posts = await communityService.getPostsByCommunity(communityId)
  
  console.log('Workflow complete:', {
    communities: userCommunities,
    post,
    allPosts: posts
  })
}

export {
  exampleCreateCommunity,
  exampleGetNearbyCommunities,
  exampleJoinCommunity,
  exampleCreateDiscussionPost,
  exampleCreateLostItemPost,
  exampleCreateComment,
  exampleGetUnreadNotifications,
  exampleAddFrequentRoute,
  exampleCompleteWorkflow
}
