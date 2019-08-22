var RouteState = require('route-state');
var ProjectsFlow = require('./flows/projects-flow');

var routeState;
var projectsFlow;

var routeDefaults = {
  user: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  verbose: false,
  view: 'polyptych',
  sortBy: 'shippedDate',
  filterCriteriaNames: 'featured',
  sortCriterionName: undefined,
  groupByCriterionName: undefined
};

(function go() {
  routeState = RouteState({
    followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})();

function followRoute(routeOpts) {
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
  routeState.addToRoute({ view: newViewname });
}
