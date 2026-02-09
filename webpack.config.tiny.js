module.exports = {
    entry: './src/Component.js',
    output: {
        path: __dirname,
        filename: 'Component.tiny.min.js',
        library: {
            type: 'module'
        }
    },
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