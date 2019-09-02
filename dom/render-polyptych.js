var d3 = require('d3-selection');
var accessor = require('accessor')();
var {
  compareDescWithSortKey,
  compareByDeedCountAsc
} = require('../comparators');
var curry = require('lodash.curry');
var pick = require('probable').pick;

var polyptychContainer = d3.select('#polyptych-container');
var polyptychRoot = d3.select('#polyptych-root');
var compareDescShipped = curry(compareDescWithSortKey)('shippedDate');

function RenderPolyptych() {
  return renderPolyptych;

  function renderPolyptych({ projectData }) {
    var projectSizeBucketBoundaries = getProjectSizeBucketBoundaries(
      projectData
    );
    projectData.sort(compareDescShipped);

    d3.selectAll('.view-root:not(#polyptych-container)').classed(
      'hidden',
      true
    );
    polyptychContainer.classed('hidden', false);

    var tychs = polyptychRoot.selectAll('.tych').data(projectData, accessor());
    tychs.exit().remove();
    var newTychs = tychs
      .enter()
      .append('div')
      .classed('tych', true)
      .classed('centered-col', true);

    newTychs.append('div').classed('title', true);
    newTychs.append('img').classed('project-window', true);
    newTychs.append('div').classed('description', true);
    newTychs.append('ul').classed('links-root', true);

    var currentTychs = newTychs.merge(tychs);
    currentTychs.attr('class', getClassStringForTych);
    currentTychs.select('.title').text(accessor('name'));
    var projectWindows = currentTychs.select('.project-window');
    projectWindows.classed('hidden', doesNotHaveProfileImage);
    projectWindows.attr('src', accessor('profileImage'));
    currentTychs.select('.description').text(accessor('description'));

    var linksRoots = currentTychs.selectAll('.links-root');
    var linkItems = linksRoots.data(accessor('links'), accessor('0'));
    linkItems.exit().remove();
    var newLinkItems = linkItems.enter().append('li');
    newLinkItems.append('a');
    newLinkItems
      .merge(linkItems)
      .select('a')
      .attr('href', accessor('0'))
      .attr('target', '_blank')
      .text(accessor('1'));

    function getClassStringForTych(project) {
      var sizeClass = 'small-tych';
      if (
        project.deeds &&
        project.deeds.length > projectSizeBucketBoundaries[0]
      ) {
        if (project.profileImage) {
          sizeClass = 'tall-tych';
        } else {
          sizeClass = pick(['wide-tych', 'tall-tych']);
        }
        if (project.deeds.length > projectSizeBucketBoundaries[1]) {
          sizeClass = 'big-tych';
        }
      }
      return 'tych centered-col ' + sizeClass;
    }
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

function getProjectSizeBucketBoundaries(projects) {
  if (projects.length < 1) {
    return [0, 0];
  }

  projects.sort(compareByDeedCountAsc);
  return [
    getDeedCount(projects[~~(projects.length / 3)]),
    getDeedCount(projects[~~((2 * projects.length) / 3)])
  ];
}

function getDeedCount(project) {
  if (project && project.deeds) {
    return project.deeds.length;
  }
  return 0;
}

module.exports = RenderPolyptych;
