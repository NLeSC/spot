var path = require('path');
const webpack = require('webpack'); //to access built-in plugins
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var dotenv = require('dotenv').config({path: __dirname + '/.env'});

const nodeExternals = require('webpack-node-externals');


module.exports = {
    // mode: 'development',
    mode: 'production',
    devtool: 'inline-source-map',
    // devtool: 'source-map',
    // entry: './src/app.js',
    entry: {
        spot: './src/app.js',
        templates: './src/templates.js',
        mainPage: './src/pages/main.js',
        datasetsPage: './src/pages/datasets.js',
        analyzePage: './src/pages/analyze.js',
        sharePage: './src/pages/share.js',
      },
    // target: 'node',
    // externals: [nodeExternals()],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath: '/',
        // chunkFilename: '[id].chunk.js'
        chunkFilename: '[name].bundle.js'
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
        ]
    },

    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        watchContentBase: true,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        historyApiFallback: true,
        inline: true,
        compress: true,
        bonjour: true,
        hot: true,
        host: '0.0.0.0',
        port: 9000,
        compress: true
    },

    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new webpack.DefinePlugin({
            // 'process.env': dotenv.parsed
        }),
        new CompressionPlugin({
            cache: true
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'enabled',
            generateStatsFile: false,
            statsOptions: { source: false }
        })
    ],

    resolve: {
        alias:{
            sigmajsLayoutForceAtlas2: 'sigma/build/plugins/sigma.layout.forceAtlas2.min.js',
            sigmajsRenderersParallelEdges: 'sigma/build/plugins/sigma.renderers.parallelEdges.min.js',
            mdl: 'material-design-lite/dist/material.min.js',
            gridster: 'gridster/dist/jquery.gridster.min.js',
            sigmajs: 'sigma/build/sigma.min.js'
        },
        extensions: ['.min.js', '.js'],
        modules: [
            'node_modules',
        ]
      },

      optimization: {
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
              compress: {},
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
        
        splitChunks: {
            // chunks: 'all'
        }
      }



}