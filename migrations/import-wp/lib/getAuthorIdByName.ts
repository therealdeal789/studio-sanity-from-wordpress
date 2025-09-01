import type {WP_REST_API_User} from 'wp-types'
import {BASE_URL} from '../constants'

export async function getAuthorIdByName(authorNames: string[]): Promise<number | null> {
  try {
    // First try to get all users
    const wpApiUrl = new URL(`${BASE_URL}/users`)
    wpApiUrl.searchParams.set('per_page', '100') // Get more users to ensure we find the right one
    
    const response = await fetch(wpApiUrl)
    if (!response.ok) return null
    
    const users: WP_REST_API_User[] = await response.json()
    
    // Look for any of the provided author names
    const author = users.find(user => 
      authorNames.some(name => 
        user.name?.toLowerCase().includes(name.toLowerCase()) ||
        user.slug?.toLowerCase().includes(name.toLowerCase()) ||
        user.description?.toLowerCase().includes(name.toLowerCase())
      )
    )
    
    if (author) {
      console.log(`Found author: ${author.name} (ID: ${author.id})`)
      return author.id
    }
    
    // If not found by name, let's list all available authors for debugging
    console.log('Available authors:')
    users.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.id}, slug: ${user.slug})`)
    })
    
    return null
  } catch (error) {
    console.error(`Error fetching authors:`, error)
    return null
  }
}

export async function getAuthorById(authorId: number): Promise<WP_REST_API_User | null> {
  try {
    const wpApiUrl = new URL(`${BASE_URL}/users/${authorId}`)
    const response = await fetch(wpApiUrl)
    
    if (!response.ok) return null
    
    const user: WP_REST_API_User = await response.json()
    console.log(`Found author by ID ${authorId}: ${user.name}`)
    return user
  } catch (error) {
    console.error(`Error fetching author with ID ${authorId}:`, error)
    return null
  }
}
