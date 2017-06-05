'use strict';

var path = require('path');
var fileExists = require('./util/fs').fileExists;

module.exports = function(confPath) {
    var appCwd = this.cwd;
    var USER_HOME = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

    if(confPath) {
        var isRelativePath = confPath.indexOf(USER_HOME) === -1;

        confPath = isRelativePath ? path.join(appCwd, confPath) : confPath;
        if(fileExists(confPath)) {
            return confPath;
        } else {
            return logMockError('Mock config file ' + confPath + ' not found');
        }
    } else {
        var localConfigFiles = searchConfFile(['mock.js', 'mock.json']);
        if(localConfigFiles.length > 0) {
            return path.join(appCwd, localConfigFiles[0]);
        } else {
            return logMockError('Mock config file not found in ' + appCwd);
        }
    }

    function searchConfFile(names) {
        return globby.sync(['mock.js', 'mock.json'], { cwd: path.join(appCwd) });
    }
}
