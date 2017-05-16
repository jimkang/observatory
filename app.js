var RouteState = require('route-state');
var renderProjectEditor = require('./dom/render-project-editor');

((function go() {
  var routeState = RouteState({
    followRoute: followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})());

function followRoute(routeDict) {
  console.log(routeDict);
  if (routeDict.edit === 'new') {
    newProjectFlow();
  }
}

function newProjectFlow() {
  renderProjectEditor();
}
