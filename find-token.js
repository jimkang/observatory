var request = require('basic-browser-request');
var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var config = require('./config');
var qs = require('qs');

const estimatedExpirationLengthInDays = 1;
const tokenExchangerBaseURL = 'http://162.243.21.88:5876';

// routeDict should be a dictionary derived from the URL route. It can be empty, but not undefined.
// store should be an object that behaves like localStorage. It can be empty, but not undefined.
function findToken({routeDict, store, currentDate}, done) {  
  if ('code' in routeDict) {
    // http://webcache.googleusercontent.com/search?q=cache:XLr30FwQuCsJ:blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html+&cd=1&hl=en&ct=clnk&gl=us
    var reqOpts = {
      method: 'GET',
      // 
      url: tokenExchangerBaseURL + '/exchange?code=' + routeDict.code +
        '&app=observatoryTest'
    };

    request(reqOpts, sb(extractToken, done));
  }  
  else if (store.tokenInfo) {
    var tokenInfo = JSON.parse(store.tokenInfo);
    if (tokenInfo.expires > currentDate.getTime()) {
      callNextTick(done, null, tokenInfo.token);
    }
    else {
      // Delete expired token.
      delete store.tokenInfo;
      callNextTick(done, new Error('No token or code found.'));
    }
  }
  else {
    callNextTick(done, new Error('No token or code found.'));
  }

  function extractToken(res, body) {
    if (res.statusCode === 200 && body) {
      store.tokenInfo = JSON.stringify({
        token: body,
        expires: currentDate.getTime() +
          estimatedExpirationLengthInDays * 24 * 60 * 60 * 1000
      });
    }

    if (store.tokenInfo) {
      done(null, JSON.parse(store.tokenInfo).token);
    }
    else {
      done(new Error('Could not get the token from token exchanger.'));
    }
  }
}

module.exports = findToken;
