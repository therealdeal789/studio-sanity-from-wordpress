import type {Post} from '../../../sanity.types'

export function sanityIdToImageReference(id: string): Post['featuredMedia'] {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: id},
  }
}
