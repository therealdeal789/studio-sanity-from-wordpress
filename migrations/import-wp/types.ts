import type {
  WP_REST_API_Categories,
  WP_REST_API_Pages,
  WP_REST_API_Posts,
  WP_REST_API_Tags,
  WP_REST_API_Users,
} from 'wp-types'

export type WordPressDataType = 'categories' | 'posts' | 'pages' | 'tags' | 'users'

export type WordPressDataTypeResponses = {
  categories: WP_REST_API_Categories
  posts: WP_REST_API_Posts
  pages: WP_REST_API_Pages
  tags: WP_REST_API_Tags
  users: WP_REST_API_Users
}

export type SanitySchemaType = 'category' | 'post' | 'page' | 'tag' | 'author'
