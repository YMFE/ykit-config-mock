'use strict';

var path = require('path');
var cmp = require('semver-compare');
var watchr = require('watchr');

var mockMiddleware = require('./lib/mockMiddleware');
var fetchConfFile = require('./lib/fetchConfFile');
var fetchRules = require('./lib/fetchRules');
var requireUncached = require('./lib/util/fs').requireUncached;
var logMockError = require('./lib/util/log').logMockError;
var store = require('./lib/store');

var isConfFileHandled = false;

module.exports = {
    config: function (options, cwd) {
        return {
            modifyWebpackConfig: function(config) {
                var self = this;

                var isStartingServer = process.argv[2] === 's' || process.argv[2] === 'server';
                var mockingDisabled = process.argv.some(function(param) {
                    return param.split('=').length > 1
                            && param.split('=')[0] === 'mock'
                            && param.split('=')[1] === 'false'
                })
                if(self.env !== 'local' || !isStartingServer || mockingDisabled) {
                    return config;
                }

                if(!isConfFileHandled) {
                    isConfFileHandled = true;

                    if(!global.ykitVer || !cmp(global.ykitVer, '0.4.1')) {
                        return logWarn('ykit-config-mock only supports ykit version >= 0.5.0');
                    }

                    try {
                        var confFile = fetchConfFile.bind(self)(options.confPath);
                        store.set('rules', fetchRules.bind(self)(confFile));
                        store.set('confFileDir', path.dirname(confFile));

                        // Watch the confFile with the change listener and completion callback
                        var stalker = watchr.open(confFile, function (changeType) {
                            if(changeType === 'update') {
                                store.set('rules', fetchRules.bind(self)(confFile, true));
                            }
                        }, function() {})
                    } catch(e) {
                        logError(e);
                    }
                }

                // 在 ykit 本地服务中添加一个 middleware，优先处理请求
                self.applyMiddleware(mockMiddleware.bind(self), {
                    global: true
                });

                return config;
            }
        }
    }
}
