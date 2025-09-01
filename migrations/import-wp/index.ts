import {decode} from 'html-entities'
import type {SanityDocumentLike} from 'sanity'
import {createOrReplace, defineMigration} from 'sanity/migrate'
import type {WP_REST_API_Post, WP_REST_API_Term, WP_REST_API_User} from 'wp-types'

import {getDataTypes} from './lib/getDataTypes'
import {wpDataTypeFetch} from './lib/wpDataTypeFetch'

// Allow the migration script to import a specific post type when run
export default defineMigration({
  title: 'Import WP JSON data',

  async *migrate() {
    const {wpType, sanityType} = getDataTypes(process.argv)
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        let wpData = await wpDataTypeFetch(wpType, page)

        if (Array.isArray(wpData) && wpData.length) {
          const docs: SanityDocumentLike[] = []

          for (let wpDoc of wpData) {
            const doc: SanityDocumentLike = {
              _id: `${sanityType}-${wpDoc.id}`,
              _type: sanityType,
            }

            if (wpType === 'posts' || wpType === 'pages') {
              wpDoc = wpDoc as WP_REST_API_Post
              doc.title = decode(wpDoc.title.rendered).trim()
            } else if (wpType === 'categories' || wpType === 'tags') {
              wpDoc = wpDoc as WP_REST_API_Term
              doc.name = decode(wpDoc.name).trim()
            } else if (wpType === 'users') {
              wpDoc = wpDoc as WP_REST_API_User
              doc.name = decode(wpDoc.name).trim()
            }

            docs.push(doc)
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
