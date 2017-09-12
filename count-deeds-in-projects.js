function countDeedsInProjects(projects) {
  return projects.map(countDeedsInProject).reduce(addToTotal);
}

function countDeedsInProject(p) {
  return p.deeds ? p.deeds.length : 0;
}

function addToTotal(total, length) {
  return total + length;
}

module.exports = countDeedsInProjects;
