var GetEvenIndexForString = require('../get-even-index-for-string');

var gardenColors = reorderByBucket(require('./garden-colors.json'), 9);

var getColorIndexForString = GetEvenIndexForString({
  arrayLength: gardenColors.length,
});

// Reordering the color array by buckets is a way of making sure adjacent hues
// are separated.
function reorderByBucket(array, numberOfBuckets) {
  var reconstituted = [];
  const bucketSize = ~~(array.length / numberOfBuckets);
  for (var i = 0; i < array.length; ++i) {
    var reconstitutedIndex =
      (i % numberOfBuckets) * bucketSize + ~~(i / numberOfBuckets);
    if (reconstitutedIndex >= array.length) {
      break;
    } else {
      reconstituted[reconstitutedIndex] = array[i];
    }
  }
  return reconstituted;
}

function getGardenColorForProject(d) {
  var id = d.id;
  if (d.data) {
    id = d.data.id;
  }
  if (id) {
    return gardenColors[getColorIndexForString(id)];
  } else {
    return '#fff';
  }
}

module.exports = getGardenColorForProject;
