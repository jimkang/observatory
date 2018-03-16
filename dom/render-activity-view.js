var d3 = require('d3-selection');
var accessor = require('accessor')();
// var GetPropertySafely = require('get-property-safely');
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

const dayWidth = 20;
const groupHeight = dayWidth * 2;

// const horizontalRuleYWithinGroup = dayWidth;
// const labelTextX = -dayWidth;
const activitySize = dayWidth / 2;
// Center the square in the middle of the group.
// const activityYWithinGroup = groupWidth / 2 - activitySize / 2;
const dateTickLength = dayWidth;

const dayInMS = 24 * 60 * 60 * 1000;

var activityContainer = d3.select('#activity-container');
var activityBoard = d3.select('#activity-board');
var activityGroupRoot = d3.select('#activity-groups');
var fixedXRoot = activityBoard.select('.fixed-x-labels');
var fixedYRoot = activityBoard.select('.fixed-y-labels');
var dateLabels = fixedYRoot.select('.date-labels');
var yearLabels = fixedYRoot.select('.year-labels');
var targetsCanvas = d3.select('#activities-targets-canvas');
var aCtx = d3
  .select('#activities-canvas')
  .node()
  .getContext('2d', { alpha: true });

const groupLabelY = activityBoard.attr('height') / 2;
const timeRulerX = 0; //activityBoard.attr('width') / 2;

var currentTransform = Zoom.zoomIdentity;

function setUpZoom(draw) {
  var zoomLayer = activityBoard.select('.zoomable-activity');
  var zoom = Zoom.zoom()
    .scaleExtent([0.03, 100])
    .on('zoom', zoomed);

  targetsCanvas.call(zoom);

  function zoomed() {
    // console.log(d3.event.transform.toString());
    currentTransform = d3.event.transform;
    draw();

    // zoomLayer.attr('transform', d3.event.transform);
    // fixedYRoot.attr('transform', getFixedYLayerTransform(d3.event.transform));
    // fixedXRoot.attr('transform', getFixedXLayerTransform(d3.event.transform));
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
    var graphHeight = activityBoard.attr('height');
    var graphWidth = activityBoard.attr('width');

    // activityBoard.attr('height', activityGroupData.length * groupWidth);
    // activityBoard.attr('width', graphHeight);

    var timeScale = scale
      .scaleTime()
      .domain([latestActivityDate, earliestActivityDate])
      .range([0, graphWidth]);

    setUpZoom(draw);
    draw();

    function draw() {
      aCtx.clearRect(0, 0, graphWidth, graphHeight);
      renderActivityGroups({
        activityGroupData,
        timeScale,
        graphWidth,
        graphHeight
      });
      renderGroupRulers({
        activityGroupData,
        graphWidth
      });
      renderTimeRulers({ timeScale, graphWidth, graphHeight });
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

function renderActivityGroups({
  activityGroupData,
  timeScale,
  graphWidth,
  graphHeight
}) {
  aCtx.strokeStyle = 'red';
  aCtx.beginPath();
  activityGroupData.forEach(renderGroup);
  aCtx.stroke();
  console.log('Drawn!');

  function renderGroup(activityGroup, i) {
    // console.log('draw group at', groupWidth * i, getLastActiveY(activityGroup), 'to', groupWidth * i, getStartDateY(activityGroup));
    aCtx.moveTo.apply(
      aCtx,
      currentTransform.apply([getLastActiveX(activityGroup), groupHeight * i])
    );
    aCtx.lineTo.apply(
      aCtx,
      currentTransform.apply([getStartDateX(activityGroup), groupHeight * i])
    );
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

  function getActivityX(d) {
    return timeScale(d.committedDate);
  }

  function getLastActiveX(group) {
    return timeScale(group.lastActiveDate);
  }

  function getStartDateX(group) {
    return timeScale(group.startDate);
  }
}

function renderGroupRulers({ activityGroupData, graphWidth }) {
  aCtx.strokeStyle = '#ccc';
  aCtx.lineWidth = 1;
  aCtx.beginPath();
  activityGroupData.forEach(drawGroupRuler);
  aCtx.stroke();

  var groupLabels = fixedXRoot
    .selectAll('text')
    .data(activityGroupData, accessor());
  groupLabels.exit().remove();
  groupLabels
    .enter()
    .append('text')
    .merge(groupLabels)
    .text(accessor('name'))
    .attr('transform', getGroupLabelTransform);

  function drawGroupRuler(g, i) {
    var y = getGroupStartY(g, i);
    aCtx.moveTo(0, y);
    aCtx.lineTo(graphWidth, y);
  }

  function getGroupStartY(g, i) {
    return currentTransform.applyY(i * groupHeight);
  }

  function getGroupLabelTransform(g, i) {
    return `translate(0, ${getGroupStartY(g, i)}) scale(${currentTransform.k})`;
  }
}

function getGroupRulerY1(d, i) {
  return i * groupHeight;
}

function getGroupRulerY2(d, i) {
  return (i + 1) * groupHeight;
}

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

function renderTimeRulers({ timeScale, graphWidth, graphHeight }) {
  var zoomedTimeScale = currentTransform.rescaleX(timeScale);
  zoomedTimeScale.range([0, graphWidth]);
  var tickDates = zoomedTimeScale.ticks(time.timeMonth.every(1));
  // weekRuler.attr('transform', 'translate(300, 0)');
  // yearRuler.attr('transform', 'translate(300, 0)');
  aCtx.strokeStyle = '#666';
  aCtx.lineWidth = 1;
  aCtx.beginPath();
  tickDates.forEach(drawDateTick);
  aCtx.stroke();

  var tickTexts = dateLabels
    .selectAll('text')
    .data(tickDates, accessor('identity'));
  tickTexts.exit().remove();
  tickTexts
    .enter()
    .append('text')
    .attr('y', graphHeight / 8)
    .merge(tickTexts)
    .attr('x', zoomedTimeScale)
    .text(accessor('identity'));

  function drawDateTick(date) {
    var x = zoomedTimeScale(date);
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, graphHeight / 8);
  }

  // console.log('start', zoomedTimeScale.invert(0));
  // console.log('end', zoomedTimeScale.invert(graphWidth));

  // var weekAxis = axis.axisBottom(zoomedTimeScale);
  // weekAxis.ticks(time.timeWeek.every(1));
  // weekAxis.tickSize(dateTickLength);

  // var yearAxis = axis.axisBottom(zoomedTimeScale);
  // yearAxis.ticks(time.timeYear.every(1));
  // yearAxis.tickFormat(timeFormat('%Y'));
  // yearAxis.tickSize(100);

  // weekRuler.call(weekAxis);
  // yearRuler.call(yearAxis);
}

function getGroupRulerTransform(name, i) {
  return `translate(${groupHeight * i}, 0)`;
}

function getFixedYLayerTransform({ x, k }) {
  return `translate(${x}, ${groupLabelY}) scale(${k})`;
}

function getFixedXLayerTransform({ y, k }) {
  return `translate(${timeRulerX}, ${y}) scale(${k})`;
}

module.exports = RenderActivityView;
