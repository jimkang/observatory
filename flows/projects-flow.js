var request = require('basic-browser-request');
var RenderPlain = require('../dom/render-plain');
var RenderGarden = require('../dom/render-garden');
var renderHeader = require('../dom/render-header');
var RenderDeedDetails = require('../dom/render-deed-details');
var RenderYearView = require('../dom/render-year-view');
var values = require('lodash.values');
var omit = require('lodash.omit');
var addDeedToProject = require('add-deed-to-project');
var getUserCommitsFromServer = require('../get-user-commits-from-server');
var handleError = require('handle-error-web');
var countDeedsInProjects = require('../count-deeds-in-projects');
var switchViewRoot = require('../dom/switch-view-root');
var decorateProject = require('../decorate-project');
var uniq = require('lodash.uniq');
var listParser = require('../route-list-parser');
var renderLoadProgress = require('../dom/render-load-progress');
var filterProjects = require('../filter-projects');
var getCriteriaForNames = require('../get-criteria-for-names');
var EaseThrottle = require('../ease-throttle');
var renderArrangementControls = require('../dom/render-arrangement-controls');
var renderArrangementMetaControls = require('../dom/render-arrangement-meta-controls');

const expensiveRenderInterval = 5;
const expensiveRenderThreshold = 5;

// ProjectsFlow is per-data-source. If you need to get from a new data source,
// you need to create another projectSource.
// changeRenderer changes the rendering while still using the same data source.
function ProjectsFlow({
  user,
  verbose,
  routeState,
  filterCriteriaNames, // '|'-separated string
  sortCriterionName,
  groupByCriterionName,
  filterMode
}) {
  // These should be passed to the render function on a re-render.
  var stickyRenderOpts = {
    filterCriteriaNames,
    sortCriterionName,
    groupByCriterionName,
    filterMode
  };
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var streamEndEventReceived = false;
  var deedCount = 0;
  var renderCount = 0;
  var render;
  var ignoreSourceEvents = false;
  var renderDetailsOnGarden = RenderDeedDetails({
    user,
    detailsLayerSelector: '#garden-details-layer'
  });
  var renderDetailsOnYearsView = RenderDeedDetails({
    user,
    detailsLayerSelector: '#years-details-layer'
  });

  var renderers = {
    plain: RenderPlain({ user }),
    garden: RenderGarden({
      onDeedClick: renderDetailsOnGarden
    }),
    year: RenderYearView({
      onDeedClick: renderDetailsOnYearsView
    })
  };

  var throttledCallRender = EaseThrottle({ fn: callRender });

  return {
    start,
    changeRenderer,
    updateOpts
  };

  function start() {
    getUserCommitsFromServer(
      {
        request,
        onRepo: collectProject,
        onCommit: collectDeed
      },
      onStreamEnd
    );
  }

  // Not every opt specifiable in the constructor is updatable.
  function updateOpts(opts) {
    for (var key in stickyRenderOpts) {
      if (key in opts) {
        stickyRenderOpts[key] = opts[key];
      }
    }
  }

  function collectDeed(commit, source) {
    var deed = omit(commit, 'id', 'repoName');
    deed.id = commit.abbreviatedOid;
    deed.projectName = commit.repoName;

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
    deedCount += 1;
    decorateProject(collectedProjectsByName[deed.projectName]);

    renderLoadProgress({
      deedCount,
      projectCount: Object.keys(collectedProjectsByName).length,
      active: true
    });
    throttledCallRender({ expensiveRenderIsOK: shouldDoExpensiveRender() });
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
    decorateProject(project);
    collectedProjectsByName[project.name] = project;
    collectedProjects = values(collectedProjectsByName);
    throttledCallRender({ expensiveRenderIsOK: shouldDoExpensiveRender() });
  }

  function onStreamEnd(error) {
    streamEndEventReceived = true;
    var finalDeedCount = 0;
    if (error) {
      handleError(error);
    } else {
      console.log('Finished streaming.');
      // console.log('projects', collectedProjects);
      // console.log('deeds', collectedDeeds);
      console.log('project count', collectedProjects);
      finalDeedCount = countDeedsInProjects(collectedProjects);
      console.log('deed count', finalDeedCount);
      if (deedCount !== finalDeedCount) {
        console.log(
          'manual count and end count of deeds mismatch:',
          deedCount,
          finalDeedCount
        );
      }
      throttledCallRender({ expensiveRenderIsOK: true });
    }

    renderLoadProgress({
      deedCount,
      projectCount: collectedProjects.length,
      active: false
    });
  }

  function callRender({ expensiveRenderIsOK = false }) {
    if (render) {
      renderArrangementMetaControls({
        outerContainerSelector: '.arrangement-controls-container'
      });
      renderArrangementControls({
        containerSelector: '.arrangement-controls',
        selectedCriteriaNames: stickyRenderOpts.filterCriteriaNames,
        filterMode: stickyRenderOpts.filterMode,
        onCriteriaControlChange,
        onCriteriaFilterModeChange
      });

      var filtered = filterProjects({
        projectData: collectedProjects,
        filterCriteria: getCriteriaForNames(
          listParser.parse(stickyRenderOpts.filterCriteriaNames)
        ),
        filterMode: stickyRenderOpts.filterMode
      });
      render(
        Object.assign({}, stickyRenderOpts, {
          projectData: filtered,
          expensiveRenderIsOK
        })
      );
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
      throttledCallRender({ expensiveRenderIsOK: true });
    }
    // Otherwise, the various event handlers will call throttledCallRender.
  }

  function onCriteriaFilterModeChange({ filterMode }) {
    routeState.addToRoute({ filterMode });
  }

  function onCriteriaControlChange({ criterion, criterionType, selected }) {
    // console.log(
    //   'criterion',
    //   criterion,
    //   'type',
    //   criterionType,
    //   'selected',
    //   selected
    // );
    if (criterionType === 'group-by') {
      routeState.addToRoute({ groupByCriterionName: criterion });
    } else if (criterionType === 'sort') {
      routeState.addToRoute({ sortCriterionName: criterion.name });
    } else if (criterionType === 'filter') {
      let names = listParser.parse(stickyRenderOpts.filterCriteriaNames);
      if (selected) {
        names.push(criterion.name);
      } else {
        names.splice(names.indexOf(criterion.name), 1);
      }
      routeState.addToRoute({
        filterCriteriaNames: listParser.stringify(uniq(names))
      });
    }
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
