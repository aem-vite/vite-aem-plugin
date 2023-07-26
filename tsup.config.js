const { defineConfig } = require('tsup')

module.exports = defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'lib',
  sourcemap: true,
  splitting: false,
  target: ['node16'],
})
