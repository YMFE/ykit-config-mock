'use strict';

var fs = require('fs');
var path = require('path');
var Mock = require('mockjs');

var USER_HOME = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
var isConfFileHandled = false;
var rules = [];
var confFileDir = null;

module.exports = {
    config: function (options, cwd) {
        return {
            modifyWebpackConfig: function(config) {
                var psCwd = process.cwd();

                if(!isConfFileHandled) {
                    isConfFileHandled = true;
                    try {
                        var confFile = getConfFile.bind(this)(options.confPath);

                        confFileDir = path.dirname(confFile);
                        rules = getMockRules.bind(this)(confFile);
                    } catch(e) {
                        console.log(e);
                    }
                }
                // 在 ykit 本地服务中添加一个 middleware，优先处理请求
                this.middlewares.push(mockMiddleware.bind(this));

                return config;
            }
        }
    }
}

function mockMiddleware(req, res, next) {
    var mockResult;
    var mockAction = function (rule, req, res) {
        req.mock = true;

        var respondwith = rule.respondwith;
        var resStr = '';

        // TODO handle respondwith object

        // handle respondwith file
        var resFilePath = path.join(confFileDir, respondwith);
        if(fileExists(resFilePath)) {
            var shouldRespond = true;
            if(path.extname(respondwith) === '.js' || path.extname(respondwith) === '.json') {
                var respond = require(resFilePath);

                if(typeof respond === 'object') {
                    resStr = JSON.stringify(Mock.mock(respond));
                } else if(typeof respond === 'function') {
                    shouldRespond = false;
                    resStr = JSON.stringify(Mock.mock(respond(req, res)));
                } else if(typeof respond === 'string') {
                    resStr = respond;
                } else {
                    logMockError('Not supported respond in ' + resFilePath.bold);
                }
            } else if(path.extname(respondwith)) {
                // other file type handled as plain json
                try {
                    resStr = JSON.stringify(Mock.mock(JSON.parse(fs.readFileSync(resFilePath, 'utf-8'))));
                } catch(e) {
                    logMockError('Parse error in ${resFilePath.bold}\n' + e);
                }
            }

            if(shouldRespond) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(resStr);
            }

            return true;
        } else {
            logMockError('Not found ' + resFilePath.bold);
            return false;
        }
    };

    rules.map((rule) => {
        var isReg = Object.prototype.toString.call(rule.pattern).indexOf('RegExp') > -1;
        var isMatched = isReg ? req.url.match(rule.pattern) : req.url.indexOf(rule.pattern) === 0;

        if (isMatched) {
            mockResult = mockAction(rule, req, res);
        }
    });

    if(!mockResult) {
        return next();
    }
}

function logMockError(msg) {
    logMock('ERROR: '.red + msg)
}

function getMockRules(confFile) {
    if(!confFile) {
        return;
    }

    var formattedRules,
        ext = path.extname(confFile);
    if(ext === '.js') {
        var rawRules = require(confFile);
        formattedRules = [];
        if(typeof rawRules === 'object') {
            logMock('Start using ' + confFile);
            Object.keys(rawRules).map((itemKey) => {
                // 需要处理 key 为 rules 的情况 http://ued.qunar.com/fekit/usage.html
                if(itemKey === 'rules') {
                    formattedRules = formattedRules.concat(rawRules[itemKey]);
                } else {
                    formattedRules.push({
                        pattern: itemKey,
                        respondwith: rawRules[itemKey]
                    });
                }
            });
        } else {
            logMockError('Invalid mock rules, please check your mock config.');
        }
    } else if(ext === '.json') {
        // TODO
    } else {
        // TODO
    }

    return formattedRules;
}

function getConfFile(confPath) {
    var appCwd = this.cwd;

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

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
};
