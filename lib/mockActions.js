var fs = require('fs');
var path = require('path');
var url = require('url');
var Mock = require('mockjs');

var store = require('./store');
var fileExists = require('./util/fs').fileExists;
var requireUncached = require('./util/fs').requireUncached;
var logMockError = require('./util/log').logMockError;
var request = require('request');
var extend = require('extend');

module.exports = {
    handlePlainObject: function(respondwith) {
        return JSON.stringify(Mock.mock(respondwith));
    },
    handleRemote: function(respondwith, req, res) {
        res.__handled = true;

        var options = {
            url: respondwith,
            headers: extend({}, req.headers, {host: url.parse(respondwith).hostname})
        }

        logMock(req.url + ' -> ' + respondwith)

        request[req.method.toLocaleLowerCase()](options, function (err, response, body) {
            if(err) {
                res.end(JSON.stringify(err));
            } else if(response.statusCode !== 200) {
                logMockError('The request to "' + respondwith + '" got error message:');
                console.log(body);
                res.writeHead(response.statusCode);
                res.end();
            } else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(body);
            }
        });
    },
    handleLocalFile: function(respondwith, req, res) {
        var resStr = '';
        var confFileDir = store.get('confFileDir');
        var resFilePath = path.join(confFileDir, respondwith);

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
                    res.__handled = true;
                    resStr = JSON.stringify(Mock.mock(respond(req, res)));
                } else if(typeof respond === 'string') {
                    resStr = respond;
                } else {
                    logMockError('Not supported respond in ' + resFilePath.bold);
                }
            } else if(path.extname(respondwith) === '.html' || path.extname(respondwith) === '.string') {
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
        }

        return resStr;
    },
    handleFunc: function(respondwith, req, res) {
        JSON.stringify(Mock.mock(respondwith(req, res)));
    }
}
