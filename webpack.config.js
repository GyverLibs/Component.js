module.exports = {
    entry: './Component.js',
    output: {
        path: __dirname,
        filename: 'Component.min.js',
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production",
};