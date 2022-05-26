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
   * A list of AEM paths to watch and replace ClientLib paths within.
   */
  contentPaths: string[]

  /**
   * The public path in AEM where your ClientLibs are stored.
   *
   * @example
   * /etc.clienlibs/<project>/clientlibs/<clientlib>
   */
  publicPath: string
}
