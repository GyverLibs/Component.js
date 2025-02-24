var path = require('path');

module.exports = {
    entry: './Component.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'Component.js',
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production",
};