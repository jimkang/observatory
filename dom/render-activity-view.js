var d3 = require('d3-selection');
var accessor = require('accessor')();
// var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var scale = require('d3-scale');
var Zoom = require('d3-zoom');
var comparators = require('../comparators');
// var pluck = require('lodash.pluck');
// var axis = require('d3-axis');
var time = require('d3-time');
var renderTimeRuler = require('./render-time-ruler');
var probable = require('probable');

const activityFillHueA = probable.roll(360);
const activityFillHueB = activityFillHueA + 40 % 360;
const activityColorA = `hsl(${activityFillHueA}, 50%, 50%, 0.3)`;
const activityColorB = `hsl(${activityFillHueB}, 50%, 50%, 0.3)`;

const groupLabelMaxScale = 4;
const baseDayLength = 40;
const baseGroupSpacing = baseDayLength * 2;

// const horizontalRuleYWithinGroup = dayWidth;
// const labelTextX = -dayWidth;
// Center the square in the middle of the group.
// const activityYWithinGroup = groupWidth / 2 - activitySize / 2;
// const dateTickLength = dayWidth;

const dayInMS = 24 * 60 * 60 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - dayInMS);

var activityContainer = d3.select('#activity-container');
var labelBoard = d3.select('#label-board');
//var activityGroupRoot = d3.select('#activity-groups');
var fixedXRoot = labelBoard.select('.fixed-x-labels');
var targetsCanvas = d3.select('#activities-targets-canvas');
var aCtx = d3
  .select('#activities-canvas')
  .node()
  .getContext('2d', { alpha: true });

//const groupLabelY = labelBoard.attr('height') / 2;
//const timeRulerX = 0; //labelBoard.attr('width') / 2;

var currentTransform = Zoom.zoomIdentity;
var timeScale;
var zoomedTimeScale;

function setUpZoom(draw) {
  var zoom = Zoom.zoom()
    .scaleExtent([0.03, 500])
    .on('zoom', zoomed);

  targetsCanvas.call(zoom);

  function zoomed() {
    // console.log(d3.event.transform.toString());
    currentTransform = d3.event.transform;
    zoomedTimeScale = currentTransform.rescaleX(timeScale);
    draw();

    // zoomLayer.attr('transform', d3.event.transform);
    // fixedYRoot.attr('transform', getFixedYLayerTransform(d3.event.transform));
    // fixedXRoot.attr('transform', getFixedXLayerTransform(d3.event.transform));
  }
}

function RenderActivityView() {
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

    activityGroupData.sort(comparators.compareLastUpdatedDesc);
    // console.log(activityGroupData.map(g => g.name));

    var totalDaysSpan =
      (latestActivityDate.getTime() - earliestActivityDate.getTime()) / dayInMS;
    // console.log('totalDateSpan', totalDaysSpan);
    // TODO: Display totalDateSpan somewhere.
    var graphHeight = labelBoard.attr('height');
    var graphWidth = labelBoard.attr('width');

    // labelBoard.attr('height', activityGroupData.length * groupWidth);
    // labelBoard.attr('width', graphHeight);

    timeScale = scale
      .scaleTime()
      .domain([latestActivityDate, earliestActivityDate])
      .range([0, totalDaysSpan * baseDayLength]);
    //.range([0, graphWidth]);
    zoomedTimeScale = timeScale;

    setUpZoom(draw);
    draw();

    function draw() {
      aCtx.clearRect(0, 0, graphWidth, graphHeight);

      renderTimeRuler({
        timeScale: zoomedTimeScale,
        graphWidth,
        graphHeight,
        currentTransform,
        ctx: aCtx
      });
      renderGroupRulers({
        activityGroupData,
        graphWidth
      });
      renderActivityGroups({
        activityGroupData,
        timeScale,
        graphWidth,
        graphHeight
      });
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
  timeScale
  // graphWidth,
  // graphHeight
}) {
  var dayLength = zoomedTimeScale(today) - zoomedTimeScale(yesterday);
  aCtx.strokeStyle = 'red';
  aCtx.beginPath();
  activityGroupData.forEach(renderGroup);
  aCtx.stroke();
  // console.log('Drawn!');

  function renderGroup(activityGroup, groupIndex) {
    // console.log('draw group at', groupWidth * i, getLastActiveY(activityGroup), 'to', groupWidth * i, getStartDateY(activityGroup));
    activityGroup.activities.forEach(renderActivity);
    aCtx.moveTo.apply(
      aCtx,
      currentTransform.apply([
        getLastActiveX(activityGroup),
        baseGroupSpacing * groupIndex
      ])
    );
    aCtx.lineTo.apply(
      aCtx,
      currentTransform.apply([
        getStartDateX(activityGroup),
        baseGroupSpacing * groupIndex
      ])
    );

    function renderActivity(activity, i) {
      // TODO: Go back to trying to make these squares, see if that makes
      // zoom more natural.
      var x = getActivityX(activity);
      var y = currentTransform.applyY(baseGroupSpacing * groupIndex);
      //var activityHeight = currentTransform.k * baseGroupSpacing;
      aCtx.fillStyle = i % 2 === 0 ? activityColorA : activityColorB;
      aCtx.fillRect(x, y, dayLength, dayLength);
      // aCtx.strokeRect(x, y, dayWidth, activityHeight);
    }
  }
  function getActivityX(d) {
    return zoomedTimeScale(time.timeDay.floor(d.committedDate));
  }

  function getLastActiveX(group) {
    return timeScale(group.lastActiveDate);
  }

  function getStartDateX(group) {
    return timeScale(group.startDate);
  }
}

function renderGroupRulers({ activityGroupData, graphWidth }) {
  var groupSpacing = baseGroupSpacing * currentTransform.k;
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
    return currentTransform.applyY((i + 1) * groupSpacing);
  }

  function getGroupLabelTransform(g, i) {
    var scale = currentTransform.k;
    if (scale > groupLabelMaxScale) {
      scale = groupLabelMaxScale;
    }
    return `translate(0, ${getGroupStartY(g, i)}) scale(${scale})`;
  }
}

// function getGroupRulerY1(d, i) {
//   return i * groupHeight;
// }

// function getGroupRulerY2(d, i) {
//   return (i + 1) * groupHeight;
// }

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

// function getGroupRulerTransform(name, i) {
//   return `translate(${groupHeight * i}, 0)`;
// }

module.exports = RenderActivityView;
