function formatProjectIntoActivityGroup(project) {
  var activityGroup = {
    id: project.id,
    name: project.name,
    description: project.description
  };

  if (project.deeds) {
    activityGroup.activities = project.deeds.map(makeActivity);
    activityGroup.activities.sort(aIsEarlierThanB);
    console.log(activityGroup.activities);
  }
  return activityGroup;
}

function makeActivity(deed) {
  return {
    id: deed.id,
    message: deed.message,
    committedDate: deed.committedDate,
  };
}

function aIsEarlierThanB(a, b) {
  if (new Date(a.committedDate) < new Date(b.committedDate)) {
    return -1;
  } else {
    return 1;
  }
}

module.exports = formatProjectIntoActivityGroup;
