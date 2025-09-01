import type {SanityDocumentLike} from 'sanity'
import {createOrReplace, defineMigration} from 'sanity/migrate'
import type {WP_REST_API_Post, WP_REST_API_Term, WP_REST_API_User} from 'wp-types'

import {getDataTypes} from './lib/getDataTypes'
import {getAuthorIdByName, getAuthorById} from './lib/getAuthorIdByName'
import {transformToAuthor} from './lib/transformToAuthor'
import {transformToCategory} from './lib/transformToCategory'
import {transformToPage} from './lib/transformToPage'
import {transformToPost} from './lib/transformToPost'
import {transformToTag} from './lib/transformToTag'
import {wpDataTypeFetch} from './lib/wpDataTypeFetch'

export default defineMigration({
  title: 'Import WP JSON data',

  async *migrate() {
    const {wpType} = getDataTypes(process.argv)
    let page = 1
    let hasMore = true
    let authorId: number | null = null

    // If we're importing posts, get the author ID for "Redaksjonen"/"Editorial team"
    if (wpType === 'posts') {
      // First try the known author ID from the WordPress admin URL
      const knownAuthorId = 8
      const author = await getAuthorById(knownAuthorId)
      
      if (author) {
        authorId = knownAuthorId
        console.log(`Using known author ID ${authorId}: ${author.name}`)
      } else {
        // Fallback: try to find by name variations
        authorId = await getAuthorIdByName(['Redaksjonen', 'Editorial team', 'Editorial', 'Redaktionen'])
        
        if (!authorId) {
          console.log('Author "Redaksjonen"/"Editorial team" not found. No posts will be imported.')
          console.log('Try running the migration without author filtering first to see all available authors.')
          return
        }
      }
    }

    while (hasMore) {
      try {
        let wpData = await wpDataTypeFetch(wpType, page, authorId || undefined)

        if (Array.isArray(wpData) && wpData.length) {
          const docs: SanityDocumentLike[] = []

          for (let wpDoc of wpData) {
            if (wpType === 'posts') {
              wpDoc = wpDoc as WP_REST_API_Post
              const doc = await transformToPost(wpDoc)
              docs.push(doc)
            } else if (wpType === 'pages') {
              wpDoc = wpDoc as WP_REST_API_Post
              const doc = await transformToPage(wpDoc)
              docs.push(doc)
            } else if (wpType === 'categories') {
              wpDoc = wpDoc as WP_REST_API_Term
              const doc = await transformToCategory(wpDoc)
              docs.push(doc)
            } else if (wpType === 'tags') {
              wpDoc = wpDoc as WP_REST_API_Term
              const doc = await transformToTag(wpDoc)
              docs.push(doc)
            } else if (wpType === 'users') {
              wpDoc = wpDoc as WP_REST_API_User
              const doc = await transformToAuthor(wpDoc)
              docs.push(doc)
            }
          }

          yield docs.map((doc) => createOrReplace(doc))
          page++
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`Error fetching data for page ${page}:`, error)
        // Stop the loop in case of an error
        hasMore = false
      }
    }
  },
})
