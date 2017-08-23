/* eslint-env node */
'use strict'

const webpack = require('webpack')
const path = require('path')
const nodeExternals = require('webpack-node-externals');
// HardSourceWebpackPlugin provides significantly enhanced performance via
// aggressive caching. The caching does not invalidate on changes to the build
// pipeline, so if webpack config changes are being made, temporarily disable
// the plugin by commenting it out. See:
// https://github.com/mzgoddard/hard-source-webpack-plugin
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

const year = new Date().getFullYear()

module.exports = {
  context: __dirname,
  entry: {
    main: './src/index.js',
  },
  target: 'node',
  node: {
    __dirname: true,
  },
  externals: [nodeExternals()],
  output: {
    // path: path.join(__dirname, 'dist', 'scripts'),
    path: path.join(__dirname, 'dist'),
    filename: '[name].min.js',
  },
  devtool: 'source-map',
  module: {
    // NOTE: If you are trying to make adjustments to the rules area, it will
    // not play nice with the caching provided by HardSourceWebpackPlugin.
    // Disable the HardSourceWebpackPlugin by commenting it out and re-enable it
    // when your testing is complete. See:
    // https://github.com/mzgoddard/hard-source-webpack-plugin
    rules: [
      { parser: { amd: false } },
      {
        test: /\.js$/,
        // Be sure to exclude any projects hooked up with `npm link`
        // Webpack sees this path as the real path as opposed to
        // symlinked path (which would be under node_modules normally).
        // see https://github.com/webpack/webpack/issues/3292
        exclude: /node_modules/,
        include: [/\//],
        use: [
          {
            loader: 'babel-loader',
            options: {
              sourceMaps: true,
              cacheDirectory: true,
              presets: [
                'es2015',
              ],
            },
          },
          {
            loader: 'eslint-loader',
            options: {
              fix: false, // never again true
              quiet: true,
              failOnError: true,
              emitError: true,
            },
          },
        ],
      },
    ],
  },
  // NOTE: If you are trying to make adjustments to the plugins area, it will
  // not play nice with the caching provided by HardSourceWebpackPlugin. Disable
  // the HardSourceWebpackPlugin by commenting it out and re-enable it when your
  // testing is complete. See:
  // https://github.com/mzgoddard/hard-source-webpack-plugin
  plugins: [
    new HardSourceWebpackPlugin(),
    new webpack.BannerPlugin({
      banner:
      `
/**
*******************************************************************************
* Operation Breakdown
* Copyright Fusorsoft, LLC ${year} All Rights Reserved
*******************************************************************************
*/
//# sourceMappingURL=./main.min.js.map
`,
      raw: true,
      test: /\.js|css/,
    }),
  ],
  resolve: {
    modules: [
      path.join('./'),
      // This significantly speeds up build times.
      path.join('./node_modules'),
    ],
  },
  // Webpack hosts the files here. Also serves as a reverse proxy to
  // localProxy/proxy.js.
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    port: 9000,
    contentBase: path.join(__dirname, 'dist'),
    publicPath: '/',
    proxy: [],
  },
}
