import type {SanitySchemaType, WordPressDataType} from './types'

export const BASE_URL = `https://aktier.se/wp-json/wp/v2`
export const PER_PAGE = 100

export const WP_TYPE_TO_SANITY_SCHEMA_TYPE: Record<WordPressDataType, SanitySchemaType> = {
  categories: 'category',
  posts: 'post',
  pages: 'page',
  tags: 'tag',
  users: 'author',
}
