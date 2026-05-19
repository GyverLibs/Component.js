const makeConfig = (filename, flags) => ({
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
    makeConfig('Component.min.js', {
        NO_LIFE: false,
        NO_STATE: false,
        NO_TEMPLATE: false,
        NO_SHADOW: false,
        NO_STYLE: false,
        NO_SVG: false,
    }),
    makeConfig('Component.tiny.min.js', {
        NO_LIFE: true,
        NO_STATE: true,
        NO_TEMPLATE: true,
        NO_SHADOW: true,
        NO_STYLE: false,
        NO_SVG: false,
    }),
    makeConfig('Component.pico.min.js', {
        NO_LIFE: true,
        NO_STATE: true,
        NO_TEMPLATE: true,
        NO_SHADOW: true,
        NO_STYLE: true,
        NO_SVG: true,
    }),
];