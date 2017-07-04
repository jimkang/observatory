var RouteState = require('route-state');
// var renderProjectEditor = require('./dom/render-project-editor');
// var listEmAll = require('list-em-all');
var sb = require('standard-bail')();
var handleError = require('handle-error-web');
var ProjectsSource = require('./projects-source');
var request = require('basic-browser-request');
var config = require('./config');

var projectsToCareAbout = ['iemxrre', 'attnbot', 'slack-gis'];

((function go() {
  var routeState = RouteState({
    followRoute: followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})());

function followRoute(routeDict) {
  console.log(routeDict);
  if (routeDict.user && routeDict.userEmail) {
    projectsFlow(routeDict);
  }
}

function projectsFlow(routeDict) {
  var collectedDeeds = {};
  var collectedProjects = {};

  var projectsSource = ProjectsSource({
    user: routeDict.user,
    githubToken: config.githubTestToken,
    username: routeDict.user,
    userEmail: routeDict.userEmail,
    request: request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds'
  });
  projectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);

  function collectDeed(deed) {
    console.log('Received deed:', deed);
    collectedDeeds[deed.id] = deed;
  }

  function collectProject(project) {
    console.log('Received project:', project);
    collectedProjects[project.id] = project;
  }

  function onStreamEnd(error) {
    if (error) {
      handleError(error);
    }
    else {
      console.log('Finished streaming.');
      console.log('projects', collectedProjects);
      console.log('deeds', collectedDeeds);
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
  return projectsToCareAbout.indexOf(project.name) !== -1;
}
