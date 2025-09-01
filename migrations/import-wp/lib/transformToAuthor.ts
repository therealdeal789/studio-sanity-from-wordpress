import {decode} from 'html-entities'
import type {WP_REST_API_User} from 'wp-types'

import type {Author} from '../../../sanity.types'

// Remove these keys because they'll be created by Content Lake
type StagedAuthor = Omit<Author, '_createdAt' | '_updatedAt' | '_rev'>

export async function transformToAuthor(wpDoc: WP_REST_API_User): Promise<StagedAuthor> {
  const doc: StagedAuthor = {
    _id: `author-${wpDoc.id}`,
    _type: 'author',
  }

  if (wpDoc.name) {
    doc.name = decode(wpDoc.name).trim()
  }

  if (wpDoc.slug) {
    doc.slug = {_type: 'slug', current: wpDoc.slug}
  }

  if (wpDoc.url) {
    doc.url = wpDoc.url
  }

  if (wpDoc.description) {
    doc.description = decode(wpDoc.description).trim()
  }

  return doc
}
