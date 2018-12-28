var request = require('basic-browser-request');
var RenderPlain = require('../dom/render-plain');
var RenderGarden = require('../dom/render-garden');
var renderHeader = require('../dom/render-header');
var RenderDeedDetails = require('../dom/render-deed-details');
var RenderActivityView = require('../dom/render-activity-view');
var RenderDeedSortView = require('../dom/render-deed-sort-view');
var RenderFactsView = require('../dom/render-facts-view');
var RenderYearView = require('../dom/render-year-view');
var RenderDescriptiveView = require('../dom/render-descriptive-view');
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
  groupByCriterionName
}) {
  // These should be passed to the render function on a re-render.
  var stickyRenderOpts = {
    filterCriteriaNames,
    sortCriterionName,
    groupByCriterionName
  };
  var collectedProjectsByName = {};
  var collectedProjects = [];
  var streamEndEventReceived = false;
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
    garden: RenderGarden({ onDeedClick: renderDetailsOnGarden }),
    activity: RenderActivityView({ user }),
    deedsort: RenderDeedSortView({ user }),
    facts: RenderFactsView({ user }),
    year: RenderYearView({ onDeedClick: renderDetailsOnYearsView }),
    descriptive: RenderDescriptiveView({
      user,
      onCriteriaControlChange,
      filterCriteriaNames,
      sortCriterionName,
      groupByCriterionName
    })
  };

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
      if (opts[key]) {
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
    decorateProject(collectedProjectsByName[deed.projectName]);
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
    decorateProject(project);
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
      render(
        Object.assign({}, stickyRenderOpts, {
          projectData: collectedProjects,
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
      callRender({ expensiveRenderIsOK: true });
    }
    // Otherwise, the various event handlers will call callRender.
  }

  function onCriteriaControlChange({ criterionSelected, criterionType }) {
    console.log('criterionSelected', criterionSelected, 'type', criterionType);
    if (criterionType === 'group-by') {
      routeState.addToRoute({ groupByCriterionName: criterionSelected });
    } else if (criterionType === 'sort') {
      routeState.addToRoute({ sortCriterionName: criterionSelected.name });
    } else if (criterionType === 'filter') {
      let names = listParser.parse(stickyRenderOpts.filterCriteriaNames);
      names.push(criterionSelected.name);
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
