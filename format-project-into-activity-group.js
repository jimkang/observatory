const dayInMS = 24 * 60 * 60 * 1000;

function formatProjectIntoActivityGroup(project, nowInEpochTime = Date.now()) {
  var activityGroup = {
    id: project.id,
    name: project.name,
    description: project.description,
    isExternal: project.isExternal,
    available: project.available,
    pushedAt: project.pushedAt
  };

  if (project.shippedDate) {
    activityGroup.shippedDate = new Date(project.shippedDate);
  }

  if (project.deeds && project.deeds.length > 0) {
    var activities = project.deeds.map(makeActivity);
    activities.sort(aIsEarlierThanB);
    activities[0].isStart = true;
    activities[activities.length - 1].isLastActive = true;

    activityGroup.startDate = activities[0].committedDate;
    activityGroup.lastActiveDate =
      activities[activities.length - 1].committedDate;
    activityGroup.ageInDays = Math.round(
      (nowInEpochTime - activityGroup.startDate.getTime()) / dayInMS
    );
    activityGroup.activitySpanInDays = getDifferenceInDays(
      activityGroup.lastActiveDate,
      activityGroup.startDate
    );
    activityGroup.activities = activities;
    // console.log(activityGroup.activities);
  }
  return activityGroup;
}

// Do we need activities? Can we just use deeds?
function makeActivity(deed) {
  return {
    id: deed.id,
    message: deed.message,
    committedDate: new Date(deed.committedDate)
  };
}

function aIsEarlierThanB(a, b) {
  if (new Date(a.committedDate) < new Date(b.committedDate)) {
    return -1;
  } else {
    return 1;
  }
}

function getDifferenceInDays(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / dayInMS);
}

module.exports = formatProjectIntoActivityGroup;
