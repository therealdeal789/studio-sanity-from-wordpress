import {createClient} from '@sanity/client'
import pLimit from 'p-limit'
import {createOrReplace, defineMigration} from 'sanity/migrate'
import type {WP_REST_API_Post, WP_REST_API_Term, WP_REST_API_User} from 'wp-types'

import {getDataTypes} from './lib/getDataTypes'
import {sanityFetchImages} from './lib/sanityFetchImages'
import {getAuthorIdByName, getAuthorById} from './lib/getAuthorIdByName'
import {transformToAuthor} from './lib/transformToAuthor'
import {transformToCategory} from './lib/transformToCategory'
import {transformToPage} from './lib/transformToPage'
import {transformToPost} from './lib/transformToPost'
import {transformToTag} from './lib/transformToTag'
import {wpDataTypeFetch} from './lib/wpDataTypeFetch'

const limit = pLimit(5)

export default defineMigration({
  title: 'Import WP JSON data',

  async *migrate(docs, context) {
    // Create a full client to handle image uploads
    const client = createClient(context.client.config())

    // Create an in-memory image cache to avoid re-uploading images
    const existingImages = await sanityFetchImages(client)

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
        authorId = await getAuthorIdByName([
          'Redaksjonen',
          'Editorial team',
          'Editorial',
          'Redaktionen',
        ])

        if (!authorId) {
          console.log('Author "Redaksjonen"/"Editorial team" not found. No posts will be imported.')
          console.log(
            'Try running the migration without author filtering first to see all available authors.',
          )
          return
        }
      }
    }

    while (hasMore) {
      try {
        let wpData = await wpDataTypeFetch(wpType, page, authorId || undefined)

        if (Array.isArray(wpData) && wpData.length) {
          // Create an array of concurrency-limited promises to stage documents
          const docs = wpData.map((wpDoc) =>
            limit(async () => {
              if (wpType === 'posts') {
                wpDoc = wpDoc as WP_REST_API_Post
                const doc = await transformToPost(wpDoc, client, existingImages)
                return doc
              } else if (wpType === 'pages') {
                wpDoc = wpDoc as WP_REST_API_Post
                const doc = await transformToPage(wpDoc)
                return doc
              } else if (wpType === 'categories') {
                wpDoc = wpDoc as WP_REST_API_Term
                const doc = await transformToCategory(wpDoc)
                return doc
              } else if (wpType === 'tags') {
                wpDoc = wpDoc as WP_REST_API_Term
                const doc = await transformToTag(wpDoc)
                return doc
              } else if (wpType === 'users') {
                wpDoc = wpDoc as WP_REST_API_User
                const doc = await transformToAuthor(wpDoc)
                return doc
              }

              throw new Error(`Unhandled WordPress type: ${wpType}`)
            }),
          )

          // Resolve all documents concurrently, throttled by p-limit
          const resolvedDocs = await Promise.all(docs)

          yield resolvedDocs.map((doc) => createOrReplace(doc))
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
