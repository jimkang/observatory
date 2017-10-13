var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
var countDeedsInProjects = require('../count-deeds-in-projects');
var gardenEmoji = require('../garden-emoji');
// var throttle = require('lodash.throttle');
var GetEvenIndexForString = require('../get-even-index-for-string');
var EaseThrottle = require('../ease-throttle');
var Zoom = require('d3-zoom').zoom;

const devicePixelRatio = window.devicePixelRatio || 1;
const widthLimit = 800;
// var idKey = accessor();
// var nameKey = accessor('name');
// var messageKey = accessor('message');
var deedsKey = GetPropertySafely('deeds', []);
// TODO: This shuffling should be done in the build step, or in Megaswatch.
var gardenColors = reorderByBucket(require('./garden-colors.json'), 9);
// console.log('gardenColors', JSON.stringify(gardenColors));
var getColorIndexForString = GetEvenIndexForString({arrayLength: gardenColors.length});
var getEmojiIndexForString = GetEvenIndexForString({arrayLength: gardenEmoji.length});

// const aYearInMilliseconds = 31536000000;

// var firstRender = true;

// const heightToDeedRatio = 3/2;
const cellLength = 40;
const squarePixelAreaPerDeed = cellLength * cellLength;
// const minimumArea = squarePixelAreaPerDeed * 100;
const xLabelMargin = 10;
const yLabelMargin = 10;
const labelYOffsetProportion = 0.25;
const labelXOffsetProportion = 0.25;

// var plantLayer = d3.select('#garden-board .plant-layer');
// var regionLayer = d3.select('#garden-board .region-layer');
// var labelLayer = d3.select('#garden-board .field-label-layer');
var gardenBoard = d3.select('#garden-board');
var gardenContext = gardenBoard.node()
  .getContext('2d', {alpha: false});
// var gardenZoomContainer = d3.select('#garden-zoom-container');

// var zoom = Zoom();
// zoom.on('zoom', applyTransformToZoomContainer);
// gardenBoard.call(zoom);

var treemap;

function renderGarden({
  projectData, onDeedClick, expensiveRenderIsOK, shouldRenderPlants}) {

  var width = 0;
  var height = 0;

  if (!treemap || expensiveRenderIsOK) {
    let neededArea = countDeedsInProjects(projectData) * squarePixelAreaPerDeed;
    width = gardenBoard.node().getBoundingClientRect().width;
    if (width > widthLimit) {
      width = widthLimit;
    }
    height = ~~(neededArea/width);

    // width *= devicePixelRatio;
    // height *= devicePixelRatio;
    // gardenContext.scale(devicePixelRatio, devicePixelRatio);

    // console.log('height', height)
    gardenBoard.attr('width', width);
    gardenBoard.attr('height', height);

    treemap = hierarchy.treemap()
      .tile(hierarchy.treemapResquarify.ratio(1))
      .size([width, height])
      .round(true)
      .paddingInner(0);
  }

  d3.selectAll('.view-root:not(#garden-board)').classed('hidden', true);
  gardenBoard.classed('hidden', false);

  var rootData = {
    name: 'root',
    deeds: projectData
  };

  var root = hierarchy.hierarchy(rootData, deedsKey)
      .sum(sumBySize);

  treemap(root);

  d3.select('body').classed('garden', shouldRenderPlants);

  gardenContext.clearRect(0, 0, width, height);

  if (!shouldRenderPlants) {
    renderProjectRegions(root);
  }
  renderDeedCells(root, getDataFromNodeToHandler, shouldRenderPlants);
  renderProjectLabels(root, expensiveRenderIsOK);

  function getDataFromNodeToHandler(d) {
    onDeedClick({deed: d.data, project: d.parent.data});
  }
}

function renderProjectRegions(root) {
  gardenContext.fillStyle = '#eee';
  root.children.forEach(drawRegion);

  function drawRegion(region) {
    gardenContext.fillRect(
      region.x0, region.y0, getRegionWidth(region), getRegionHeight(region)
    );
  }
  // var projectRegions = regionLayer.selectAll('.project-region')
  //   .data(root.children, getNestedId);

  // projectRegions.exit().remove();

  // var newRegions = projectRegions.enter()
  //   .append('rect')
  //     .classed('project-region', true)
  //     .attr('fill', 'hsla(0, 0%, 100%, 0.3)')
  //     .attr('stroke', 'black')
  //     .attr('stroke-width', 1);

  // var updateRegions = projectRegions.merge(newRegions);

  // updateRegions
  //   .attr('x', accessor('x0'))
  //   .attr('y', accessor('y0'))
  //   .attr('width', getRegionWidth)
  //   .attr('height', getRegionHeight);
}

