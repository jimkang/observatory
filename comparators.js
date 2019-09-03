function compareLastUpdatedDesc(projectA, projectB) {
  if (new Date(projectA.pushedAt) > new Date(projectB.pushedAt)) {
    return -1;
  } else {
    return 1;
  }
}

function compareActivityGroupStartDateDesc(a, b) {
  if (new Date(a.startDate) > new Date(b.startDate)) {
    return -1;
  } else {
    return 1;
  }
}

function compareActivityGroupStartDateAsc(a, b) {
  if (!a.startDate) {
    console.log(a.name, 'has no startDate');
    return 1;
  }
  if (!b.startDate) {
    console.log(b.name, 'has no startDate');
    return 1;
  }
  if (new Date(a.startDate) < new Date(b.startDate)) {
    return -1;
  } else {
    return 1;
  }
}

function compareDesc(keyA, keyB) {
  if (keyA < keyB) {
    return 1;
  } else {
    return -1;
  }
}

function compareDescWithSortKey(sortBy, objectA, objectB) {
  if (objectA[sortBy] < objectB[sortBy]) {
    return 1;
  } else {
    return -1;
  }
}

// Put featured projects at the top.
function compareDescShippedAndFeaturedStatus(objectA, objectB) {
  if (
    objectA.featuredStatus === 'featured' &&
    objectB.featuredStatus !== 'featured'
  ) {
    return -1;
  }
  if (
    objectA.featuredStatus !== 'featured' &&
    objectB.featuredStatus === 'featured'
  ) {
    return 1;
  }

  if (objectA.shippedDate < objectB.shippedDate) {
    return 1;
  } else {
    return -1;
  }
}
// A little biased in favor of projectB.
function compareByDeedCountAsc(projectA, projectB) {
  if (
    projectA.deeds &&
    projectB.deeds &&
    projectA.deeds.length < projectB.deeds.length
  ) {
    return -1;
  }
  return 1;
}

module.exports = {
  compareLastUpdatedDesc,
  compareActivityGroupStartDateDesc,
  compareActivityGroupStartDateAsc,
  compareDesc,
  compareDescWithSortKey,
  compareByDeedCountAsc,
  compareDescShippedAndFeaturedStatus
};
