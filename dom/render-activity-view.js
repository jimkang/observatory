var d3 = require('d3-selection');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var scale = require('d3-scale');
var time = require('d3-time');
var Zoom = require('d3-zoom');
var comparators = require('../comparators');
var renderTimeRuler = require('./render-time-ruler');
var renderGroupRulers = require('./render-group-rulers');
var probable = require('probable');

const activityFillHueA = probable.roll(360);
const activityFillHueB = activityFillHueA + 40 % 360;
const activityColorA = `hsl(${activityFillHueA}, 50%, 50%, 0.3)`;
const activityColorB = `hsl(${activityFillHueB}, 50%, 50%, 0.3)`;

const baseDayLength = 40;
const baseGroupSpacing = baseDayLength * 2;

const dayInMS = 24 * 60 * 60 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - dayInMS);

var activityContainer = d3.select('#activity-container');
var labelBoard = d3.select('#label-board');
var fixedXRoot = labelBoard.select('.fixed-x-labels');
var targetsCanvas = d3.select('#activities-targets-canvas');
var aCtx = d3
  .select('#activities-canvas')
  .node()
  .getContext('2d', { alpha: true });

var currentTransform = Zoom.zoomIdentity;
var timeScale;
var zoomedTimeScale;

function setUpZoom(draw) {
  var zoom = Zoom.zoom()
    .scaleExtent([0.03, 500])
    .on('zoom', zoomed);

  targetsCanvas.call(zoom);

  function zoomed() {
    currentTransform = d3.event.transform;
    zoomedTimeScale = currentTransform.rescaleX(timeScale);
    draw();
  }
}

function RenderActivityView() {
  return EaseThrottle({ fn: renderActivityView });

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

    var totalDaysSpan =
      (latestActivityDate.getTime() - earliestActivityDate.getTime()) / dayInMS;
    // TODO: Display totalDateSpan somewhere.
    var graphHeight = labelBoard.attr('height');
    var graphWidth = labelBoard.attr('width');

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
        graphWidth,
        ctx: aCtx,
        currentTransform,
        baseGroupSpacing,
        fixedXRoot
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
}) {
  var dayLength = zoomedTimeScale(today) - zoomedTimeScale(yesterday);
  aCtx.strokeStyle = 'red';
  aCtx.beginPath();
  activityGroupData.forEach(renderGroup);
  aCtx.stroke();

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
      var x = getActivityX(activity);
      var y = currentTransform.applyY(baseGroupSpacing * groupIndex);
      aCtx.fillStyle = i % 2 === 0 ? activityColorA : activityColorB;
      aCtx.fillRect(x, y, dayLength, dayLength);
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

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

module.exports = RenderActivityView;
