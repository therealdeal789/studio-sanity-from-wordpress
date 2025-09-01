import type {UploadClientConfig} from '@sanity/client'
import {decode} from 'html-entities'

import {BASE_URL} from '../constants'

// Get WordPress' asset metadata about an image by its ID
export async function wpImageFetch(id: number): Promise<UploadClientConfig | null> {
  const wpApiUrl = new URL(`${BASE_URL}/media/${id}`).toString()
  const imageData = await fetch(wpApiUrl).then((res) => res.json())

  if (!imageData || !imageData.source_url) {
    return null
  }

  let metadata: UploadClientConfig = {
    filename: imageData.source_url.split('/').pop(),
    source: {
      id: imageData.id,
      name: 'WordPress',
      url: imageData.source_url,
    },
    // Not technically part of the Sanity imageAsset schema, but used by the popular Media Plugin
    // @ts-expect-error
    altText: imageData.alt_text,
  }

  if (imageData?.title?.rendered) {
    metadata.title = decode(imageData.title.rendered)
  }

  if (imageData?.image_meta?.caption) {
    metadata.description = imageData.image_meta.caption
  }

  if (imageData?.image_meta?.credit) {
    metadata.creditLine = imageData.image_meta.credit
  }

  return metadata
}
