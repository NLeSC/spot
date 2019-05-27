var path = require('path');
const webpack = require('webpack'); //to access built-in plugins
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin')
const zopfli = require('@gfx/zopfli');
const Dotenv = require('dotenv-webpack'); // to use env varibales in the app
var dotenv = require('dotenv').config({path: __dirname + '/.env'}); // parse .env file directly to be able to use in webpack config

const nodeExternals = require('webpack-node-externals');

const devURL = dotenv.parsed.BASE_URL;
const devPORT = dotenv.parsed.PORT;

module.exports = {
    // mode: 'development',
    mode: 'production',
    // devtool: 'inline-source-map',
    devtool: 'cheap-module-source-map',
    // devtool: 'source-map',

    // // entry: './src/app.js',
    // entry: {
    //     spot: './src/app.js',
    //     templates: './src/templates.js',
    //     mainPage: './src/pages/main.js',
    //     datasetsPage: './src/pages/datasets.js',
    //     analyzePage: './src/pages/analyze.js',
    //     sharePage: './src/pages/share.js'
    //   },
    // // target: 'node',
    // // externals: [nodeExternals()],
    // output: {
    //     path: path.join(__dirname, 'dist/js'),
    //     filename: '[name].bundle.js',
    //     // filename: '[name].[contenthash:8].js',
    //     // filename: '[name].[hash].js',
    //     publicPath: '/',
    //     // chunkFilename: '[id].chunk.js'
    //     chunkFilename: '[name].bundle.js'
    //     // chunkFilename: '[name]-[contenthash].js'
    // },


    // entry: './src/app.js',
    entry: {
      index: ['babel-polyfill', './src/app.js']
    },
    output: {
      path: __dirname + '/dist/js',
      filename: 'bundle.js',
      // publicPath: '/js/'
    },

    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      watchContentBase: true,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      historyApiFallback: true,
      inline: true,
      // compress: true,
      bonjour: true,
      hot: true,
      // host: '0.0.0.0',
      host: devURL || '0.0.0.0',
      port: devPORT || 9000,
      https: false
  },

    node: {
        fs: 'empty'
    },

    module: {
        rules: [
            {
                test: /sigma.*/,
                use: 'imports-loader?this=>window',
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env']
                  }
                }
            },


            {
                test: /node_modules[\\\/]vis-graph3d[\\\/].*\.js$/, // vis.js files
                loader: 'babel-loader',
                query: {
                  cacheDirectory: true,
                //   presets: [ "babel-preset-es2015" ].map(require.resolve),
                  presets: ['@babel/preset-env'].map(require.resolve),
                  plugins: [
                    "transform-es3-property-literals", // see https://github.com/almende/vis/pull/2452
                    "transform-es3-member-expression-literals", // see https://github.com/almende/vis/pull/2566
                    // "transform-runtime" // see https://github.com/almende/vis/pull/2566
                  ]
                }
              },

            //   {
            //     test: /\.js$/, //Check for all js files
            //     loader: 'babel-loader',
            //     query: {
            //       presets: [ "babel-preset-es2015" ].map(require.resolve)
            //     }
            //   },

              {
                test: /\.css$/,
                use: [
                  'style-loader',
                  'css-loader'
                ]
              },
              {
                test: /.*\.(png|jpg|jpeg)$/i,
                loaders: [ 'file-loader', {
                  loader: 'image-webpack-loader',
                  query: {
                    progressive: true,
                    pngquant: {
                      quality: '55-60',
                      speed: 4
                    }
                  }
                }
              ]
              },
            //   {
            //     test: /\.json$/,
            //     loader: 'file-loader'
            //   }

            // {
            //     type: 'javascript/auto',
            //     test: /\.json$/,
            //     use: [
            //         {
            //           loader: 'file-loader',
            //           options: {
            //               name: "./js-data/[name].[ext]"
            //           }
            //         }
            //     ]
            // },

            {
              test: /\.json$/,
              use: { loader : 'json-loader' } ,
              type: "javascript/auto"
            }

        ],

    },

    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        // new webpack.DefinePlugin({
        //     'process.env': dotenv.parsed
        // }),
        new Dotenv({
          // path: './.env', // load this now instead of the ones in '.env'
          // safe: true, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
          // systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
          // silent: true, // hide any errors
          // defaults: false // load '.env.defaults' as the default values if empty.
        }),
        // new CompressionPlugin({
        //   test: /\.js(\?.*)?$/i,
        //   cache: true,
        //   compressionOptions: {
        //      numiterations: 15
        //   },
        //   algorithm(input, compressionOptions, callback) {
        //     return zopfli.gzip(input, compressionOptions, callback);
        //   }
        // }),
        new BundleAnalyzerPlugin({
            // analyzerMode: 'server',
            analyzerMode: 'enabled',
            generateStatsFile: false,
            statsOptions: { source: true },
            openAnalyzer: true,
            logLevel: 'info'
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.HashedModuleIdsPlugin({
          hashFunction: 'sha256',
          hashDigest: 'hex',
          hashDigestLength: 4
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/en$/),
        new webpack.HashedModuleIdsPlugin(), // so that file hashes don't change unexpectedly
        // new webpack.NormalModuleReplacementPlugin(
        //     /moment-timezone\/data\/packed\/latest\.json/,
        //     require.resolve('./misc/timezone-definitions')
        // )
        new HtmlWebpackPlugin({
          filename: '../index.html',
          // filename: 'index.[contenthash].html',
          title: 'SPOT',
          template: 'dist/index.html.template',
          // chunks: ['app'],
          // excludeChunks: [ 'dev-helper' ],
          // 'meta': {
          //   'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
          //   // Will generate: <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          //   'theme-color': '#4285f4',
          //   // Will generate: <meta name="theme-color" content="#4285f4">
          //   'Content-Security-Policy': { 'http-equiv': 'Content-Security-Policy', 'content': 'default-src https:' },
          //   // Will generate: <meta http-equiv="Content-Security-Policy" content="default-src https:">
          //   // Which equals to the following http header: `Content-Security-Policy: default-src https:`
          //   'set-cookie': { 'http-equiv': 'set-cookie', content: 'name=value; expires=date; path=url' },
          //   // Will generate: <meta http-equiv="set-cookie" content="value; expires=date; path=url">
          //   // Which equals to the following http header: `set-cookie: value; expires=date; path=url`
          // }
        })
    ],

    resolve: {
        alias:{
            sigmajsLayoutForceAtlas2: 'sigma/build/plugins/sigma.layout.forceAtlas2.min.js',
            sigmajsRenderersParallelEdges: 'sigma/build/plugins/sigma.renderers.parallelEdges.min.js',
            mdl: 'material-design-lite/dist/material.min.js',
            gridster: 'gridster/dist/jquery.gridster.min.js',
            sigmajs: 'sigma/build/sigma.min.js',
            visGraph3d: 'vis/dist/vis-graph3d.min.js'
        },
        extensions: ['.min.js', '.js'],
        modules: [
            'node_modules',
        ]
      },



      optimization: {
        nodeEnv: 'production',
        runtimeChunk: 'single',
        // namedModules: false,
        // namedChunks: false,
        flagIncludedChunks: true,
        occurrenceOrder: true,
        sideEffects: true,
        usedExports: true,
        concatenateModules: true,

        // splitChunks: {
        //   cacheGroups: {
        //     commons: {
        //         test: /[\\/]node_modules[\\/]/,
        //         name: 'vendor',
        //         chunks: 'all'
        //     }
        //   },
        //   minSize: 30000,
        //   maxAsyncRequests: 5,
        //   maxAsyncRequests: 3,      
        // },

        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name(module) {
                  // get the name. E.g. node_modules/packageName/not/this/part.js
                  // or node_modules/packageName
                  const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
      
                  // npm package names are URL-safe, but some servers don't like @ symbols
                  return `npm.${packageName.replace('@', '')}`;
                },
              },
            },
          },

        noEmitOnErrors: true,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            cache: true,
            parallel: true,
            sourceMap: true, // Must be set to true if using source-maps in production
            terserOptions: {
              // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
              ecma: undefined,
              warnings: false,
              parse: {},
              compress: true,
              mangle: true, // Note `mangle.properties` is `false` by default.
              module: false,
              output: null,
              toplevel: false,
              nameCache: null,
              ie8: false,
              keep_classnames: undefined,
              keep_fnames: false,
              safari10: false,
            }
          }),
        ],
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,   
      }


}