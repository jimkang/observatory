var request = require('basic-browser-request');
var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var qs = require('qs');

const estimatedExpirationLengthInDays = 1;
const tokenExchangerBaseURL = 'http://162.243.21.88:5876';

var appName = 'observatory';

if (window.location.hostname === 'localhost') {
  appName = 'observatoryTest';
}

// queryString should be the query string from the URL.
// Find token will find the token from either queryString or store.
// It will pass to the callback: (error, tokenInfo, unpackedRoute)
// where unpackedRoute is an object extracted from the encoded routeDict originally
// passed in the GitHub redirect URL via the `state` param.
// tokenInfo is an object with the token and expirationDate.
function findToken({ queryString, currentDate }, done) {
  var queryStringParsed = qs.parse(queryString.slice(1));
  var unpackedRoute;
  if ('state' in queryStringParsed) {
    unpackedRoute = unpackRoute(queryStringParsed.state);
  }

  if ('code' in queryStringParsed) {
    // http://webcache.googleusercontent.com/search?q=cache:XLr30FwQuCsJ:blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html+&cd=1&hl=en&ct=clnk&gl=us
    var reqOpts = {
      method: 'GET',
      url:
        tokenExchangerBaseURL +
        '/exchange?code=' +
        queryStringParsed.code +
        '&app=' +
        appName
    };

    request(reqOpts, sb(extractToken, done));
  } else {
    callNextTick(done, new Error('No token or code found.'));
  }

  function extractToken(res, body) {
    var tokenInfo;

    if (res.statusCode === 200 && body) {
      // TODO: Get real expiration.
      tokenInfo = {
        token: body,
        expires:
          currentDate.getTime() +
          estimatedExpirationLengthInDays * 24 * 60 * 60 * 1000
      };
    }

    if (tokenInfo) {
      done(null, tokenInfo, unpackedRoute);
    } else {
      done(new Error('Could not get the token from token exchanger.'));
    }
  }
}

function unpackRoute(encodedStateFromRedirect) {
  return qs.parse(decodeURIComponent(encodedStateFromRedirect));
}

module.exports = findToken;
