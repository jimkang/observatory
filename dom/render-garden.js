var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
// var scale = require('d3-scale');
// var d3Format = require('d3-format');
// var d3Color = require('d3-color');
var interpolate = require('d3-interpolate');
var countDeedsInProjects = require('../count-deeds-in-projects');

// var idKey = accessor();
// var nameKey = accessor('name');
// var messageKey = accessor('message');
var deedsKey = GetPropertySafely('deeds', []);
var gardenColors = require('./garden-colors');
// var gardenColors = scale.schemeCategory20
const gardenColorsLength = gardenColors.length;

// const aYearInMilliseconds = 31536000000;

// var firstRender = true;

const width = 1000;
const heightToDeedRatio = 3/2;
const xLabelMargin = 10;
const yLabelMargin = 10;
const labelYOffsetProportion = 0.25;
const labelXOffsetProportion = 0.25;

// var color = scale.scaleOrdinal(scale.schemeCategory20.map(fader));
// var format = d3Format.format(',d');

var plantLayer = d3.select('#garden-board .plant-layer');
var regionLayer = d3.select('#garden-board .region-layer');
var labelLayer = d3.select('#garden-board .field-label-layer');
var gardenBoard = d3.select('#garden-board');

var treemap;

function renderGarden({projectData, onDeedClick, expensiveRenderIsOK}) {
  if (!treemap || expensiveRenderIsOK) {
    let height = ~~(countDeedsInProjects(projectData) * heightToDeedRatio);
    console.log('height', height)
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

  renderProjectRegions(root);
  renderDeedCells(root, getDataFromNodeToHandler);
  renderProjectLabels(root, expensiveRenderIsOK);

  function getDataFromNodeToHandler(d) {
    onDeedClick({deed: d.data, project: d.parent.data});
  }
}

function renderProjectRegions(root) {
  var projectRegions = regionLayer.selectAll('.project-region')
    .data(root.children, getNestedId);

  projectRegions.exit().remove();

  var newRegions = projectRegions.enter()
    .append('rect')
      .classed('project-region', true)
      .attr('fill', 'hsla(0, 0%, 100%, 0.3)')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

  var updateRegions = projectRegions.merge(newRegions);

  updateRegions
    .attr('x', accessor('x0'))
    .attr('y', accessor('y0'))
    .attr('width', getRegionWidth)
    .attr('height', getRegionHeight);
}

function renderProjectLabels(root, expensiveRenderIsOK) {
  var labels = labelLayer.selectAll('.label')
    .data(root.children, getNestedId);

  labels.exit().remove();
  
  var newLabels = labels.enter().append('text')
    .classed('label', true)
    .attr('text-anchor', 'middle');

  var updateLabels = labels.merge(newLabels);

  updateLabels.text(getNestedName);

  if (expensiveRenderIsOK) {
    updateLabels.attr('transform', getLabelTransform);
  }
}

function renderDeedCells(root, onDeedClick) {
  var cells = plantLayer.selectAll('g')
    .data(root.leaves(), getNestedId);
  
  cells.exit().remove();

  var newCells = cells.enter().append('g');
  newCells.append('rect').on('click', onDeedClick);

  var updateCells = newCells.merge(cells);

  updateCells
    .attr('transform', function(d) { return 'translate(' + d.x0 + ',' + d.y0 + ')'; });

  updateCells.select('rect')
      .attr('id', function(d) { return d.data.id; })
      .attr('width', function(d) { return d.x1 - d.x0; })
      .attr('height', function(d) { return d.y1 - d.y0; })
      .attr('fill', deedColor);
      // .style('opacity', deedOpacity);
      // .each(addToProjectBounds);  
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
  return fader(projectColor(d.parent));
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

function getColorIndexForString(s) {
  var hash = 0;
  for (var i = 0; i < s.length; ++i) {
    hash += s.charCodeAt(i);
  }
  return hash % gardenColorsLength;
}

function fader(color) {
  return interpolate.interpolateRgb(color, '#fff')(0.3);
}

// function showDetails(d) {
//   console.log(d);
// }

module.exports = renderGarden;
