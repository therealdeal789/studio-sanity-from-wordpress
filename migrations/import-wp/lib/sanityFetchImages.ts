import type {SanityClient} from 'sanity'

const query = `*[
    _type == "sanity.imageAsset" 
    && defined(source.id)
    && source.name == "WordPress"
]{
    _id,
    "sourceId": source.id
}`

export async function sanityFetchImages(client: SanityClient) {
  const initialImages = await client.fetch<{_id: string; sourceId: number}[]>(query)
  const existingImages: Record<number, string> = {}

  for (let index = 0; index < initialImages.length; index++) {
    existingImages[initialImages[index].sourceId] = initialImages[index]._id
  }

  return existingImages
}
