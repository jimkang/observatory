var GitHubProjectsSource = require('github-projects-source');
var request = require('basic-browser-request');
var RenderPlain = require('../dom/render-plain');
var renderGarden = require('../dom/render-garden');
var renderHeader = require('../dom/render-header');
var RenderDeedDetails = require('../dom/render-deed-details');
var RenderActivityView = require('../dom/render-activity-view');
var RenderDeedSortView = require('../dom/render-deed-sort-view');
var RenderFactsView = require('../dom/render-facts-view');
var values = require('lodash.values');
var addDeedToProject = require('add-deed-to-project');
var leveljs = require('level-js');
var getUserCommitsFromServer = require('../get-user-commits-from-server');
var handleError = require('handle-error-web');
var countDeedsInProjects = require('../count-deeds-in-projects');
var switchViewRoot = require('../dom/switch-view-root');

const expensiveRenderInterval = 5;
const expensiveRenderThreshold = 5;

// ProjectsFlow is per-data-source. If you need to get from a new data source,
// you need to create another projectSource.
// changeRenderer changes the rendering while still using the same data source.
function ProjectsFlow({ user, userEmail, verbose }) {
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var streamEndEventReceived = false;
  var renderCount = 0;
  var render;
  var ignoreSourceEvents = false;
  var renderDeedDetails = RenderDeedDetails({ user });

  var renderers = {
    plain: RenderPlain({ user }),
    garden: renderGarden,
    activity: RenderActivityView({ user }),
    deedsort: RenderDeedSortView({ user }),
    facts: RenderFactsView({ user })
  };

  var githubProjectsSource = GitHubProjectsSource({
    username: user,
    userEmail: userEmail,
    request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    // filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds',
    db: leveljs,
    getUserCommits: getUserCommitsFromServer,
    skipMetadata: true
  });

  return {
    start,
    cancel,
    changeRenderer
  };

  function start() {
    githubProjectsSource.startStream(
      { sources: ['local', 'API'] },
      onStreamEnd
    );
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

    if (deed.projectName in collectedProjectsByName) {
      addDeedToProject(handleError, collectedProjectsByName, deed);
    } else {
      collectedProjectsByName[deed.projectName] = {
        name: deed.projectName,
        deeds: [deed]
      };
    }
    callRender({ expensiveRenderIsOK: shouldDoExpensiveRender() });
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
      if (project.deeds) {
        project.deeds = mergeDeeds(project.deeds, existingProject.deeds);
      } else {
        project.deeds = existingProject.deeds;
      }
    }
    collectedProjectsByName[project.name] = project;
    collectedProjects = values(collectedProjectsByName);
    callRender({ expensiveRenderIsOK: shouldDoExpensiveRender() });
  }

  function onStreamEnd(error) {
    streamEndEventReceived = true;
    if (error) {
      handleError(error);
    } else {
      console.log('Finished streaming.');
      // console.log('projects', collectedProjects);
      // console.log('deeds', collectedDeeds);
      console.log('project count', collectedProjects);
      console.log('deed count', countDeedsInProjects(collectedProjects));
      callRender({ expensiveRenderIsOK: true });
    }
  }

  function callRender({ expensiveRenderIsOK = false }) {
    if (render) {
      render({
        projectData: collectedProjects,
        expensiveRenderIsOK: expensiveRenderIsOK,
        onDeedClick: renderDeedDetails
      });
      renderCount += 1;
    }
  }

  function shouldDoExpensiveRender() {
    return (
      renderCount > expensiveRenderThreshold &&
      renderCount % expensiveRenderInterval === 0
    );
  }

  function changeRenderer({ view, changeView }) {
    var viewName = view || 'garden';

    renderHeader({
      currentUsername: user,
      activeView: viewName,
      changeView
    });
    // Using name instead of id because deeds/commits do not have project ids.
    render = renderers[viewName];
    switchViewRoot(viewName);
    renderCount = 0;

    if (streamEndEventReceived) {
      callRender({ expensiveRenderIsOK: true });
    }
    // Otherwise, the various event handlers will call callRender.
  }
}

// Right now, deeds in listB will always win a conflict with deeds in listA.
function mergeDeeds(listA, listB) {
  var deedsById = {};
  listA.forEach(addToMap);
  listB.forEach(addToMap);
  var merged = values(deedsById);
  if (merged.length < listA.length && merged.length < listB.length) {
    // If dupes start getting logged and we're using the cache,
    // there's something wrong with it.
    console.log(
      'listA.length:',
      listA.length,
      'listB.length:',
      listB.length,
      'merged:',
      merged.length
    );
  }
  return merged;

  function addToMap(deed) {
    deedsById[deed.id] = deed;
  }
}

module.exports = ProjectsFlow;
