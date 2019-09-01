var d3 = require('d3-selection');
var accessor = require('accessor')();
var { compareDescWithSortKey } = require('../comparators');
var curry = require('lodash.curry');

var polyptychContainer = d3.select('#polyptych-container');
var polyptychRoot = d3.select('#polyptych-root');
var compareDescShipped = curry(compareDescWithSortKey)('shippedDate');

function RenderPolyptych() {
  return renderPolyptych;

  function renderPolyptych({ projectData }) {
    projectData.sort(compareDescShipped);

    d3.selectAll('.view-root:not(#polyptych-container)').classed(
      'hidden',
      true
    );
    polyptychContainer.classed('hidden', false);

    var tychs = polyptychRoot.selectAll('.tych').data(projectData);
    tychs.exit().remove();
    var newTychs = tychs
      .enter()
      .append('div')
      .classed('tych', true)
      .classed('centered-col', true);

    newTychs.append('div').classed('title', true);
    newTychs.append('img').classed('project-window', true);
    newTychs.append('div').classed('description', true);

    var currentTychs = newTychs.merge(tychs);
    currentTychs.select('.title').text(accessor('name'));
    var projectWindows = currentTychs.select('.project-window');
    projectWindows.classed('hidden', doesNotHaveProfileImage);
    projectWindows.attr('src', accessor('profileImage'));
    currentTychs.select('.description').text(accessor('description'));
  }
}

function getMainLink(project) {
  if (project.links && project.links.length > 0) {
    return project.links[0][0];
  }
  if (project.metalinks && project.metalinks.length > 0) {
    return project.metalinks[0][0];
  }
}

function doesNotHaveProfileImage(project) {
  return !project.profileImage;
}

module.exports = RenderPolyptych;
