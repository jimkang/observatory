var time = require('d3-time');
var probable = require('probable');

const activityFillHueA = probable.roll(360);
const activityFillHueB = activityFillHueA + 40 % 360;
const activityColorA = `hsl(${activityFillHueA}, 50%, 50%, 0.3)`;
const activityColorB = `hsl(${activityFillHueB}, 50%, 50%, 0.3)`;
const dayInMS = 24 * 60 * 60 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - dayInMS);

// Expects timeScale to already have zoom transformation
// applied to it.
function renderActivityGroups({
  activityGroupData,
  timeScale,
  ctx,
  currentTransform,
  baseGroupSpacing
}) {
  var dayLength = timeScale(today) - timeScale(yesterday);
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
      var x = getActivityX(activity);
      ctx.fillStyle = i % 2 === 0 ? activityColorA : activityColorB;
      ctx.fillRect(x, y, dayLength, dayLength);
    }
  }

  function getActivityX(d) {
    return timeScale(time.timeDay.floor(d.committedDate));
  }

  function getLastActiveX(group) {
    return timeScale(group.lastActiveDate);
  }

  function getStartDateX(group) {
    return timeScale(group.startDate);
  }
}

module.exports = renderActivityGroups;
