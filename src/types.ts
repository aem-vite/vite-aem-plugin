import type { bundlesImportRewriter } from '@aem-vite/import-rewriter'

interface AemServerOptions {
  /**
   * Server host or ip address.
   * E.g. `localhost` or `0.0.0.0`.
   */
  host: string

  /**
   * Server port number.
   */
  port: number
}

export interface PluginOptions {
  /**
   * AEM environment options.
   */
  aem?: AemServerOptions

  /**
   * Define a list of AEM paths that need to be proxied.
   */
  aemProxySegments?: string[]

  /**
   * The expression to use when matching ClientLibs on a page.
   * Can be a string for replacing all matches with vite scripts,
   * or an object mapping source paths to specific replacement values.
   *
   * @example
   * // String usage
   * "/etc.clientlibs/<project>/clientlibs/(<clientlib_one>|<clientlib_two>)"
   * // Object usage
   * {
   *   "src/index.ts": "/etc.clientlibs/<project>/clientlibs/<clientlib_one>"
   * }
   */
  clientlibsExpression?: string | Record<string, string>

  /**
   * A list of AEM paths to watch and replace ClientLib paths within.
   */
  contentPaths: string[]

  /**
   * A list of key format expressions to use when matching ClientLibs on a page.
   *
   * @example
   * ```js
   * {
   *   keyFormatExpressions: ['(\\w{32}(.min)?']
   * }
   * ```
   */
  keyFormatExpressions?: string[]

  /**
   * The public path in AEM where your ClientLibs are stored.
   *
   * @example
   * /etc.clienlibs/<project>/clientlibs/<clientlib>
   */
  publicPath: string

  /**
   * AEM Vite import rewriter options.
   */
  rewriterOptions?: Omit<Parameters<typeof bundlesImportRewriter>[0], 'publicPath'>
}
