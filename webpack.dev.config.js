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
            // {
            //     test: /\.js$/,
            //     loader: 'ifdef-loader',
            //     options: {
            //         NO_LIFE: true,
            //         NO_STATE: true,
            //         NO_TEMPLATE: true,
            //         NO_SHADOW: true,
            //         NO_STYLE: true,
            //         NO_SVG: true,
            //     }
            // }
        ]
    },
    devServer: {
        static: path.resolve(__dirname, 'test'),
        hot: true,
        open: true,
    },
    mode: 'development',
};