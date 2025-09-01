import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {uuid} from '@sanity/uuid'
import {JSDOM} from 'jsdom'
import pLimit from 'p-limit'
import type {FieldDefinition, SanityClient} from 'sanity'

import type {Post} from '../../../sanity.types'
import {schemaTypes} from '../../../schemaTypes'
import {BASE_URL} from '../constants'
import {sanityIdToImageReference} from './sanityIdToImageReference'
import {sanityUploadFromUrl} from './sanityUploadFromUrl'
import {wpImageFetch} from './wpImageFetch'

// Create schema with built-in Sanity types for htmlToBlocks compatibility
let blockContentSchema: any
try {
  const defaultSchema = Schema.compile({
    types: [
      ...schemaTypes,
      // Include essential built-in Sanity types that may be referenced in schemas
      {
        name: 'sanity.imageHotspot',
        type: 'object',
        fields: [
          {name: 'x', type: 'number'},
          {name: 'y', type: 'number'},
          {name: 'height', type: 'number'},
          {name: 'width', type: 'number'},
        ],
      },
      {
        name: 'sanity.imageCrop',
        type: 'object',
        fields: [
          {name: 'top', type: 'number'},
          {name: 'bottom', type: 'number'},
          {name: 'left', type: 'number'},
          {name: 'right', type: 'number'},
        ],
      },
      {
        name: 'sanity.imageAsset',
        type: 'document',
        fields: [
          {name: '_id', type: 'string'},
          {name: 'originalFilename', type: 'string'},
          {name: 'url', type: 'url'},
        ],
      },
    ],
  })
  
  blockContentSchema = defaultSchema
    .get('post')
    .fields.find((field: FieldDefinition) => field.name === 'content').type
} catch (error) {
  console.warn('Could not compile full schema, using simplified schema for htmlToBlocks:', error)
  // Fallback: create a minimal schema that htmlToBlocks can work with
  blockContentSchema = {
    jsonType: 'array',
    of: [
      {type: 'block'},
      {type: 'image'},
      {type: 'externalImage'},
    ],
  }
}

export async function htmlToBlockContent(
  html: string,
  client: SanityClient,
  imageCache: Record<number, string>,
): Promise<Post['content']> {
  // Convert HTML to Sanity's Portable Text
  let blocks = htmlToBlocks(html, blockContentSchema, {
    parseHtml: (html) => new JSDOM(html).window.document,
    rules: [
      {
        deserialize(node, next, block) {
          const el = node as HTMLElement

          if (node.nodeName.toLowerCase() === 'figure') {
            const url = el.querySelector('img')?.getAttribute('src')

            if (!url) {
              return undefined
            }

            return block({
              // these attributes may be overwritten by the image upload below
              _type: 'externalImage',
              url,
            })
          }

          return undefined
        },
      },
    ],
  })

  // Note: Multiple documents may be running this same function concurrently
  const limit = pLimit(2)

  const blocksWithUploads = blocks.map((block) =>
    limit(async () => {
      if (block._type !== 'externalImage' || !('url' in block)) {
        return block
      }

      // The filename is usually stored as the "slug" in WordPress media documents
      // Filename may be appended with dimensions like "-1024x683", remove with regex
      const dimensions = /-\d+x\d+$/
      let slug = (block.url as string)
        .split('/')
        .pop()
        ?.split('.')
        ?.shift()
        ?.replace(dimensions, '')
        .toLocaleLowerCase()

      const imageId = await fetch(`${BASE_URL}/media?slug=${slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => (Array.isArray(data) && data.length ? data[0].id : null))

      if (typeof imageId !== 'number' || !imageId) {
        return block
      }

      if (imageCache[imageId]) {
        return {
          _key: block._key,
          ...sanityIdToImageReference(imageCache[imageId]),
        } as Extract<Post['content'], {_type: 'image'}>
      }

      const imageMetadata = await wpImageFetch(imageId)
      if (imageMetadata?.source?.url) {
        const imageDocument = await sanityUploadFromUrl(
          imageMetadata.source.url,
          client,
          imageMetadata,
        )
        if (imageDocument) {
          // Add to in-memory cache if re-used in other documents
          imageCache[imageId] = imageDocument._id

          return {
            _key: block._key,
            ...sanityIdToImageReference(imageCache[imageId]),
          } as Extract<Post['content'], {_type: 'image'}>
        } else {
          return block
        }
      }

      return block
    }),
  )

  blocks = await Promise.all(blocksWithUploads)

  // Eliminate empty blocks
  blocks = blocks.filter((block) => {
    if (!block) {
      return false
    } else if (!('children' in block)) {
      return true
    }

    return (
      (block.children as Array<{text: string}>).map((c: {text: string}) => c.text.trim()).join('')
        .length > 0
    )
  })

  blocks = blocks.map((block) => (block._key ? block : {...block, _key: uuid()}))

  // TS complains there's no _key in these blocks, but this is corrected in the map above
  // @ts-expect-error
  return blocks
}
