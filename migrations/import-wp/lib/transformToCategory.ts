import {decode} from 'html-entities'
import type {WP_REST_API_Term} from 'wp-types'

import type {Category} from '../../../sanity.types'

// Remove these keys because they'll be created by Content Lake
type StagedCategory = Omit<Category, '_createdAt' | '_updatedAt' | '_rev'>

export async function transformToCategory(wpDoc: WP_REST_API_Term): Promise<StagedCategory> {
  const doc: StagedCategory = {
    _id: `category-${wpDoc.id}`,
    _type: 'category',
  }

  if (wpDoc.name) {
    doc.name = decode(wpDoc.name).trim()
  }

  if (wpDoc.slug) {
    doc.slug = {_type: 'slug', current: wpDoc.slug}
  }

  return doc
}
