var RouteState = require('route-state');
var renderProjectEditor = require('./dom/render-project-editor');
var listEmAll = require('list-em-all');
var sb = require('standard-bail')();
var handleError = require('handle-error-web');

((function go() {
  var routeState = RouteState({
    followRoute: followRoute,
    windowObject: window
  });
  routeState.routeFromHash();
})());

function followRoute(routeDict) {
  console.log(routeDict);
  // if (routeDict.edit === 'new') {
  //   newProjectFlow();
  // }
  listFlow();
}

function listFlow() {
  listEmAll.loadList({url: 'projects.yaml'}, sb(callRenderList, handleError));
}

function callRenderList(projects) {
  listEmAll.render({
    thingList: projects.filter(projectIsValid),
    rootId: 'list', 
    thingClass: 'project'
  });
}

function newProjectFlow() {
  renderProjectEditor();
}

function projectIsValid(project) {
  return !project.disown && !project.parent;
}
