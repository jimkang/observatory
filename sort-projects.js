// Warning: mutates projectData.
function sortProjects({ projectData, sortCriterion, desc = true }) {
  // If we are sorting in descending order, then if A is less than B,
  // A should go after B. So, we return a positive number to indicate that.
  const aLessThanBOrder = desc ? 1 : -1;
  const bLessThanAOrder = desc ? -1 : 1;

  var sorted = projectData;
  if (sortCriterion) {
    sorted = projectData.sort(compare);
  }
  return sorted;

  // Undefined values always count as "less" than whatever
  // they're being compared to.
  function compare(projectA, projectB) {
    const a = projectA[sortCriterion.name];
    const b = projectB[sortCriterion.name];
    if (a === undefined) {
      return aLessThanBOrder;
    } else if (b === undefined) {
      return bLessThanAOrder;
    } else if (a < b) {
      return aLessThanBOrder;
    } else {
      return bLessThanAOrder;
    }
  }
}

module.exports = sortProjects;
