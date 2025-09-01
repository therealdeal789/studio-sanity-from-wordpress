import {decode} from 'html-entities'
import type {WP_REST_API_Term} from 'wp-types'

import type {Tag} from '../../../sanity.types'

// Remove these keys because they'll be created by Content Lake
type StagedTag = Omit<Tag, '_createdAt' | '_updatedAt' | '_rev'>

export async function transformToTag(wpDoc: WP_REST_API_Term): Promise<StagedTag> {
  const doc: StagedTag = {
    _id: `tag-${wpDoc.id}`,
    _type: 'tag',
  }

  if (wpDoc.name) {
    doc.name = decode(wpDoc.name).trim()
  }

  if (wpDoc.slug) {
    doc.slug = {_type: 'slug', current: wpDoc.slug}
  }

  return doc
}
