var Timer = require('d3-timer').timer;
var easeCubicIn = require('d3-ease').easeCubicIn;

// function getDelayForCallCount(count) {
//   if (count < 10) {
//     return 100;
//   }
//   else if (count < 25) {
//     return 500;
//   }
//   else {
//     return 2000;
//   }
// }

function EaseThrottle({fn}) {
  var timer;
  var queuedOpts;
  var numberOfCalls = 0;

  return throttledFn;

  function throttledFn(opts) {
    if (timer) {
      queuedOpts = opts;
    }
    else {
      fn(opts);
      numberOfCalls += 1;
      timer = Timer(timerDone, easeCubicIn(numberOfCalls/50) * 1500);
    }
  }

  function timerDone() {
    timer.stop();
    timer = null;
    if (queuedOpts) {
      numberOfCalls += 1;
      fn(queuedOpts);
    }
  }
}

module.exports = EaseThrottle;
