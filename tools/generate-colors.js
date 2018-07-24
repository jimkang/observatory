/* global process */

var interpolate = require('d3-interpolate');
var range = require('d3-array').range;
var color = require('d3-color');
var flatten = require('lodash.flatten');
var fs = require('fs');
var createProbable = require('probable').createProbable;
var seedrandom = require('seedrandom');

var numberOfColors = 300;

if (process.argv.length > 2) {
  numberOfColors = parseInt(process.argv[2]);
}

var probable = createProbable({
  random: seedrandom(numberOfColors.toString())
});

const numberOfSegments = 5;
const segmentSize = ~~(numberOfColors / numberOfSegments);
const hueRangePerSegment = 360 / numberOfSegments;
// const chroma = 85;
// const luminence = 55;
const swatchWidth = 20;

var colors = flatten(range(numberOfSegments).map(interpolateInSegment));

console.log(JSON.stringify(colors, null, 2));
fs.writeFileSync(
  __dirname + '/color-test.html',
  `
<html>
<body>
  <svg width="${swatchWidth * colors.length}">
    ${colors.map(swatchForColor).join('\n')}
  </svg>
</body>
</html>`
);

function interpolateInSegment(segmentIndex) {
  const startHue = segmentIndex * hueRangePerSegment;
  const endHue = (segmentIndex + 1) * hueRangePerSegment;
  const chroma = 30 + probable.roll(70);
  const luminence = probable.roll(80) + 50;
  var interpolator = interpolate.interpolateHcl(
    color.hcl(startHue, chroma, luminence),
    color.hcl(endHue, chroma, luminence)
  );
  return range(segmentSize).map(i => interpolator(i / segmentSize));
}

function swatchForColor(color, i) {
  return `<rect width="${swatchWidth}" height="${swatchWidth}" fill="${color}" x="${i *
    swatchWidth}"></rect>`;
}
