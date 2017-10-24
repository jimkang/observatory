var d3 = require('d3-selection');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
var countDeedsInProjects = require('../count-deeds-in-projects');
var GetEvenIndexForString = require('../get-even-index-for-string');
var EaseThrottle = require('../ease-throttle');

const widthLimit = 800;
var deedsKey = GetPropertySafely('deeds', []);
// TODO: This shuffling should be done in the build step, or in Megaswatch.
var gardenColors = reorderByBucket(require('./garden-colors.json'), 9);
var getColorIndexForString = GetEvenIndexForString({arrayLength: gardenColors.length});

const cellLength = 40;
const squarePixelAreaPerDeed = cellLength * cellLength;
const xLabelMargin = 10;
const yLabelMargin = 10;
const initialFontSize = 48;

var trackingColorer = TrackingColorer();

var labelLayer = d3.select('.field-label-layer');
var canvasesContainer = d3.select('#canvases-container');
var gardenContainer = d3.select('#garden-container');
var gardenBoard = d3.select('#garden-board');
var gardenTargetsBoard = d3.select('#garden-targets-board');
var gardenBoardLabels = d3.select('#garden-board-labels');
var gardenContext = gardenBoard.node()
  .getContext('2d', {alpha: false});
var gardenTargetsContext = gardenTargetsBoard.node()
  .getContext('2d', {alpha: false});

var treemap;

