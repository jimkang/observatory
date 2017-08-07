var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
var scale = require('d3-scale');
// var d3Format = require('d3-format');
// var d3Color = require('d3-color');
var interpolate = require('d3-interpolate');
var throttle = require('lodash.throttle');

// var idKey = accessor();
// var nameKey = accessor('name');
// var messageKey = accessor('message');
var deedsKey = GetPropertySafely('deeds', []);

// var firstRender = true;

const width = 1000;
const height = 3000;

var fader = function(color) { return interpolate.interpolateRgb(color, '#fff')(0.2); };
var color = scale.scaleOrdinal(scale.schemeCategory20.map(fader));
// var format = d3Format.format(',d');

var plantLayer = d3.select('#garden-board .plant-layer');
var labelLayer = d3.select('#garden-board .field-label-layer');

var treemap = hierarchy.treemap()
    .tile(hierarchy.treemapResquarify.ratio(1))
    .size([width, height])
    .round(true)
    .paddingInner(1);

function renderGarden({projectData}) {
  var rootData = {
    name: 'root',
    deeds: projectData
  };
  // var boundsForProjects = {};

  var root = hierarchy.hierarchy(rootData, deedsKey)
      // .eachBefore(function(d) {
      //   d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name; 
      // })
      .sum(sumBySize);
      // .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  // console.log('Total descendants:', root.descendants().length);
  // console.log('Leaf count:', root.leaves().length);

  // if (firstRender) {
  //   hierarchy.treemap()
  //     .tile(hierarchy.treemapSquarify.ratio(1))
  //     .size([width, height])
  //     .round(true)
  //     .paddingInner(1)
  //     (root);
  //   firstRender = true;
  // }
  // else {
  treemap(root);
  // }

  // console.log('projects?', root.children);

  var cells = plantLayer.selectAll('g')
    .data(root.leaves(), getNestedId);
  
  // console.log('leaf example:', root.leaves()[0]);
  // console.log('exit size', cells.exit().size());
  cells.exit().each(exitCellIsAProject);
  // TODO: Why are non-projects being removed from the leaves?
  // Validate before rendering that nothing's being removed.

  // console.log(cells.exit());
  // debugger;
  cells.exit().remove();

  var newCells = cells.enter().append('g');
  newCells.append('rect');
  // newCells.append('clipPath')
  //   .append('use');
  // newCells.append('text');
  // newCells.append('title');

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
    .attr('stroke-width', 1);
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
  var maxWidth = getRegionWidth(d);
  var maxHeight = getRegionHeight(d);

  var currentWidth = this.getBBox().width;
  var scale = 1.0;

  var rotation = 0;
  if (maxWidth < maxHeight) {
    rotation = -90;
    if (currentWidth > maxHeight) {
      scale = maxHeight/currentWidth;
    }
  }
  else if (currentWidth > maxWidth) {
    scale = maxWidth/currentWidth;
  }


  return `translate(${x} ${y}) rotate(${rotation}) scale(${scale}, ${scale})`;
}

function exitCellIsAProject(exitingCell) {
  if (!exitingCell.data.pushedAt) {
    console.log('exiting cell is not a project!', exitingCell);
    return false;
  }
  return true;
}

module.exports = throttle(renderGarden, 1000);
