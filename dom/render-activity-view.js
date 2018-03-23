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
var timeFormat = require('d3-time-format').timeFormat;
var curry = require('lodash.curry');
var probable = require('probable');

const yearBlockColor1 = '#fff';
// hsl(108, 10%, 90%)
const yearBlockColor2 = `hsl(${probable.roll(360)}, 10%, 90%)`;

const groupLabelMaxScale = 4;
const maxYearLabelFontSize = 8; // in em.
const dayWidth = 20;
const groupHeight = dayWidth * 2;

// const horizontalRuleYWithinGroup = dayWidth;
// const labelTextX = -dayWidth;
const activitySize = dayWidth / 2;
// Center the square in the middle of the group.
// const activityYWithinGroup = groupWidth / 2 - activitySize / 2;
// const dateTickLength = dayWidth;

const dayInMS = 24 * 60 * 60 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - dayInMS);

var formatMillisecond = timeFormat('.%L'),
  formatSecond = timeFormat(':%S'),
  formatMinute = timeFormat('%I:%M'),
  formatHour = timeFormat('%I %p'),
  formatDay = timeFormat('%a %d'),
  formatWeek = timeFormat('%b %d'),
  formatMonth = timeFormat('%B'),
  formatYear = timeFormat('%Y');

var activityContainer = d3.select('#activity-container');
var labelBoard = d3.select('#label-board');
var activityGroupRoot = d3.select('#activity-groups');
var fixedXRoot = labelBoard.select('.fixed-x-labels');
var fixedYRoot = labelBoard.select('.fixed-y-labels');
var dateLabels = fixedYRoot.select('.date-labels');
var yearLabels = fixedYRoot.select('.year-labels');
var targetsCanvas = d3.select('#activities-targets-canvas');
var aCtx = d3
  .select('#activities-canvas')
  .node()
  .getContext('2d', { alpha: true });

const groupLabelY = labelBoard.attr('height') / 2;
const timeRulerX = 0; //labelBoard.attr('width') / 2;

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
    // console.log('totalDateSpan', totalDaysSpan);
    // TODO: Display totalDateSpan somewhere.
    var graphHeight = labelBoard.attr('height');
    var graphWidth = labelBoard.attr('width');

    // labelBoard.attr('height', activityGroupData.length * groupWidth);
    // labelBoard.attr('width', graphHeight);

    timeScale = scale
      .scaleTime()
      .domain([latestActivityDate, earliestActivityDate])
      // .range([0, totalDaysSpan * activitySize])
      .range([0, graphWidth]);
    zoomedTimeScale = timeScale;

    setUpZoom(draw);
    draw();

    function draw() {
      aCtx.clearRect(0, 0, graphWidth, graphHeight);

      renderTimeRulers({ timeScale, graphWidth, graphHeight });
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
  timeScale,
  graphWidth,
  graphHeight
}) {
  var dayWidth = currentTransform.k * activitySize;//  zoomedTimeScale(today) - zoomedTimeScale(yesterday);
  aCtx.strokeStyle = 'red';
  // TODO: Don't let this change every render; avoid flashing.
  var activityFillHueA = probable.roll(360);
  var activityFillHueB = (activityFillHueA) + 40 % 360;
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
        groupHeight * groupIndex
      ])
    );
    aCtx.lineTo.apply(
      aCtx,
      currentTransform.apply([
        getStartDateX(activityGroup),
        groupHeight * groupIndex
      ])
    );

    function renderActivity(activity, i) {
      // TODO: Go back to trying to make these squares, see if that makes
      // zoom more natural.
      var x = currentTransform.applyX(getActivityX(activity));
      var y = currentTransform.applyY(groupHeight * groupIndex);
      var activityHeight = currentTransform.k * groupHeight;
      aCtx.fillStyle = `hsl(${i % 2 === 0 ? activityFillHueA : activityFillHueB }, 50%, 50%)`;

      aCtx.fillRect(x, y, dayWidth, activityHeight);
      // aCtx.strokeRect(x, y, dayWidth, activityHeight);
    }
  }
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

function renderTimeRulers({ graphWidth, graphHeight }) {
  zoomedTimeScale.range([0, graphWidth]);
  // zoomedTimeScale.domain(zoomedTimeScale.invert(0), zoomedTimeScale.invert(graphWidth));
  var tickDates = zoomedTimeScale.ticks(); //time.timeMonth.every(1));
  // If we're zoomed out far enough that the ticks are years, don't show them.
  // The year blocks take care of that.
  if (tickDates.length < 1 || time.timeYear(tickDates[0]) >= tickDates[0]) {
    tickDates = [];
  }
  var tickYears = zoomedTimeScale.ticks(time.timeYear.every(1));
  var yearWidth = graphWidth;
  if (tickYears.length > 1) {
    yearWidth = zoomedTimeScale(tickYears[1]) - zoomedTimeScale(tickYears[0]);
  }

  tickYears.forEach(curry(drawYearBlock)(yearWidth));

  // weekRuler.attr('transform', 'translate(300, 0)');
  // yearRuler.attr('transform', 'translate(300, 0)');
  aCtx.strokeStyle = '#666';
  aCtx.lineWidth = 1;
  aCtx.beginPath();
  tickDates.forEach(drawDateTick);
  aCtx.stroke();

  var tickTexts = dateLabels.selectAll('text').data(tickDates);
  tickTexts.exit().remove();
  tickTexts
    .enter()
    .append('text')
    .attr('y', graphHeight / 8)
    .merge(tickTexts)
    .attr('x', zoomedTimeScale)
    .text(multiFormat);

  var yearLabelFontSize = 2 * currentTransform.k;
  if (yearLabelFontSize > maxYearLabelFontSize) {
    yearLabelFontSize = maxYearLabelFontSize;
  }
  var yearTexts = yearLabels.selectAll('text').data(tickYears);
  yearTexts.exit().remove();
  yearTexts
    .enter()
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -graphHeight / 2) // Because we're rotated, this is the vertical position.
    .merge(yearTexts)
    .attr('y', getYearLabelHorizontalPosition)
    .attr('font-size', `${yearLabelFontSize}em`)
    .text(formatYear);

  function drawDateTick(date) {
    var x = zoomedTimeScale(date);
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, graphHeight / 8);
  }

  function drawYearBlock(blockWidth, date) {
    aCtx.fillStyle = date.getFullYear() % 2 ? yearBlockColor1 : yearBlockColor2;
    aCtx.fillRect(zoomedTimeScale(date), 0, blockWidth, graphHeight);
  }

  function getYearLabelHorizontalPosition(date) {
    return zoomedTimeScale(date) - currentTransform.k * graphWidth / 18;
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

// function getGroupRulerTransform(name, i) {
//   return `translate(${groupHeight * i}, 0)`;
// }

// Don't format years; leave that up to the year blocks.
function multiFormat(date) {
  return (time.timeSecond(date) < date
    ? formatMillisecond
    : time.timeMinute(date) < date
      ? formatSecond
      : time.timeHour(date) < date
        ? formatMinute
        : time.timeDay(date) < date
          ? formatHour
          : time.timeMonth(date) < date
            ? time.timeWeek(date) < date ? formatDay : formatWeek
            : formatMonth)(date);
}

module.exports = RenderActivityView;
