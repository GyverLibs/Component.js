const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    entry: './src/Component.js',
    output: {
        path: __dirname,
        filename: 'Component.min.js',
        library: {
            type: 'module'
        }
    },
    plugins: [
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /^Component\.min\.js$/,
            filename: '[path][base].gz',
            compressionOptions: { level: 9 },
            threshold: 0,
            minRatio: 0,
        }),
    ],
    experiments: {
        outputModule: true
    },
    mode: "production",
};