import type {SanityDocumentLike} from 'sanity'
import {createOrReplace, defineMigration} from 'sanity/migrate'

import {wpDataTypeFetch} from './lib/wpDataTypeFetch'

// This will import `post` documents into Sanity from the WordPress API
export default defineMigration({
  title: 'Import WP',

  async *migrate() {
    const wpType = 'posts'
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const wpData = await wpDataTypeFetch(wpType, page)

        if (Array.isArray(wpData) && wpData.length) {
          const docs: SanityDocumentLike[] = []

          for (const wpDoc of wpData) {
            const doc: SanityDocumentLike = {
              _id: `post-${wpDoc.id}`,
              _type: 'post',
              title: wpDoc.title?.rendered.trim(),
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
