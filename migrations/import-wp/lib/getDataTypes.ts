import {WP_TYPE_TO_SANITY_SCHEMA_TYPE} from '../constants'
import type {SanitySchemaType, WordPressDataType} from '../types'

// Get WordPress type from CLI arguments, and the corresponding Sanity schema type
export function getDataTypes(args: string[]): {
  wpType: WordPressDataType
  sanityType: SanitySchemaType
} {
  let wpType = args
    .find((a) => a.startsWith('--type='))
    ?.split('=')
    .pop() as WordPressDataType
  let sanityType = WP_TYPE_TO_SANITY_SCHEMA_TYPE[wpType]

  if (!wpType || !sanityType) {
    throw new Error(
      `Invalid WordPress data type, specify a with --type= ${Object.keys(
        WP_TYPE_TO_SANITY_SCHEMA_TYPE,
      ).join(', ')}`,
    )
  }

  return {wpType, sanityType}
}
