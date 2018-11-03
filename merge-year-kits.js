var findWhere = require('lodash.findwhere');
var pluck = require('lodash.pluck');

function mergeYearKits(yearKitsForSorts) {
  var years = getPropsInAllSorts('year', yearKitsForSorts);
  years.forEach(mergeKitsForYears);
  return years;

  function mergeKitsForYears(year) {
    var months = getMonthsInYearForAllSorts(year, yearKitsForSorts);
    console.log('months', months);
  }
}

function getPropsInAllSorts(prop, propKitsForSorts) {
  var props = new Set();
  for (var sort in propKitsForSorts) {
    let propKits = propKitsForSorts[sort];
    propKits.forEach(addToSet);
  }
  return [...props];

  function addToSet(propKit) {
    props.add(propKit[prop]);
  }
}

function getMonthsInYearForAllSorts(year, yearKitsForSorts) {
  var months = new Set();
  for (var sort in yearKitsForSorts) {
    let yearKits = yearKitsForSorts[sort];
    let yearKit = findWhere(yearKits, { year });
    var monthValues  = pluck(yearKit.monthKits, 'month');
    monthValues.forEach(months.add.bind(months));
  }
  return [...months];
}

module.exports = mergeYearKits;

