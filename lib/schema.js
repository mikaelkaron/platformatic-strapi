import { schemaComponents as basicSchemaComponents } from '@platformatic/basic'
import { schemaComponents as utilsSchemaComponents } from '@platformatic/utils'
import { readFileSync } from 'node:fs'

export const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const version = packageJson.version

export const strapi = {
  type: 'object',
  properties: {
    outputDirectory: {
      type: 'string',
      default: 'dist'
    }
  },
  default: {},
  additionalProperties: false
}

export const schemaComponents = { strapi }

export const schema = {
  $id: `https://schemas.platformatic.dev/@platformatic/strapi/${version}.json`,
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Platformatic Strapi Stackable',
  type: 'object',
  properties: {
    $schema: {
      type: 'string'
    },
    logger: utilsSchemaComponents.logger,
    server: utilsSchemaComponents.server,
    watch: basicSchemaComponents.watch,
    application: basicSchemaComponents.application,
    runtime: utilsSchemaComponents.wrappedRuntime,
    strapi
  },
  additionalProperties: false
}

/* c8 ignore next 3 */
if (process.argv[1] === import.meta.filename) {
  console.log(JSON.stringify(schema, null, 2))
}