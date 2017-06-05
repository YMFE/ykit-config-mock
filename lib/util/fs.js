'use strict';

var fs = require('fs');

module.exports = {
    fileExists: function(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        } catch (err) {
            return false;
        }
    },
    requireUncached: function(module) {
        delete require.cache[require.resolve(module)];
        return require(module);
    }
}
