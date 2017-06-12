'use strict';

var path = require('path');
var cmp = require('semver-compare');

var mockMiddleware = require('./lib/mockMiddleware');
var fetchConfFile = require('./lib/fetchConfFile');
var fetchRules = require('./lib/fetchRules');
var requireUncached = require('./lib/util/fs').requireUncached;
var logMockError = require('./lib/util/log').logMockError;

var isConfFileHandled = false;

module.exports = {
    config: function (options, cwd) {
        return {
            modifyWebpackConfig: function(config) {
                if(this.env !== 'local') {
                    return config;
                }

                if(!isConfFileHandled) {
                    isConfFileHandled = true;

                    if(!global.ykitVer || !cmp(global.ykitVer, '0.4.1')) {
                        return logWarn('ykit-config-mock only supports ykit version >= 0.5.0');
                    }

                    try {
                        var confFile = fetchConfFile.bind(this)(options.confPath);
                        this.rules = fetchRules.bind(this)(confFile);
                        this.confFileDir = path.dirname(confFile);
                    } catch(e) {
                        logError(e);
                    }
                }

                // 在 ykit 本地服务中添加一个 middleware，优先处理请求
                this.applyMiddleware(mockMiddleware.bind(this));

                return config;
            }
        }
    }
}
