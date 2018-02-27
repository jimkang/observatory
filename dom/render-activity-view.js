var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var scale = require('d3-scale');
var Zoom = require('d3-zoom');
var comparators = require('../comparators');
var pluck = require('lodash.pluck');
// var curry = require('lodash.curry');

const groupWidth = 40;
const dayHeight = 20;
const dayInMS = 24 * 60 * 60 * 1000;

var activityContainer = d3.select('#activity-container');
var activityBoard = d3.select('#activity-board');
var activityGroupRoot = d3.select('#activity-groups');
var fixedXRoot = activityBoard.select('.fixed-x-labels');
var fixedYRoot = activityBoard.select('.fixed-y-labels');

(function setUpZoom() {
  var zoomLayer = activityBoard.select('.zoomable-activity');
  var zoom = Zoom.zoom()
    .scaleExtent([0.01, 2])
    .on('zoom', zoomed);

  activityBoard.call(zoom);

  function zoomed() {
    // console.log(d3.event.transform.toString());
    zoomLayer.attr('transform', d3.event.transform);
    fixedYRoot.attr('transform', getFixedYLayerTransform(d3.event.transform));
  }
})();

function RenderActivityView({ user }) {
  return EaseThrottle({ fn: renderActivityView });

  // TODO: Draw activities in postion
  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    activityContainer.classed('hidden', false);

    var earliestActivityDate;
    var latestActivityDate;

    var activityGroupData = projectData
      .filter(hasDeeds)
      .map(formatProjectIntoActivityGroup);

    if (!activityGroupData || activityGroupData.length < 1) {
      return;
    }

    activityGroupData.forEach(updateSpanDates);
    if (!earliestActivityDate || !latestActivityDate) {
      return;
    }

    activityGroupData.sort(comparators.compareActivityGroupStartDateAsc);
    // console.log(activityGroupData.map(g => g.name));

    var totalDaysSpan =
      (latestActivityDate.getTime() - earliestActivityDate.getTime()) / dayInMS;
    console.log('totalDateSpan', totalDaysSpan);
    // TODO: Display totalDateSpan somewhere.
    var graphHeight = totalDaysSpan * dayHeight;

    // activityBoard.attr('height', activityGroupData.length * groupWidth);
    // activityBoard.attr('width', graphHeight);

    var timeScale = scale
      .scaleTime()
      .domain([latestActivityDate, earliestActivityDate])
      .range([0, graphHeight]);

    renderActivityGroups({ activityGroupData, timeScale });
    renderProjectLabels({ activityGroupData });

    function updateSpanDates(group) {
      if (group.startDate) {
        if (!earliestActivityDate) {
          earliestActivityDate = group.startDate;
        } else if (group.startDate < earliestActivityDate) {
          earliestActivityDate = group.startDate;
        }
      }
      if (group.lastActiveDate) {
        if (!latestActivityDate) {
          latestActivityDate = group.lastActiveDate;
        } else if (group.lastActiveDate > latestActivityDate) {
          latestActivityDate = group.lastActiveDate;
        }
      }
    }
  }
}

function renderActivityGroups({ activityGroupData, timeScale }) {
  var activityGroups = activityGroupRoot
    .selectAll('.activity-group')
    .data(activityGroupData, accessor());

  activityGroups.exit().remove();

  // console.log('activityGroups.enter().size()', activityGroups.enter().size())
  var newGroups = activityGroups
    .enter()
    .append('g')
    .classed('activity-group', true);

  newGroups
    .append('line')
    .classed('project-line', true)
    .attr('x1', groupWidth / 4)
    .attr('x2', groupWidth / 4)
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  var groupsToUpdate = newGroups.merge(activityGroups);
  // console.log('groupsToUpdate size', groupsToUpdate.size())
  groupsToUpdate
    // .attr(
    //   'width',
    //   group => 20 * (group.activities ? group.activities.length : 0)
    // )
    .attr('transform', (group, i) => `translate(${groupWidth * i}, 0)`)
    .select('.project-line')
    .attr('y1', getLastActiveY)
    .attr('y2', getStartDateY);

  var activities = groupsToUpdate
    .selectAll('.activity')
    .data(accessor('activities'), accessor());

  activities.exit().remove();
  var newActivities = activities
    .enter()
    .append('rect')
    // .append('circle')
    .classed('activity', true);
  newActivities
    // .attr('fill', 'blue')
    // .attr('r', 5)
    .attr('width', 20)
    .attr('height', 20);
  var activitiesToUpdate = newActivities.merge(activities);
  activitiesToUpdate.attr('x', 0).attr('y', getActivityY);
  // .attr('cx', 10)
  // .attr('cy', getActivityY);

  function getActivityY(d) {
    return timeScale(d.committedDate);
  }

  function getLastActiveY(group) {
    return timeScale(group.lastActiveDate);
  }

  function getStartDateY(group) {
    return timeScale(group.startDate);
  }
}

function renderProjectLabels({ activityGroupData }) {
  var groupNames = fixedYRoot
    .selectAll('.group-name')
    .data(pluck(activityGroupData, 'name'), accessor('identity'));

  groupNames.exit().remove();

  var newNames = groupNames
    .enter()
    .append('text')
    .classed('group-name', true)
    .attr('transform', 'rotate(90)');

  var currentGroupNames = newNames.merge(groupNames);
  currentGroupNames.text(accessor('identity')).attr('y', getNameLabelY);
}

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

// The label is rotated 90 degrees, so we set y to move it horizontally.
function getNameLabelY(name, i) {
  return -groupWidth * i;
}

function getFixedYLayerTransform({ x, k }) {
  return `translate(${x}, 100) scale(${k})`;
}

module.exports = RenderActivityView;
