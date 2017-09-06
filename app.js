var RouteState = require('route-state');
var handleError = require('handle-error-web');
var config = require('./config');
var findToken = require('./find-token');
var qs = require('qs');
var ProjectsFlow = require('./flows/projects-flow');

// var curry = require('lodash.curry');

var routeState;
var projectsFlow;

((function go() {
  var queryStringParsed = qs.parse(window.location.search.slice(1));
  findToken(
    {
      routeDict: queryStringParsed,
      store: window.localStorage,
      currentDate: new Date()
    },
    decideOnToken
  );

  function decideOnToken(error, retrievedToken) {
    routeState = RouteState({
      followRoute: followRoute,
      windowObject: window
    });

    if (error) {
      if (error.message === 'No token or code found.') {
        // TODO: Ask if they want to log in as themselves.
        // redirectToGitHubAuth();
        routeState.routeFromHash();
      }
      else {
        handleError(error);
      }
    }
    else {
      routeState.addToRoute({token: retrievedToken});
    }
  }

})());

function followRoute(routeDict) {
  var user = routeDict.user || 'Jim';

  if (projectsFlow && !projectsFlow.newDataSourceMatches({
    newToken: routeDict.token,
    newUser: user,
    newUserEmail: routeDict.userEmail,
    newVerbose: routeDict.verbose
  })) {
    projectsFlow.cancel();
    projectsFlow = null;
  }

  if (!projectsFlow) {
    projectsFlow = ProjectsFlow({
      token: routeDict.token,
      user: user,
      userEmail: routeDict.userEmail,
      verbose: routeDict.verbose
    });
    projectsFlow.start();
  }

  projectsFlow.changeRenderer({
    view: routeDict.view,
    changeView
  });
}

function changeView(newViewname) {
  routeState.addToRoute({view: newViewname});
}


function redirectToGitHubAuth() {
  var clientId = config.github.clientId;
  if (window.location.hostname === 'localhost') {
    clientId = config.githubTest.clientId;
  }
  var authURI = 'https://github.com/login/oauth/authorize?' +
    'client_id=' + clientId +
    '&scope=repo';

  window.location.href = authURI;
}