function renderProjectLabels(root, expensiveRenderIsOK) {
  const initialFontSize = 48;
  gardenContext.font = initialFontSize + 'px futura';
  gardenContext.textAlign = 'center';
  gardenContext.textBaseline = 'middle';
  gardenContext.fillStyle = '#333';

  root.children.forEach(renderLabel);

  // if (expensiveRenderIsOK) {
  //   root.children.forEach
  // }

  // TODO: Use canvas to calculate, but actually render in crisp SVG.
  function renderLabel(region) {
    var regionName = getNestedName(region);
    var maxWidth = getRegionWidth(region) - 2* xLabelMargin;
    var maxHeight = getRegionHeight(region) - 2 * yLabelMargin;
    var textWidth = gardenContext.measureText(regionName).width;

    if (textWidth > 0) {
      gardenContext.save();
      gardenContext.translate(
        ~~(region.x0 + maxWidth/2) + 0.5,
        ~~(region.y0 + maxHeight/2) + 0.5
      );
      let scale = 1.0;

      if (maxWidth < maxHeight) {
        // Rotate -90.
        gardenContext.rotate(-Math.PI/2);

        if (textWidth > maxHeight) {
          scale = maxHeight/textWidth;
        }
      }
      else if (textWidth > maxWidth) {
        scale = maxWidth/textWidth;
      }

      if (scale !== 1.0) {
        gardenContext.font = ~~(initialFontSize * scale) + 'px futura';
      }

      // if (maxWidth < maxHeight) {
      //   xTranslateOffset = currentHeight * scale * labelXOffsetProportion;
      // }
      // else {
      //   yTranslateOffset = currentHeight * scale * labelYOffsetProportion;
      // }
      
      gardenContext.fillText(regionName, 0, 0);
      gardenContext.restore();
    }
  }
}

function renderDeedCells(root, onDeedClick, shouldRenderPlants) {
  // console.log('rendering', root.leaves().length, 'deeds');
  gardenContext.strokeStyle = 'white';
  gardenContext.lineWidth = 1;

  root.leaves().forEach(drawDeedCell);

  function drawDeedCell(cell) {
    gardenContext.fillStyle = deedColor(cell);
    var width = getRegionWidth(cell);
    var height = getRegionHeight(cell);
    gardenContext.fillRect(cell.x0, cell.y0, width, height);
    gardenContext.strokeRect(cell.x0 + 0.5, cell.y0 + 0.5, width, height);
  }
}

function sumBySize() {
  // if (d.deeds) {
  //   return d.deeds.length;
  // }
  // else {
  return 1;
  // }
}

function getNestedId(d) {
  return d.data.id;
}

function getNestedName(d) {
  return d.data.name;
}

function getRegionWidth(d) {
  return d.x1 - d.x0;
}

function getRegionHeight(d) {
  return d.y1 - d.y0;
}

function getLabelTransform(d) {
  var x = d.x0 + (d.x1 -  d.x0)/2;
  var y = d.y0 + (d.y1 - d.y0)/2;
  var maxWidth = getRegionWidth(d) - xLabelMargin;
  var maxHeight = getRegionHeight(d) - yLabelMargin;

  var currentWidth = this.getBBox().width;
  var currentHeight = this.getBBox().height;
  var xScale;
  var yScale;
  var xTranslateOffset = 0;
  var yTranslateOffset = 0;
  var scale = 1.0;
  var rotation = 0;

  if (currentWidth > 0 && currentHeight > 0) {
    if (maxWidth < maxHeight) {
      rotation = -90;

      xScale = maxHeight/currentWidth;
      yScale = maxWidth/currentHeight;
    }
    else {
      xScale = maxWidth/currentWidth;
      yScale = maxHeight/currentHeight;
    }
    scale = xScale < yScale ? xScale : yScale;

    if (maxWidth < maxHeight) {
      xTranslateOffset = currentHeight * scale * labelXOffsetProportion;
    }
    else {
      yTranslateOffset = currentHeight * scale * labelYOffsetProportion;
    }
  }

  return `translate(${x + xTranslateOffset} ${y + yTranslateOffset})
    rotate(${rotation}) scale(${scale}, ${scale})`;
}

// function exitCellIsAProject(exitingCell) {
//   if (!exitingCell.data.pushedAt) {
//     console.log('exiting cell is not a project!', exitingCell);
//     return false;
//   }
//   return true;
// }

function projectColor(d) {
  if (d.data.id) {
    return gardenColors[getColorIndexForString(d.data.id)];
  }
  else {
    return '#fff';
  }
}

function deedColor(d) {
  return projectColor(d.parent);
}

function getPlantEmoji(d) {
  if (d.parent && d.parent.data && d.parent.data.id) {
    let emojiIndex = getEmojiIndexForString(d.parent.data.id);
    return gardenEmoji[emojiIndex];
  }
  else {
    return '';
  }
}

// 0-second old deeds will bright. Older deeds will be less opaque.
// function deedOpacity(d) {
//   var age = (new Date()).getTime() - (new Date(d.data.committedDate)).getTime();
//   var alpha = age/(6 * aYearInMilliseconds);
//   if (alpha > 1.0) {
//     alpha = 1.0;
//   }
//   return 1.0 - alpha;
// }

// Reordering the color array by buckets is a way of making sure adjacent hues
// are separated.
function reorderByBucket(array, numberOfBuckets) {
  var reconstituted = [];
  const bucketSize = ~~(array.length/numberOfBuckets);
  for (var i = 0; i < array.length; ++i) {
    var reconstitutedIndex = (i % numberOfBuckets) * bucketSize + ~~(i/numberOfBuckets);
    if (reconstitutedIndex >= array.length) {
      break;
    }
    else {
      reconstituted[reconstitutedIndex] = array[i];
    }
  }
  return reconstituted;
}

// var throttleTime = 300;

// if (gardenBoard.node().getBoundingClientRect().width < 568) {
  // throttleTime = 2000;
// }

function applyTransformToZoomContainer() {
  gardenZoomContainer.attr('transform', d3.event.transform);
}

module.exports = EaseThrottle({fn: renderGarden});
