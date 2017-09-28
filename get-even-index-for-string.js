// Tries to provide a unique index for every string it is given, and
// always returns the same index for the same string.
// If it is asked for more indexes for strings than there are array positions,
// it looks around.

function GetEvenIndexForString({arrayLength}) {
  var nextIndex = 0;
  var indexesForStrings = {};
  return getEvenIndexForString;

  function getEvenIndexForString(s) {
    if (!(s in indexesForStrings)) {
      indexesForStrings[s] = nextIndex;
      nextIndex += 1;
      if (nextIndex >= arrayLength) {
        nextIndex = 0;
      }
    }
    return indexesForStrings[s];
  }
}

module.exports = GetEvenIndexForString;
