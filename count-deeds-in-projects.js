function countDeedsInProjects(projects) {
  if (projects.length > 0) {
    return projects.map(countDeedsInProject).reduce(addToTotal);
  } else {
    return 0;
  }
}

function countDeedsInProject(p) {
  return p.deeds ? p.deeds.length : 0;
}

function addToTotal(total, length) {
  return total + length;
}

module.exports = countDeedsInProjects;
