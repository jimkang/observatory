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

function followRoute({ user = 'jimkang', userEmail, verbose, view, sortBy }) {
  if (!projectsFlow) {
    projectsFlow = ProjectsFlow({
      user,
      userEmail,
      verbose,
      sortBy
    });
    projectsFlow.start();
  }

  projectsFlow.changeRenderer({
    view,
    changeView
  });
}

function changeView(newViewname) {
  routeState.addToRoute({ view: newViewname });
}
