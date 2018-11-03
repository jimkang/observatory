var findWhere = require('lodash.findwhere');
var pluck = require('lodash.pluck');
var curry = require('lodash.curry');

function mergeYearKits(yearKitsForSorts) {
  var years = getPropsInAllSorts('year', yearKitsForSorts);
  var mergedKits = years.map(mergeKitsForYears);
  return mergedKits;

  function mergeKitsForYears(year) {
    var months = getMonthsInYearForAllSorts(year, yearKitsForSorts);
    return {
      year,
      monthKits: months.map(curry(mergeKitsForMonths)(year))
    };
  }

  function mergeKitsForMonths(year, month) {
    var mergedMonthKit = { month, projectsBySort: {} };
    for (var sort in yearKitsForSorts) {
      let yearKits = yearKitsForSorts[sort];
      let yearKit = findWhere(yearKits, { year });
      let monthKit = findWhere(yearKit.monthKits, { month });
      mergedMonthKit.projectsBySort[sort] = monthKit ? monthKit.projects : [];
    }
    return mergedMonthKit;
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

