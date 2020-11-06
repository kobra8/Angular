
const angularConfig = require('./angular.json');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

function modify(buffer) {

    // copy-webpack-plugin passes a buffer
    var file = JSON.parse(buffer.toString());

    // make any modifications you like, such as
    file.configVersion = angularConfig.version;

    // pretty print to JSON with two spaces
    file_JSON = JSON.stringify(file, null, 4);
    return file_JSON;
}

module.exports = {
    plugins: [
        new CopyPlugin([
            {
                from: path.resolve(__dirname, 'ngsw.json'),
                to: path.resolve(__dirname, '../ngsw.json'),
                transform(content, path) {
                    return modify(content);
                }
            }
        ])
    ]
};
