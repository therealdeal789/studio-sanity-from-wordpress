import {BASE_URL, PER_PAGE} from '../constants'
import type {WordPressDataType, WordPressDataTypeResponses} from '../types'

export async function wpDataTypeFetch<T extends WordPressDataType>(
  type: T,
  page: number,
  authorId?: number,
): Promise<WordPressDataTypeResponses[T]> {
  const wpApiUrl = new URL(`${BASE_URL}/${type}`)
  wpApiUrl.searchParams.set('page', page.toString())
  wpApiUrl.searchParams.set('per_page', PER_PAGE.toString())
  
  // Filter by author if specified (for posts and pages)
  if (authorId && (type === 'posts' || type === 'pages')) {
    wpApiUrl.searchParams.set('author', authorId.toString())
  }

  return fetch(wpApiUrl).then((res) => (res.ok ? res.json() : null))
}
