var RouteState = require('route-state');
// var renderProjectEditor = require('./dom/render-project-editor');
// var listEmAll = require('list-em-all');
var sb = require('standard-bail')();
var handleError = require('handle-error-web');
var GitHubProjectsSource = require('./github-projects-source');
var request = require('basic-browser-request');
var config = require('./config');
var findToken = require('./find-token');
var qs = require('qs');
var addDeedToProject = require('./add-deed-to-project');
var curry = require('lodash.curry');
var throttle = require('lodash.throttle');
// var render = require('./dom/render-scratch');
var render = throttle(require('./dom/render-scratch'), 1000);
debugger;
// var curry = require('lodash.curry');
var verbose = false;

var routeState;
var projectsToCareAbout = ['transform-word-bot', 'attnbot', 'slack-gis'];
var streamEndEventReceived = false;

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
    if (error) {
      if (error.message === 'No token or code found.') {
        redirectToGitHubAuth();
      }
      else {
        handleError(error);
      }
    }
    else {
      routeState = RouteState({
        followRoute: followRoute,
        windowObject: window
      });
      routeState.addToRoute({token: retrievedToken});
    }
  }

})());

function followRoute(routeDict) {
  verbose = routeDict.verbose;
  // console.log(routeDict);
  if (routeDict.user && routeDict.userEmail) {
    projectsFlow(routeDict);
  }
  else {
    // githubUserInfoFlow(sb(curry(projectsFlow)(routeDict), handleError));
    routeState.addToRoute({
      user: document.getElementById('github-username').value,
      userEmail: document.getElementById('github-user-email').value
    });
  }
}


function projectsFlow(routeDict) {
  // var collectedDeeds = [];
  var deedCount = 0;
  var collectedProjects = [];
  var addDeedToCollectedProject = curry(addDeedToProject)(
    handleError,
    collectedProjects
  );

  var githubProjectsSource = GitHubProjectsSource({
    user: routeDict.user,
    githubToken: routeDict.token,
    username: routeDict.user,
    userEmail: routeDict.userEmail,
    request: request,
    onNonFatalError: handleError,
    onDeeds: collectDeeds,
    onProjects: collectProjects,
    filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds'
  });

  streamEndEventReceived = false;
  githubProjectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);

  function collectDeeds(deeds, source) {
    if (streamEndEventReceived) {
      console.log('Received deed after stream end!');
    }
    if (verbose) {
      console.log('Received deeds:', deeds, 'from', source);
    }
    deedCount += deeds.length;
    deeds.forEach(addDeedToCollectedProject);

    render({projectData: collectedProjects});
  }

  function collectProjects(projects, source) {
    if (streamEndEventReceived) {
      console.log('Received project after stream end!');
    }
    if (verbose) {
      console.log('Received projects:', projects, 'from', source);
    }
    // concat does not update collectedProjects references previously
    // passed.
    projects.forEach(addToCollection);
    render({projectData: collectedProjects});
  }

  function addToCollection(project) {
    collectedProjects.push(project);
  }

  function onStreamEnd(error) {
    streamEndEventReceived = true;
    if (error) {
      handleError(error);
    }
    else {
      console.log('Finished streaming.');
      // console.log('projects', collectedProjects);
      // console.log('deeds', collectedDeeds);
      console.log('project count', collectedProjects);
      console.log('deed count', deedCount);
      render({projectData: collectedProjects});
    }
  }
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

function weCareAboutThisProject(project) {
  return true;
  // return projectsToCareAbout.indexOf(project.name) !== -1;
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
