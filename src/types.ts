interface ServerOptions {
  /**
   * ...
   */
  host: string
  /**
   * ...
   */
  port: number
}

interface ViteServerOptions extends ServerOptions {
  origin?: string
}

export interface ViteForAemOptions {
  aem?: ServerOptions
  vite: ViteServerOptions
}
