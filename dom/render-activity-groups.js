//var time = require('d3-time');
var probable = require('probable');

const activityFillHueA = probable.roll(360);
const activityFillHueB = activityFillHueA + (40 % 360);
const activityColorA = `hsl(${activityFillHueA}, 50%, 50%, 0.3)`;
const activityColorB = `hsl(${activityFillHueB}, 50%, 50%, 0.3)`;
const dayInMS = 24 * 60 * 60 * 1000;
const today = new Date();
//const yesterday = new Date(today.getTime() - dayInMS);
const quarterYearInMS = dayInMS * 30 * 3;
const aQuarterYearAgo = new Date(today.getTime() - quarterYearInMS);

// Expects timeScale to already have zoom transformation
// applied to it.
function renderActivityGroups({
  activityGroupData,
  timeScale,
  ctx,
  currentTransform,
  baseGroupSpacing
}) {
  var ticks = timeScale.ticks();
  const maximumActivityLength = timeScale(today) - timeScale(aQuarterYearAgo);
  var activityLength = timeScale(ticks[1]) - timeScale(ticks[0]);

  const zoomedPastMaxActivityLength = activityLength > maximumActivityLength;
  if (zoomedPastMaxActivityLength) {
    activityLength = maximumActivityLength;
  }
  //var dayLength = timeScale(today) - timeScale(yesterday);
  ctx.strokeStyle = 'red';
  ctx.beginPath();
  activityGroupData.forEach(renderGroup);
  ctx.stroke();

  function renderGroup(activityGroup, groupIndex) {
    // console.log('draw group at', groupWidth * i, getLastActiveY(activityGroup), 'to', groupWidth * i, getStartDateY(activityGroup));
    var y = currentTransform.applyY(baseGroupSpacing * groupIndex);
    activityGroup.activities.forEach(renderActivity);
    ctx.moveTo(getLastActiveX(activityGroup), y);
    ctx.lineTo(getStartDateX(activityGroup), y);

    function renderActivity(activity, i) {
      if (activityIsInView(activity)) {
        let x = getActivityX(activity);
        ctx.fillStyle = i % 2 === 0 ? activityColorA : activityColorB;
        ctx.fillRect(x, y, activityLength, activityLength);
      }
    }
  }

  function getActivityX(d) {
    return timeScale(findTickFloor(d.committedDate));
  }

  function getLastActiveX(group) {
    return timeScale(group.lastActiveDate);
  }

  // There's only 10 ticks usually.
  function findTickFloor(date) {
    for (var i = ticks.length - 2; i > -1; --i) {
      if (date > ticks[i]) {
        if (zoomedPastMaxActivityLength) {
          return findSubTickFloor(
            date,
            ticks[i],
            ticks[i + 1],
            quarterYearInMS
          );
        } else {
          return ticks[i];
        }
      }
    }
  }

  function findSubTickFloor(date, tickStart, tickEnd, subdivisionSize) {
    var epochDate = date.getTime();
    for (
      var subTick = tickEnd.getTime();
      epochDate < subTick;
      subTick -= subdivisionSize
    );
    return new Date(subTick);
  }

  function activityIsInView(activity) {
    return (
      activity.committedDate >= ticks[0] &&
      activity.committedDate < ticks[ticks.length - 1]
    );
  }

  function getStartDateX(group) {
    return timeScale(group.startDate);
  }
}

module.exports = renderActivityGroups;
