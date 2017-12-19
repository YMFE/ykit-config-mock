'use strict';

var path = require('path');
var requireUncached = require('./util/fs').requireUncached;

module.exports = function(confFile, isUpadted) {
    if(!confFile) {
        return;
    }

    var formattedRules,
        rules = [],
        ext = path.extname(confFile);

    if(ext === '.js') {
        var rawRules = requireUncached(confFile);
        formattedRules = [];

        if(isUpadted) {
            logMock('Update ' + confFile);
        } else {
            logMock('Start using ' + confFile);
        }

        if(Array.isArray(rawRules)) {
            formattedRules = rawRules.map(function(rule) {
                return {
                    pattern: rule.pattern,
                    respondwith: rule.respondwith || rule.responder,
                    jsonp: rule.jsonp
                }
            });
        } else if(typeof rawRules === 'object') {
            Object.keys(rawRules).map((itemKey) => {
                // 需要处理 key 为 rules 的情况 http://ued.qunar.com/fekit/usage.html
                if(itemKey === 'rules') {
                    formattedRules = formattedRules.concat(rawRules[itemKey]);
                } else {
                    formattedRules.push({
                        pattern: itemKey,
                        respondwith: rawRules[itemKey],
                        jsonp: rawRules[itemKey].jsonp
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
