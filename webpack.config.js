var path = require('path');
const webpack = require('webpack'); //to access built-in plugins

module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'spot.js',
        publicPath: '/',
        chunkFilename: '[id].chunk.js'
    },

    node: {
        fs: 'empty'
    },

    module: {
        rules: [
            {
                test: /sigma.*/,
                use: 'imports-loader?this=>window',
            }
        ]
    },

    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        watchContentBase: true,
        historyApiFallback: true,
        compress: true,
        bonjour: true,
        hot: true,
        host: '0.0.0.0',
        port: 9000
    },

    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
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
      }

}