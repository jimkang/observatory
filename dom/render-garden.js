var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
var scale = require('d3-scale');
// var d3Format = require('d3-format');
// var d3Color = require('d3-color');
var interpolate = require('d3-interpolate');
var throttle = require('lodash.throttle');
var Zoom = require('d3-zoom');

// var idKey = accessor();
// var nameKey = accessor('name');
// var messageKey = accessor('message');
var deedsKey = GetPropertySafely('deeds', []);

// var firstRender = true;

// In view units:
const width = 100;
const height = 100;
const xLabelMargin = 2;
const yLabelMargin = 2;
const labelYOffsetProportion = 0.25;
const labelXOffsetProportion = 0.25;

var fader = function(color) { return interpolate.interpolateRgb(color, '#fff')(0.2); };
var color = scale.scaleOrdinal(scale.schemeCategory20.map(fader));
// var format = d3Format.format(',d');

var plantLayer = d3.select('#garden-board .plant-layer');
var labelLayer = d3.select('#garden-board .field-label-layer');

var zoom = Zoom.zoom()
  .scaleExtent([0.25, 4])
  .on('zoom', zoomed);

var zoomLayer = d3.select('#garden-board .zoom-layer');
zoomLayer.call(zoom);

var treemap = hierarchy.treemap()
    .tile(hierarchy.treemapResquarify.ratio(1))
    .size([width, height])
    // .round(true)
    .paddingInner(width/1000);

function renderGarden({projectData}) {
  d3.selectAll('.view-root:not(#garden-board)').classed('hidden', true);
  d3.select('#garden-board').classed('hidden', false);

  var rootData = {
    name: 'root',
    deeds: projectData
  };

  var root = hierarchy.hierarchy(rootData, deedsKey)
      .sum(sumBySize);

  treemap(root);

  var cells = plantLayer.selectAll('g')
    .data(root.leaves(), getNestedId);
  
  cells.exit().remove();

  var newCells = cells.enter().append('g');
  newCells.append('rect');

  var updateCells = newCells.merge(cells);

  updateCells
    .attr('transform', function(d) { return 'translate(' + d.x0 + ',' + d.y0 + ')'; });

  updateCells.select('rect')
      .attr('id', function(d) { return d.data.id; })
      .attr('width', function(d) { return d.x1 - d.x0; })
      .attr('height', function(d) { return d.y1 - d.y0; })
      .attr('fill', function(d) { return color(d.parent.data.id); });
      // .each(addToProjectBounds);

  // updateCells.select('clipPath')
  //   .attr('id', function(d) { return 'clip-' + d.data.id; })
  //   .select('use')
  //     .attr('xlink:href', function(d) { return '#' + d.data.id; });

  // updateCells.select('text')
  //   .attr('clip-path', function(d) { return 'url(#clip-' + d.data.id + ')'; })
  //   .selectAll('tspan')
  //     .data(function(d) {
  //       // TODO: Find out why name is needed. Should not be rendering projects!
  //       return (d.data.name || d.data.message).split(/(?=[A-Z][^A-Z])/g);
  //     })
  //   .enter().append('tspan')
  //     .attr('x', 4)
  //     .attr('y', function(d, i) { return 13 + i * 10; })
  //     .text(function(d) { return d; });

  // updateCells.select('title')
  //     .text(function(d) { return d.data.id + '\n' + format(d.value); });
  // function addToProjectBounds(cell) {
  //   // if (cell.data.projectName)
  // }

  var projectRegions = labelLayer.selectAll('.project-region')
    .data(root.children, getNestedId);

  projectRegions.exit().remove();
  
  var newRegions = projectRegions.enter().append('g').classed('project-region', true);

  newRegions.append('rect')
    .attr('fill', 'hsla(0, 0%, 100%, 0.5)')
    .attr('stroke', 'black')
    .attr('stroke-width', width/1000);
  newRegions.append('text')
    .attr('text-anchor', 'middle');

  var updateRegions = projectRegions.merge(newRegions);

  updateRegions.select('rect')
    .attr('x', accessor('x0'))
    .attr('y', accessor('y0'))
    .attr('width', getRegionWidth)
    .attr('height', getRegionHeight);

  updateRegions.select('text')
    .attr('transform', getLabelTransform)
    .text(getNestedName);
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
  var scale = 1.0;
  var xScale;
  var yScale;
  var xTranslateOffset = 0;
  var yTranslateOffset = 0;

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

function zoomed() {
  // console.log('d3.event.transform', d3.event.transform);
  zoomLayer.attr('transform', d3.event.transform);
}

module.exports = throttle(renderGarden, 1000);
