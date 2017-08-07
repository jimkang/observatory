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
var throttle = require('lodash.throttle');
// var render = require('./dom/render-scratch');
var renderPlain = throttle(require('./dom/render-scratch'), 300);
var renderGarden = require('./dom/render-garden');
var values = require('lodash.values');
var addDeedToProject = require('./add-deed-to-project');
var formDataOps = require('./dom/form-data-ops');
var userFormIds = require('./user-form-ids');

var renderers = {
  'plain': renderPlain,
  'garden': renderGarden
};

// var curry = require('lodash.curry');
var verbose = false;

var routeState;
var projectsToCareAbout = ['transform-word-bot', 'attnbot', 'slack-gis'];
var streamEndEventReceived = false;

((function go() {
  var queryStringParsed = qs.parse(window.location.search.slice(1));
  routeState = RouteState({
    followRoute: followRoute,
    windowObject: window
  });

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
  verbose = routeDict.verbose;
  debugger;
  if (!routeDict.token) {
    saveFormValues({overridingValues: routeDict});
    redirectToGitHubAuth();
    return;
  }

  var formValues = loadFormValues();
  formDataOps.setFormValues(formValues);
  // console.log(routeDict);
  if (routeDict['github-username'] && routeDict['github-user-email']) {
    projectsFlow(routeDict);
  }
  else {
    // githubUserInfoFlow(sb(curry(projectsFlow)(routeDict), handleError));
    if (formValues['github-username'] && formValues['github-user-email']) {
      routeState.addToRoute({
        'github-username': formValues['github-username'],
        'github-user-email': formValues['github-user-email']
      });
    }
    // else Wait until these values are added to the form.
  }
}

function projectsFlow(routeDict) {
  // Using name instead of id because deeds/commits do not have project ids.
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var render = renderers[routeDict.view];
  if (!render) {
    render = renderPlain;
  }

  var githubProjectsSource = GitHubProjectsSource({
    user: routeDict['github-username'],
    githubToken: routeDict.token,
    username: routeDict['github-username'],
    userEmail: routeDict['github-user-email'],
    request: request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds'
  });

  streamEndEventReceived = false;
  githubProjectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);

  function collectDeed(deed, source) {
    if (streamEndEventReceived) {
      console.log('Received deed after stream end!');
    }
    if (verbose) {
      console.log('Received deed:', deed, 'from', source);
    }
    addDeedToProject(handleError, collectedProjectsByName, deed);
    render({projectData: collectedProjects});
  }

  function collectProject(project, source) {
    if (streamEndEventReceived) {
      console.log('Received project after stream end!');
    }
    if (verbose) {
      console.log('Received project:', project, 'from', source);
    }
    collectedProjectsByName[project.name] = project;
    collectedProjects = values(collectedProjectsByName);
    render({projectData: collectedProjects});
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
      console.log('deed count', 
        collectedProjects.map(p => p.deeds ? p.deeds.length : 0).reduce((sum, l) => sum + l)
      );
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

function saveFormValues({overridingValues}) {
  var formValues = formDataOps.getFormValues();
  if (overridingValues) {
    userFormIds.forEach(overrideFormValue);
  }
  window.localStorage.formValues = JSON.stringify(formValues);

  function overrideFormValue(id) {
    if (id in overridingValues) {
      formValues[id] = overridingValues[id];
    }
  }
}

function loadFormValues() {
  var formValues = {};
  if (window.localStorage.formValues) {
    formValues = JSON.parse(window.localStorage.formValues);
  }
  return formValues;
}
