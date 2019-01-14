var time = require('d3-time');
var curry = require('lodash.curry');
var d3 = require('d3-selection');
var timeFormat = require('d3-time-format').timeFormat;
var probable = require('probable');

var labelBoard = d3.select('#label-board');
var fixedYRoot = labelBoard.select('.fixed-y-labels');
var dateLabels = fixedYRoot.select('.date-labels');
var yearLabels = fixedYRoot.select('.year-labels');

var formatMillisecond = timeFormat('.%L');
var formatSecond = timeFormat(':%S');
var formatMinute = timeFormat('%I:%M');
var formatHour = timeFormat('%I %p');
var formatDay = timeFormat('%a %d');
var formatWeek = timeFormat('%b %d');
var formatMonth = timeFormat('%B');
var formatYear = timeFormat('%Y');

const yearBlockColor1 = '#fff';
const yearBlockColor2 = `hsl(${probable.roll(360)}, 10%, 90%)`;
const maxYearLabelFontSize = 8; // in em.

function renderTimeRuler({
  graphWidth,
  graphHeight,
  timeScale,
  currentTransform,
  ctx
}) {
  timeScale.range([0, graphWidth]);
  // timeScale.domain(timeScale.invert(0), timeScale.invert(graphWidth));
  var tickDates = timeScale.ticks(); //time.timeMonth.every(1));
  // If we're zoomed out far enough that the ticks are years, don't show them.
  // The year blocks take care of that.
  if (tickDates.length < 1 || time.timeYear(tickDates[0]) >= tickDates[0]) {
    tickDates = [];
  }
  var tickYears = timeScale.ticks(time.timeYear.every(1));
  var yearWidth = graphWidth;
  if (tickYears.length > 1) {
    yearWidth = timeScale(tickYears[1]) - timeScale(tickYears[0]);
  }

  tickYears.forEach(curry(drawYearBlock)(yearWidth));

  // weekRuler.attr('transform', 'translate(300, 0)');
  // yearRuler.attr('transform', 'translate(300, 0)');
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  tickDates.forEach(drawDateTick);
  ctx.stroke();

  var tickTexts = dateLabels.selectAll('text').data(tickDates);
  tickTexts.exit().remove();
  tickTexts
    .enter()
    .append('text')
    .attr('y', graphHeight / 8)
    .merge(tickTexts)
    .attr('x', timeScale)
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
    .attr('transform', 'rotate(90)')
    .attr('x', graphHeight / 2) // Because we're rotated, this is the vertical position.
    .merge(yearTexts)
    .attr('y', getYearLabelHorizontalPosition)
    .attr('font-size', `${yearLabelFontSize}em`)
    .text(formatYear);

  function drawDateTick(date) {
    var x = timeScale(date);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, graphHeight / 8);
  }

  function drawYearBlock(blockWidth, date) {
    ctx.fillStyle = date.getFullYear() % 2 ? yearBlockColor1 : yearBlockColor2;
    ctx.fillRect(timeScale(date), 0, blockWidth, graphHeight);
  }

  function getYearLabelHorizontalPosition(date) {
    return -timeScale(date); // - currentTransform.k * graphWidth / 18;
  }
  // console.log('start', timeScale.invert(0));
  // console.log('end', timeScale.invert(graphWidth));

  // var weekAxis = axis.axisBottom(timeScale);
  // weekAxis.ticks(time.timeWeek.every(1));
  // weekAxis.tickSize(dateTickLength);

  // var yearAxis = axis.axisBottom(timeScale);
  // yearAxis.ticks(time.timeYear.every(1));
  // yearAxis.tickFormat(timeFormat('%Y'));
  // yearAxis.tickSize(100);

  // weekRuler.call(weekAxis);
  // yearRuler.call(yearAxis);
}

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
    ? time.timeWeek(date) < date
      ? formatDay
      : formatWeek
    : formatMonth)(date);
}

module.exports = renderTimeRuler;
