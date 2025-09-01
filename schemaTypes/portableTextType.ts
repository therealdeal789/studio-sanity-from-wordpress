import {defineField} from 'sanity'

export const portableTextType = defineField({
  name: 'portableText',
  type: 'array',
  of: [{type: 'block'}, {type: 'image'}, {type: 'externalImage'}],
})
