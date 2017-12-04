'use strict';

var fs = require('fs');
var path = require('path');
var Mock = require('mockjs');
var validUrl = require('valid-url');

var store = require('./store');
var mockActions = require('./mockActions');

module.exports = function(req, res, next) {
    var rules = store.get('rules');
    var mockResult;

    var dispatchMockAction = function(rule, req, res, matches) {
        req.mock = true;

        var resStr = '';
        var resConditions;
        var respondwith = rule.respondwith;
        var jsonp = rule.jsonp || 'callback';

        var contentType = null;
        var defulatContentType = 'application/json';

        // 替换路径中的正则分组
        respondwith = respondwith.replace ? respondwith.replace(/\$(\d+)/g, function(m, matchIndex) {
            return matches[matchIndex];
        }) : respondwith;

        try {
            resConditions = [
                {
                    condition: typeof respondwith === 'object',
                    handler: function() {
                        return mockActions.handlePlainObject(respondwith);
                    }
                },
                {
                    condition: typeof respondwith === 'string' && validUrl.isUri(respondwith),
                    handler: function() {
                        return mockActions.handleRemote(respondwith, req, res);
                    }
                },
                {
                    condition: typeof respondwith === 'string' && !validUrl.isUri(respondwith),
                    handler: function() {
                        var result = mockActions.handleLocalFile(respondwith, req, res);

                        if(result.contentType) {
                            contentType = result.contentType;
                        }

                        return result.resStr;
                    }
                },
                {
                    condition: typeof respondwith === 'function',
                    handler: function() {
                        res.__handled = true;
                        return mockActions.handleFunc(respondwith, req, res);
                    }
                }
            ]
        } catch(e) {
            console.log('mock action fail: ');
            console.log(e);
        }

        for(var i = 0; i < resConditions.length; i += 1) {
            if(resConditions[i].condition) {
                resStr = resConditions[i].handler();
            }
        }

        if(req.query[jsonp]) {
            var jsonpCallback = req.query[jsonp];
            resStr = jsonpCallback + '(' + resStr + ')';
        }

        // 避免重复返回
        if(!res.__handled) {
            res.writeHead(200, {'Content-Type': contentType || defulatContentType});
            res.end(resStr);
        }

        return true;
    };

    rules.map((rule) => {
        var isReg = Object.prototype.toString.call(rule.pattern).indexOf('RegExp') > -1;
        var isMatched = isReg ? req.url.match(rule.pattern) : req.url.indexOf(rule.pattern) === 0;

        if (isMatched) {
            mockResult = dispatchMockAction(rule, req, res, req.url.match(rule.pattern));
        }
    });

    if(!mockResult) {
        return next();
    }
}
