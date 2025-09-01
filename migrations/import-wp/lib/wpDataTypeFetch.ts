import {BASE_URL, PER_PAGE} from '../constants'
import type {WordPressDataType, WordPressDataTypeResponses} from '../types'

export async function wpDataTypeFetch<T extends WordPressDataType>(
  type: T,
  page: number,
): Promise<WordPressDataTypeResponses[T]> {
  const wpApiUrl = new URL(`${BASE_URL}/${type}`)
  wpApiUrl.searchParams.set('page', page.toString())
  wpApiUrl.searchParams.set('per_page', PER_PAGE.toString())

  return fetch(wpApiUrl).then((res) => (res.ok ? res.json() : null))
}
