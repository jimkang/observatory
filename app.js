var RouteState = require('route-state');
var ProjectsFlow = require('./flows/projects-flow');
var handleError = require('handle-error-web');
var { version } = require('./package.json');

var routeState;
var projectsFlow;

var routeDefaults = {
  user: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  verbose: false,
  commitSourceURL: 'https://smidgeo.com/observatory-cache/jimkang-cache.json',
};

var visibleRouteDefaults = {
  view: 'garden',
  filterMode: 'some',
  //filterCriteriaNames: 'featured'
  //sortCriterionName: undefined,
  //groupByCriterionName: undefined
};

(function go() {
  window.onerror = reportTopLevelError;
  renderVersion();

  routeState = RouteState({
    followRoute,
    windowObject: window,
  });
  routeState.routeFromHash();
})();

function followRoute(routeOpts) {
  if (
    !defaultsCovered({
      dictToCover: visibleRouteDefaults,
      dictToCheck: routeOpts,
    })
  ) {
    routeState.addToRoute(Object.assign(visibleRouteDefaults, routeOpts));
    return;
  }

  var opts = Object.assign({ routeState }, routeDefaults, routeOpts);

  if (!projectsFlow) {
    projectsFlow = ProjectsFlow(opts);
    projectsFlow.start();
  }

  projectsFlow.updateOpts(opts);

  projectsFlow.changeRenderer({
    view: opts.view,
    changeView,
  });
}

function changeView(newViewname) {
  var routeAdditions = { view: newViewname };
  routeState.addToRoute(routeAdditions);
}

function defaultsCovered({ dictToCover, dictToCheck }) {
  for (var key in dictToCover) {
    if (!(key in dictToCheck)) {
      return false;
    }
  }
  return true;
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function renderVersion() {
  var versionInfo = document.getElementById('version-info');
  versionInfo.textContent = version;
}
