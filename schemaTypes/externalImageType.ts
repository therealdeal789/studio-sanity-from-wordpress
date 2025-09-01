import {defineType} from 'sanity'

export const externalImageType = defineType({
  name: 'externalImage',
  title: 'External Image',
  type: 'object',
  fields: [
    {
      name: 'url',
      title: 'URL',
      type: 'url',
    },
  ],
})
