'use strict';

var url = require('url');
var fs = require('fs')
var logger = function () {
};
var rewriteTarget = '/index.html';

function acceptsHtml(header) {
  return header.indexOf('text/html') !== -1 || header.indexOf('*/*') !== -1;
}

exports = module.exports = function historyApiFallback(options) {
  return function redirect(req, res, next) {
    var headers = req.headers;
    if (req.method !== 'GET') {
      logger('Not rewriting %s %s because the method is not GET.',
        req.method, req.url);
      return next();
    } else if (!headers || typeof headers.accept !== 'string') {
      logger('Not rewriting %s %s because the client did not send an HTTP ' +
        'accept header.', req.method, req.url);
      return next();
    } else if (headers.accept.indexOf('application/json') === 0) {
      logger('Not rewriting %s %s because the client prefers JSON.',
        req.method, req.url);
      return next();
    } else if (!acceptsHtml(headers.accept)) {
      logger('Not rewriting %s %s because the client does not accept HTML.',
        req.method, req.url);
      return next();
    }


    var parsedUrl = url.parse(req.url);

    if (parsedUrl.pathname.indexOf('.') !== -1) {
      logger('Not rewriting %s %s because the path includes a dot (.) character.',
        req.method, req.url);
      return next();
    }

    var filename = './app' + parsedUrl.pathname + '/index.html';
    if (fs.existsSync(filename)) {
      logger('Not rewriting %s %s because the path is a real index.html file on disk belongs to another app or static html',
        req.method, req.url);
      return next();
    }

    var secondFolderMatch = parsedUrl.pathname.match(/^(\/.*?\/.*?)\//)

    if (secondFolderMatch && fs.existsSync('./app' + secondFolderMatch[1])) {
      logger('Rewriting %s %s to %s because there is an index.html belonging to another app in the path', req.method, req.url, rewriteTarget);
      req.url = secondFolderMatch[1] + '/index.html'
      return next();
    }

    var firstFolderMatch = parsedUrl.pathname.match(/^(\/.*?)\//)

    if (firstFolderMatch && fs.existsSync('./app' + firstFolderMatch[1])) {
      logger('Rewriting %s %s to %s because there is an index.html belonging to another app in the path', req.method, req.url, rewriteTarget);
      req.url = firstFolderMatch[1] + '/index.html'
      return next();
    }

    logger('Rewriting %s %s to %s', req.method, req.url, rewriteTarget);
    req.url = rewriteTarget;
    next();
  }
    ;
}

module.exports.setLogger = function (newLogger) {
  logger = newLogger || function () {
    };
};
