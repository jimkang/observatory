var GitHubProjectsSource = require('github-projects-source');
var request = require('basic-browser-request');
var throttle = require('lodash.throttle');
var renderPlain = require('../dom/render-scratch');
var renderGarden = require('../dom/render-garden');
var values = require('lodash.values');
var addDeedToProject = require('add-deed-to-project');
var leveljs = require('level-js');
var getUserCommitsFromServer = require('../get-user-commits-from-server');
var handleError = require('handle-error-web');

const expensiveRenderInterval = 5;
const expensiveRenderThreshold = 10;

var renderers = {
  'plain': renderPlain,
  'garden': renderGarden
};

function projectsFlow(routeDict) {
  var streamEndEventReceived = false;
  // Using name instead of id because deeds/commits do not have project ids.
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var render = renderers[routeDict.view];
  if (!render) {
    render = renderPlain;
  }
  render = throttle(render, 300);
  var renderCount = 0;

  var githubProjectsSource = GitHubProjectsSource({
    githubToken: routeDict.token,
    username: routeDict.user,
    userEmail: routeDict.userEmail,
    request: request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    // filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds',
    db: leveljs,
    getUserCommits: routeDict.token ? undefined : getUserCommitsFromServer
  });

  streamEndEventReceived = false;
  githubProjectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);

  function collectDeed(deed, source) {
    if (streamEndEventReceived) {
      console.log('Received deed after stream end!');
    }
    if (routeDict.verbose) {
      console.log('Received deed:', deed, 'from', source);
    }
    addDeedToProject(handleError, collectedProjectsByName, deed);
    callRender({expensiveRenderIsOK: shouldDoExpensiveRender()});
  }

  function collectProject(project, source) {
    if (streamEndEventReceived) {
      console.log('Received project after stream end!');
    }
    if (routeDict.verbose) {
      console.log('Received project:', project, 'from', source);
    }
    var existingProject = collectedProjectsByName[project.name];
    if (existingProject) {
      project.deeds = existingProject.deeds;
    }
    collectedProjectsByName[project.name] = project;
    collectedProjects = values(collectedProjectsByName);
    callRender({expensiveRenderIsOK: shouldDoExpensiveRender()});
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
      callRender({expensiveRenderIsOK: true});
    }
  }

  function callRender({expensiveRenderIsOK = false}) {
    render({
      projectData: collectedProjects,
      expensiveRenderIsOK: expensiveRenderIsOK,
      onDeedClick: d => console.log(d)
    });
    renderCount += 1;
  }

  function shouldDoExpensiveRender() {
    return renderCount > expensiveRenderThreshold &&
      renderCount % expensiveRenderInterval === 0;
  }
}

module.exports = projectsFlow;
