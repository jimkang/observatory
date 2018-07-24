var RouteState = require('route-state');
var ProjectsFlow = require('./flows/projects-flow');

var routeState;
var projectsFlow;

(function go() {
  routeState = RouteState({
    followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})();

function followRoute(routeDict) {
  var user = routeDict.user || 'jimkang';

  if (!projectsFlow) {
    projectsFlow = ProjectsFlow({
      user,
      userEmail: routeDict.userEmail,
      verbose: routeDict.verbose
    });
    projectsFlow.start();
  }

  projectsFlow.changeRenderer({
    view: routeDict.view,
    changeView
  });
}

function changeView(newViewname) {
  routeState.addToRoute({ view: newViewname });
}
