const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    entry: './src/Component.js',
    output: {
        path: __dirname,
        filename: 'Component.tiny.min.js',
        library: {
            type: 'module'
        }
    },
    plugins: [
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /^Component\.tiny\.min\.js$/,
            filename: '[path][base].gz',
            compressionOptions: { level: 9 },
            threshold: 0,
            minRatio: 0,
        }),
    ],
    experiments: {
        outputModule: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'ifdef-loader',
                options: {
                    TINY_COMPONENT: true,
                }
            }
        ]
    },
    mode: "production",
};