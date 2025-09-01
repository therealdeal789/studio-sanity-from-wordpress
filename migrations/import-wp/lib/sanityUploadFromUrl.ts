import {Readable} from 'node:stream'

import type {SanityClient, SanityImageAssetDocument, UploadClientConfig} from '@sanity/client'

export async function sanityUploadFromUrl(
  url: string,
  client: SanityClient,
  metadata: UploadClientConfig,
): Promise<SanityImageAssetDocument | null> {
  const {body} = await fetch(url)
  if (!body) {
    throw new Error(`No body found for ${url}`)
  }
  let data: SanityImageAssetDocument | null = null
  try {
    data = await client.assets.upload('image', Readable.fromWeb(body as any), metadata)
  } catch (error) {
    console.error(`Failed to upload image from ${url}`)
    console.error(error)

    return null
  }

  return data
}
