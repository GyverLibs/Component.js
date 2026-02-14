const makeConfig = (flags, filename) => ({
    entry: './src/Component.js',
    output: {
        path: __dirname,
        filename,
        library: { type: 'module' }
    },
    experiments: { outputModule: true },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'ifdef-loader',
                options: flags
            }
        ]
    },
    mode: 'production'
});

module.exports = [
    makeConfig({ TINY_COMPONENT: false, PICO_COMPONENT: false }, 'Component.min.js'),
    makeConfig({ TINY_COMPONENT: true, PICO_COMPONENT: false }, 'Component.tiny.min.js'),
    makeConfig({ TINY_COMPONENT: true, PICO_COMPONENT: true }, 'Component.pico.min.js'),
];