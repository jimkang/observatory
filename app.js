var RouteState = require('route-state');
var handleError = require('handle-error-web');
var config = require('./config');
var findToken = require('./find-token');
var ProjectsFlow = require('./flows/projects-flow');
var wireGitHubForm = require('./dom/wire-github-form');
var redirectToGitHubAuth = require('./redirect-to-github-auth');

// var curry = require('lodash.curry');

var routeState;
var projectsFlow;

((function go() {
  // On first load, always fetch a new token.
  findToken(
    {
      queryString: window.location.search,
      currentDate: new Date()
    },
    decideOnToken
  );

  function decideOnToken(error, tokenInfo, unpackedRoute) {
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
      // routeState.addToRoute({token: retrievedToken});
      var newRouteDict = unpackedRoute;
      if (!newRouteDict) {
        newRouteDict = {};
      }
      for (var key in tokenInfo) {
        newRouteDict[key] = tokenInfo[key];
      }
      routeState.overwriteRouteEntirely(newRouteDict);
    }
  }
})());

function followRoute(routeDict) {
  var user = routeDict.user || 'Jim';
  debugger;
  if (routeDict.user &&
    (!routeDict.token || routeDict.expires <= (new Date()).getTime())) {
    // Token's expired and we want user-specific info. Start the redirect cycle again.
    redirectToGitHubAuth({
      routeDict: routeDict,
      clientId: window.location.hostname === 'localhost' ?
        config.githubTest.clientId : config.githubTest.clientId,
      scopes: ['repo']
    });
    return;
  }

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

  wireGitHubForm({
    username: routeDict.user,
    userEmail: routeDict.userEmail,
    onFormSubmitted: routeWithFormValues
  });

  function routeWithFormValues({username, userEmail}) {
    routeState.addToRoute({
      user: username,
      userEmail: userEmail
    });
    return false;
  }
}

function changeView(newViewname) {
  routeState.addToRoute({view: newViewname});
}
