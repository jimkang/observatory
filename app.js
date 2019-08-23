var RouteState = require('route-state');
var ProjectsFlow = require('./flows/projects-flow');

var routeState;
var projectsFlow;

var routeDefaults = {
  user: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  verbose: false
};

var visibleRouteDefaults = {
  view: 'polyptych',
  filterCriteriaNames: 'featured',
  sortBy: 'shippedDate'
  //sortCriterionName: undefined,
  //groupByCriterionName: undefined
};

(function go() {
  routeState = RouteState({
    followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})();

function followRoute(routeOpts) {
  if (
    !defaultsCovered({
      dictToCover: visibleRouteDefaults,
      dictToCheck: routeOpts
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
    changeView
  });
}

function changeView(newViewname) {
  var routeAdditions = { view: newViewname };
  if (newViewname === 'polyptych') {
    routeAdditions.filterCriteriaNames = 'featured';
  }
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
