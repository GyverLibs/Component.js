const path = require('path');

module.exports = {
    entry: './test/script.js',
    output: {
        filename: 'script.js',
        path: path.resolve(__dirname, 'test'),
        clean: false,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                // test: /\.js$/,
                // loader: 'ifdef-loader',
                // options: {
                //     TINY_COMPONENT: true,
                //     PICO_COMPONENT: true,
                // }
            }
        ]
    },
    devServer: {
        static: path.resolve(__dirname, 'test'),
        hot: true,
        open: true,
    },
    mode: 'development',
};