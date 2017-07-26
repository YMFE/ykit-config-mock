'use strict';

var fs = require('fs');
var path = require('path');
var Mock = require('mockjs');

var fileExists = require('./util/fs').fileExists;
var requireUncached = require('./util/fs').requireUncached;
var logMockError = require('./util/log').logMockError;
var store = require('./store');

module.exports = function(req, res, next) {
    var rules = store.get('rules');
    var confFileDir = store.get('confFileDir');
    var mockResult;

    var mockAction = function(rule, req, res, matches) {
        req.mock = true;

        var respondwith = rule.respondwith;
        var resStr = '';
        var shouldRespond = true; // 有些 mock 文件自己处理了 res 的返回（如 fekit）

        var contentType = null;
        var defulatContentType = 'application/json';

        if(typeof respondwith === 'object') {
            // handle respondwith object
            resStr = JSON.stringify(respondwith);
        } else if (typeof respondwith === 'string') {
            // handle respondwith file
            var resFilePath = path.join(confFileDir, respondwith);

            // 替换路径中的正则分组
            resFilePath = resFilePath.replace(/\$(\d+)/g, function(m, matchIndex) {
                return matches[matchIndex];
            });

            if(!path.extname(respondwith)) {
                const tryExtNames = ['.js', '.json', '.string'];
                tryExtNames.map((extName) => {
                    if(fileExists(resFilePath + extName)) {
                        resFilePath += extName;
                    }
                })
            }

            if(fileExists(resFilePath)) {

                if(path.extname(respondwith) === '.js' || path.extname(respondwith) === '.json') {
                    var respond = requireUncached(resFilePath);

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
                } else if(path.extname(respondwith) === '.html') {
                    contentType = 'text/html;charset=utf-8';
                    resStr = fs.readFileSync(resFilePath, 'utf-8');
                } else if(path.extname(respondwith)) {
                    // other file type handled as plain json
                    try {
                        resStr = JSON.stringify(Mock.mock(JSON.parse(fs.readFileSync(resFilePath, 'utf-8'))));
                    } catch(e) {
                        logMockError(`Parse error in ${resFilePath.bold}\n` + e);
                    }
                }
            } else {
                logMockError('Not found ' + resFilePath.bold);
                return false;
            }
        } else if (typeof respondwith === 'function') {
            shouldRespond = false;
            resStr = JSON.stringify(Mock.mock(respondwith(req, res)));
        }

        if(shouldRespond) {
            res.writeHead(200, {'Content-Type': contentType || defulatContentType});
            res.end(resStr);
        }

        return true;
    };

    rules.map((rule) => {
        var isReg = Object.prototype.toString.call(rule.pattern).indexOf('RegExp') > -1;
        var isMatched = isReg ? req.url.match(rule.pattern) : req.url.indexOf(rule.pattern) === 0;

        if (isMatched) {
            mockResult = mockAction(rule, req, res, req.url.match(rule.pattern));
        }
    });

    if(!mockResult) {
        return next();
    }
}