function renderGarden({projectData, onDeedClick, expensiveRenderIsOK}) {
  var width = 0;
  var height = 0;

  if (!treemap || expensiveRenderIsOK) {
    let neededArea = countDeedsInProjects(projectData) * squarePixelAreaPerDeed;
    width = document.body.getBoundingClientRect().width;

    if (width > widthLimit) {
      width = widthLimit;
    }
    height = ~~(neededArea/width);

    gardenContainer.style('width', width);
    gardenContainer.style('height', height);
    canvasesContainer.style('width', width);
    canvasesContainer.style('height', height);
    gardenBoard.attr('width', width);
    gardenBoard.attr('height', height);
    gardenBoardLabels.attr('width', width);
    gardenBoardLabels.attr('height', height);
    gardenTargetsBoard.attr('width', width);
    gardenTargetsBoard.attr('height', height);

    gardenTargetsBoard.on('click', onTargetBoardClick);

    treemap = hierarchy.treemap()
      .tile(hierarchy.treemapResquarify.ratio(1))
      .size([width, height])
      .round(true)
      .paddingInner(0);
  }

  d3.selectAll('.view-root:not(#garden-container)').classed('hidden', true);
  gardenContainer.classed('hidden', false);

  var rootData = {
    name: 'root',
    deeds: projectData
  };

  var root = hierarchy.hierarchy(rootData, deedsKey)
      .sum(sumBySize);

  treemap(root);

  gardenContext.clearRect(0, 0, width, height);
  gardenTargetsContext.clearRect(0, 0, width, height);

  renderProjectRegions(root);
  renderDeedCells(root);
  calculateProjectLabelPositions(root);
  renderProjectLabels(root);

  function onTargetBoardClick() {
    var mouseX = d3.event.layerX;
    var mouseY = d3.event.layerY;

    var imageData = gardenTargetsContext.getImageData(mouseX, mouseY, 1, 1).data;
    var cell = trackingColorer.getCellForImageData(imageData);
    onDeedClick({deed: cell.data, project: cell.parent.data});
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
}

function calculateProjectLabelPositions(root) {
  gardenContext.font = initialFontSize + 'px futura';
  gardenContext.textAlign = 'center';
  gardenContext.textBaseline = 'middle';

  root.children.forEach(calculateLabelPositionOnCanvas);
}

function calculateLabelPositionOnCanvas(region) {
  var regionName = getNestedName(region);
  var maxWidth = getRegionWidth(region) - 2* xLabelMargin;
  var maxHeight = getRegionHeight(region) - 2 * yLabelMargin;
  var textWidth = gardenContext.measureText(regionName).width;

  if (textWidth > 0) {
    let labelDisplayDetails = {};
    // Note: Some amount canvas to svg fudge is built into field-label-layer's transform.
    labelDisplayDetails.center = {
      x: ~~(region.x0 + maxWidth/2) + 0.5 + xLabelMargin,
      y: ~~(region.y0 + maxHeight/2) + 0.5 + yLabelMargin
    };
    labelDisplayDetails.rotation = 0;
    let scale = 1.0;

    if (maxWidth < maxHeight) {
      labelDisplayDetails.rotation = -90;

      if (textWidth > maxHeight) {
        scale = maxHeight/textWidth;
      }
    }
    else if (textWidth > maxWidth) {
      scale = maxWidth/textWidth;
    }

    // Font is assumed to be Futura.
    labelDisplayDetails.fontSize = 48;
    if (scale !== 1.0) {
      labelDisplayDetails.fontSize = ~~(initialFontSize * scale); 
    }
    region.labelDisplayDetails = labelDisplayDetails;
  }
}

function renderProjectLabels(root) {
  var labels = labelLayer.selectAll('.label')
    .data(root.children, getNestedId);

  labels.exit().remove();
  
  var newLabels = labels.enter().append('text')
    .classed('label', true)
    .attr('text-anchor', 'middle');

  var updateLabels = labels.merge(newLabels);
  updateLabels.text(getNestedName);
  updateLabels.style('font-size', getFontSize);
  updateLabels.attr('transform', getLabelTransform);
}

function renderDeedCells(root) {
  gardenContext.strokeStyle = 'white';
  gardenContext.lineWidth = 1;

  root.leaves().forEach(drawDeedCell);

  function drawDeedCell(cell) {
    gardenContext.fillStyle = deedColor(cell);
    var width = getRegionWidth(cell);
    var height = getRegionHeight(cell);
    // gardenContext.fillRect(cell.x0, cell.y0, width, height);
    // gardenContext.strokeRect(cell.x0 + 0.5, cell.y0 + 0.5, width, height);
    gardenContext.beginPath();
    gardenContext.arc(
      ~~(cell.x0 + width/2),
      ~~(cell.y0 + height/2),
      width < height ? width/2 : height/2,
      0,
      2 * Math.PI,
      true
    );
    gardenContext.closePath();
    gardenContext.fill();

    gardenTargetsContext.fillStyle = trackingColorer.getTrackingColorForCell(cell);
    gardenTargetsContext.fillRect(cell.x0, cell.y0, width, height);
  }
}

function sumBySize() {
  return 1;
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
  return `translate(${d.labelDisplayDetails.center.x} ${d.labelDisplayDetails.center.y})
    rotate(${d.labelDisplayDetails.rotation})`;
}

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

function TrackingColorer() {
  var nextColor = 0;

  var cellsForTrackingColors = {};

  return {
    getTrackingColorForCell,
    getCellForImageData
  };

  function getTrackingColorForCell(cell) {
    if (!cell.trackingColor) {
      cell.trackingColor = getNextColor();
      cellsForTrackingColors[cell.trackingColor] = cell;
    }
    return cell.trackingColor;
  }

  function getCellForImageData(imageData) {
    return cellsForTrackingColors[
      '#' +
      leftPad((imageData[0]).toString(16), 2) +
      leftPad((imageData[1]).toString(16), 2) +
      leftPad((imageData[2]).toString(16), 2)
    ];
  }

  // Note: If there's more than 0xFFFFFF cells, this won't work.
  function getNextColor() {
    var nextColorString = '#' + leftPad((nextColor).toString(16), 6);
    nextColor += 1;
    return nextColorString;
  }
}

// 😎
function leftPad(numberString, desiredLength) {
  var padsNeeded = desiredLength - numberString.length;
  var pads = '';
  for (var i = 0; i < padsNeeded; ++i) {
    pads += '0';
  }
  return pads + numberString;
}

function getFontSize(region) {
  return region.labelDisplayDetails.fontSize;
}

module.exports = EaseThrottle({fn: renderGarden});
