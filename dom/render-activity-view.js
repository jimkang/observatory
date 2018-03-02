var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var scale = require('d3-scale');
var Zoom = require('d3-zoom');
var comparators = require('../comparators');
var pluck = require('lodash.pluck');
var axis = require('d3-axis');
var time = require('d3-time');
var timeFormat = require('d3-time-format').timeFormat;
// var curry = require('lodash.curry');

const dayHeight = 20;
const groupWidth = dayHeight * 2;
const verticalRuleXWithinGroup = dayHeight;
const labelTextY = -dayHeight;
const activitySize = dayHeight / 2;
// Center the squire in the middle of the group.
const activityXWithinGroup = groupWidth / 2 - activitySize / 2;

const dayInMS = 24 * 60 * 60 * 1000;

var activityContainer = d3.select('#activity-container');
var activityBoard = d3.select('#activity-board');
var activityGroupRoot = d3.select('#activity-groups');
var fixedXRoot = activityBoard.select('.fixed-x-labels');
var fixedYRoot = activityBoard.select('.fixed-y-labels');
var weekRuler = fixedXRoot.select('.week-ruler');
var yearRuler = fixedXRoot.select('.year-ruler');
var targetsCanvas = d3.select('#activities-targets-canvas');
var activitiesContext = d3.select('#activities-canvas').node().getContext('2d', { alpha: true });

const groupLabelY = activityBoard.attr('height') / 2;
const timeRulerX = 0;//activityBoard.attr('width') / 2;
const dateTickLength = 2000;

function setUpZoom(draw, graphWidth, graphHeight) {
  var zoomLayer = activityBoard.select('.zoomable-activity');
  var zoom = Zoom.zoom()
    .scaleExtent([0.03, 2])
    .on('zoom', zoomed);

  targetsCanvas.call(zoom);

  function zoomed() {
    // console.log(d3.event.transform.toString());
    activitiesContext.clearRect(0, 0, graphWidth, graphHeight);
    console.log(d3.event.transform);
    activitiesContext.save();
    // TODO: Semantic zoom to preserve line thickness.
    activitiesContext.translate(d3.event.transform.x, d3.event.transform.y);
    activitiesContext.scale(d3.event.transform.k, d3.event.transform.k);
    draw();
    activitiesContext.restore();

    zoomLayer.attr('transform', d3.event.transform);
    fixedYRoot.attr('transform', getFixedYLayerTransform(d3.event.transform));
    fixedXRoot.attr('transform', getFixedXLayerTransform(d3.event.transform));
  }
}

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
    var graphWidth = activityBoard.attr('width');

    // activityBoard.attr('height', activityGroupData.length * groupWidth);
    // activityBoard.attr('width', graphHeight);

    var timeScale = scale
      .scaleTime()
      .domain([latestActivityDate, earliestActivityDate])
      .range([0, graphHeight]);

    setUpZoom(draw, graphWidth, graphHeight);
    draw(); // TODO: Use current zoom.

    function draw() {
      renderActivityGroups({ activityGroupData, timeScale, graphWidth, graphHeight });
      renderGroupRulers({
        activityGroupData,
        graphHeight,
        boardHeight: activityBoard.attr('height')
      });
      renderTimeRulers({ timeScale });
    }

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

function renderActivityGroups({ activityGroupData, timeScale, graphWidth, graphHeight }) {
  activitiesContext.strokeStyle = 'red';
  activitiesContext.beginPath();
  activityGroupData.forEach(renderGroup);
  activitiesContext.stroke();
  console.log('Drawn!');

  function renderGroup(activityGroup, i) {
    // console.log('draw group at', groupWidth * i, getLastActiveY(activityGroup), 'to', groupWidth * i, getStartDateY(activityGroup));
    activitiesContext.moveTo(groupWidth * i, getLastActiveY(activityGroup));
    activitiesContext.lineTo(groupWidth * i, getStartDateY(activityGroup));
  }
  // var activityGroups = activityGroupRoot
  //   .selectAll('.activity-group')
  //   .data(activityGroupData, accessor());

  // activityGroups.exit().remove();

  // var newGroups = activityGroups
  //   .enter()
  //   .append('g')
  //   .classed('activity-group', true);

  // newGroups
  //   .append('line')
  //   .classed('project-line', true)
  //   .attr('x1', verticalRuleXWithinGroup)
  //   .attr('x2', verticalRuleXWithinGroup)
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', 2);

  // var groupsToUpdate = newGroups.merge(activityGroups);
  // // console.log('groupsToUpdate size', groupsToUpdate.size())
  // groupsToUpdate
  //   // .attr(
  //   //   'width',
  //   //   group => 20 * (group.activities ? group.activities.length : 0)
  //   // )
  //   .attr('transform', (group, i) => `translate(${groupWidth * i}, 0)`)
  //   .select('.project-line')
  //   .attr('y1', getLastActiveY)
  //   .attr('y2', getStartDateY);

  // var activities = groupsToUpdate
  //   .selectAll('.activity')
  //   .data(accessor('activities'), accessor());

  // activities.exit().remove();
  // var newActivities = activities
  //   .enter()
  //   .append('rect')
  //   // .append('circle')
  //   .classed('activity', true);
  // newActivities
  //   // .attr('fill', 'blue')
  //   // .attr('r', 5)
  //   .attr('width', activitySize)
  //   .attr('height', activitySize);
  // var activitiesToUpdate = newActivities.merge(activities);
  // activitiesToUpdate.attr('x', activityXWithinGroup).attr('y', getActivityY);
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

function renderGroupRulers({ activityGroupData, graphHeight }) {
  var groupRulers = fixedYRoot
    .selectAll('.group-name')
    .data(pluck(activityGroupData, 'name'), accessor('identity'));

  groupRulers.exit().remove();

  var newRulers = groupRulers
    .enter()
    .append('g')
    .classed('group-name', true);

  newRulers
    .append('line')
    .attr('x1', verticalRuleXWithinGroup)
    .attr('x2', verticalRuleXWithinGroup)
    .attr('y1', -graphHeight)
    .attr('y2', graphHeight)
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1);

  newRulers
    .append('text')
    .attr('transform', 'rotate(90)')
    .attr('y', labelTextY); // Since we're rotated, this moves it horizontally.

  var updateRulers = newRulers.merge(groupRulers);
  updateRulers.attr('transform', getGroupRulerTransform);
  updateRulers.select('text').text(accessor('identity'));
  // .attr('y', getNameLabelY);
}

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

function renderTimeRulers({ timeScale }) {
  // weekRuler.attr('transform', 'translate(300, 0)');
  // yearRuler.attr('transform', 'translate(300, 0)');

  var weekAxis = axis.axisRight(timeScale);
  weekAxis.ticks(time.timeWeek.every(1));
  weekAxis.tickSize(dateTickLength);

  var yearAxis = axis.axisLeft(timeScale);
  yearAxis.ticks(time.timeYear.every(1));
  yearAxis.tickFormat(timeFormat('%Y'));
  yearAxis.tickSize(100);

  weekRuler.call(weekAxis);
  yearRuler.call(yearAxis);
}

function getGroupRulerTransform(name, i) {
  return `translate(${groupWidth * i}, 0)`;
}

function getFixedYLayerTransform({ x, k }) {
  return `translate(${x}, ${groupLabelY}) scale(${k})`;
}

function getFixedXLayerTransform({ y, k }) {
  return `translate(${timeRulerX}, ${y}) scale(${k})`;
}

module.exports = RenderActivityView;
