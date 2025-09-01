import {decode} from 'html-entities'
import type {WP_REST_API_Post} from 'wp-types'

import type {Page} from '../../../sanity.types'

// Remove these keys because they'll be created by Content Lake
type StagedPage = Omit<Page, '_createdAt' | '_updatedAt' | '_rev'>

export async function transformToPage(wpDoc: WP_REST_API_Post): Promise<StagedPage> {
  const doc: StagedPage = {
    _id: `page-${wpDoc.id}`,
    _type: 'page',
  }

  doc.title = decode(wpDoc.title.rendered).trim()

  if (wpDoc.slug) {
    doc.slug = {_type: 'slug', current: wpDoc.slug}
  }

  if (wpDoc.author) {
    doc.author = {
      _type: 'reference',
      _ref: `author-${wpDoc.author}`,
    }
  }

  if (wpDoc.date) {
    doc.date = wpDoc.date
  }

  if (wpDoc.modified) {
    doc.modified = wpDoc.modified
  }

  if (wpDoc.status) {
    doc.status = wpDoc.status as StagedPage['status']
  }

  return doc
}
