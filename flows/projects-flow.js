var GitHubProjectsSource = require('github-projects-source');
var request = require('basic-browser-request');
var renderPlain = require('../dom/render-plain');
var renderGarden = require('../dom/render-garden');
var renderHeader = require('../dom/render-header');
var RenderDeedDetails = require('../dom/render-deed-details');
var values = require('lodash.values');
var addDeedToProject = require('add-deed-to-project');
var leveljs = require('level-js');
var getUserCommitsFromServer = require('../get-user-commits-from-server');
var handleError = require('handle-error-web');
var countDeedsInProjects = require('../count-deeds-in-projects');

const expensiveRenderInterval = 5;
const expensiveRenderThreshold = 5;

var renderers = {
  'plain': renderPlain,
  'garden': renderGarden
};

// ProjectsFlow is per-data-source. If you need to get from a new data source,
// you need to create another projectSource.
// changeRenderer changes the rendering while still using the same data source.
function ProjectsFlow({token, user, userEmail, verbose, shouldRenderPlants}) {
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var streamEndEventReceived = false;
  var renderCount = 0;
  var render;
  var ignoreSourceEvents = false;
  var renderDeedDetails = RenderDeedDetails({user});

  var githubProjectsSource = GitHubProjectsSource({
    githubToken: token,
    username: user,
    userEmail: userEmail,
    request: request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    // filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds',
    db: leveljs,
    getUserCommits: token ? undefined : getUserCommitsFromServer,
    skipMetadata: token ? false : true
  });

  return {
    start,
    cancel,
    changeRenderer,
    newDataSourceMatches
  };

  function newDataSourceMatches({newToken, newUser, newUserEmail, newVerbose}) {
    return token === newToken && user === newUser &&
      userEmail === newUserEmail && verbose === newVerbose;
  }

  function start() {
    githubProjectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);
  }

  // TODO: Actually implement cancel in GitHubProjectsSource.
  function cancel() {
    ignoreSourceEvents = true;
  }

  function collectDeed(deed, source) {
    if (ignoreSourceEvents) {
      if (verbose) {
        console.log('Flow is cancelled. Ignoring deed!');
      }
      return;
    }

    if (streamEndEventReceived) {
      console.log('Received deed after stream end!');
    }
    if (verbose) {
      console.log('Received deed:', deed, 'from', source);
    }
    addDeedToProject(handleError, collectedProjectsByName, deed);
    callRender({expensiveRenderIsOK: shouldDoExpensiveRender()});
  }

  function collectProject(project, source) {
    if (ignoreSourceEvents) {
      if (verbose) {
        console.log('Flow is cancelled. Ignoring project!');
      }
      return;
    }

    if (streamEndEventReceived) {
      console.log('Received project after stream end!');
    }
    if (verbose) {
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
      console.log('deed count', countDeedsInProjects(collectedProjects));
      callRender({expensiveRenderIsOK: true});
    }
  }

  function callRender({expensiveRenderIsOK = false}) {
    if (render) {
      render({
        projectData: collectedProjects,
        expensiveRenderIsOK: expensiveRenderIsOK,
        onDeedClick: renderDeedDetails,
        shouldRenderPlants: shouldRenderPlants
      });
      renderCount += 1;
    }
  }

  function shouldDoExpensiveRender() {
    return renderCount > expensiveRenderThreshold &&
      renderCount % expensiveRenderInterval === 0;
  }

  function changeRenderer({view, changeView}) {
    var viewName = view || 'garden';

    renderHeader({
      currentUsername: user,
      activeView: viewName,
      changeView
    });
    // Using name instead of id because deeds/commits do not have project ids.
    render = renderers[viewName];
    renderCount = 0;

    if (streamEndEventReceived) {
      callRender({expensiveRenderIsOK: true});
    }
    // Otherwise, the various event handlers will call callRender.
  }
}

module.exports = ProjectsFlow;
