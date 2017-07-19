var d3 = require('d3-selection');
var accessor = require('accessor');

var idKey = accessor();
var nameKey = accessor('name');
var messageKey = accessor('message');

var basicProjectListRoot = d3.select('#basic-project-list');

// TODO: Put in own package.
function GetPropertySafely(prop, defaultValue) {
  return function getPropertySafely(thing) {
    if (thing && thing[prop]) {
      return thing[prop];
    }
    else {
      return defaultValue;
    }
  };
}

var deedsKey = GetPropertySafely('deeds', []);

function render({projectData}) {
  var projects = basicProjectListRoot.selectAll('.project').data(projectData, idKey);
  projects.exit().remove();
  var newProjects = projects.enter().append('li').classed('project', true);
  newProjects.append('div').classed('project-name', true);
  newProjects.append('ul').classed('deeds-root', true);
  var allProjects = newProjects.merge(projects);
  allProjects.select('.project-name').text(nameKey);

  var deeds = allProjects.select('.deeds-root').selectAll('.deed').data(deedsKey, idKey);
  deeds.exit().remove();
  var newDeeds = deeds.enter().append('li').classed('deed', true);
  newDeeds.append('div').classed('deed-name', true);
  var allDeeds = newDeeds.merge(deeds);
  allDeeds.select('.deed-name').text(messageKey);
}

module.exports = render;
