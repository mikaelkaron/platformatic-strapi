import {
  BaseStackable,
  transformConfig as basicTransformConfig,
  cleanBasePath,
  ensureTrailingSlash,
  errors,
  resolvePackage,
  schemaOptions
} from '@platformatic/basic'
import { ConfigManager } from '@platformatic/config'
import { readFile } from 'node:fs/promises'
import { dirname, resolve as pathResolve } from 'node:path'
import { satisfies } from 'semver'
import { packageJson, schema } from './lib/schema.js'

const supportedVersions = "^5.0.0"

export class StrapiStackable extends BaseStackable {
  #strapi
  #app
  #server
  #basePath

  constructor (options, root, configManager) {
    super('strapi', packageJson.version, options, root, configManager)
  }

  async init () {
    this.#strapi = pathResolve(dirname(resolvePackage(this.root, '@strapi/strapi')), '../..')
    const strapiPackage = JSON.parse(await readFile(pathResolve(this.#strapi, 'package.json'), 'utf-8'))

    if (!satisfies(strapiPackage.version, supportedVersions)) {
      throw new errors.UnsupportedVersion('strapi', strapiPackage.version, supportedVersions)
    }
  }

  async start ({ listen }) {
    // Make this idempotent
    if (this.url) {
      return this.url
    }

    if (this.isProduction) {
//      await this.#startProduction(listen)
    } else {
//      await this.#startDevelopment(listen)
    }

    await this._collectMetrics()
  }

  async stop () {
    if (this.childManager) {
      return this.stopCommand()
    }

    return this.isProduction ? this.#app.close() : this.#app.stop()
  }

  async build () {
    const config = this.configManager.current
    const command = config.application.commands.build
    let basePath = config.application?.basePath
      ? ensureTrailingSlash(cleanBasePath(config.application?.basePath))
      : undefined

    if (command) {
      return this.buildWithCommand(command, basePath)
    }

    await this.init()

    try {
      globalThis.platformatic.isBuilding = true
      await this.#strapi.compile()
    } finally {
      globalThis.platformatic.isBuilding = false
    }

    await writeFile(
      resolve(this.root, config.application.outputDirectory, '.platformatic-build.json'),
      JSON.stringify({ basePath }),
      'utf-8'
    )
  }

  
  /* c8 ignore next 5 */
  async getWatchConfig () {
    return {
      enabled: false
    }
  }
}

/* c8 ignore next 9 */
function transformConfig () {
  if (this.current.watch === undefined) {
    this.current.watch = { enabled: false }
  }

  if (typeof this.current.watch !== 'object') {
    this.current.watch = { enabled: this.current.watch || false }
  }

  return basicTransformConfig.call(this)
}

export async function buildStackable (opts) {
  const root = opts.context.directory

  const configManager = new ConfigManager({
    schema,
    source: opts.config ?? {},
    schemaOptions,
    transformConfig,
    dirname: root,
    context: opts.context
  })
  await configManager.parseAndValidate()

  return new StrapiStackable(opts, root, configManager)
}

export default {
  configType: 'strapi',
  configManagerConfig: {
    schemaOptions,
    transformConfig
  },
  buildStackable,
  schema,
  version: packageJson.version
}