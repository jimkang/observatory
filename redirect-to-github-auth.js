var qs = require('qs');

function redirectToGitHubAuth({ routeDict, clientId, scopes }) {
  var redirectURI =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname;

  var originalRoute = qs.stringify(routeDict);
  var authURI =
    'https://github.com/login/oauth/authorize?' +
    'client_id=' +
    clientId +
    '&response_type=token' +
    '&scope=' +
    encodeURIComponent(scopes.join(' ')) +
    '&redirect_uri=' +
    encodeURIComponent(redirectURI) +
    '&state=' +
    encodeURIComponent(originalRoute);

  // Note: We're using state to restore hash state, not for security here.
  window.location.assign(authURI);
}

module.exports = redirectToGitHubAuth;
