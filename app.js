var RouteState = require('route-state');
var handleError = require('handle-error-web');
var config = require('./config');
var findToken = require('./find-token');
var qs = require('qs');
var projectsFlow = require('./flows/projects-flow');

// var curry = require('lodash.curry');

var routeState;

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
  // console.log(routeDict);
  // if (routeDict.user && routeDict.userEmail) {
  projectsFlow(routeDict);
  // }
  // else {
  //   // githubUserInfoFlow(sb(curry(projectsFlow)(routeDict), handleError));
  //   routeState.addToRoute({
  //     user: document.getElementById('github-username').value,
  //     userEmail: document.getElementById('github-user-email').value
  //   });
  // }
}



// function listFlow() {
//   listEmAll.loadList({url: 'projects.yaml'}, sb(callRenderList, handleError));
// }

// function callRenderList(projects) {
//   listEmAll.render({
//     thingList: projects.filter(projectIsValid),
//     rootId: 'list', 
//     thingClass: 'project'
//   });
// }

// function newProjectFlow() {
//   renderProjectEditor();
// }

// function projectIsValid(project) {
//   return !project.disown && !project.parent;
// }

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
