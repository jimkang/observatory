/* global window */

var test = require('tape');
var GitHubProjectsSource = require('../../github-projects-source');
var assertNoError = require('assert-no-error');
// var queue = require('d3-queue').queue;
var values = require('lodash.values');
var config = require('../../config');
var request = require('basic-browser-request');
var defaults = require('lodash.defaults');
// var pluck = require('lodash.pluck');

// Start with a high number so test passes for the initial run.
// The will be set to an actual count for subsequent runs, and those runs
// should emit fewer deeds, assuming that a whole bunch of commits aren't
// made to these projects between runs.
var emittedAPISourceDeedCountFromPreviousRun = 100000;
var projectsToCareAbout = ['transform-word-bot', 'attnbot', 'slack-gis'];
// projectsToCareAbout = undefined;
// Set projectsToCareAbout to undefined to test it against *every* project.
// Warning: That's a long test.

var defaultCtorOpts = {
  user: 'jimkang',
  githubToken: config.githubTestToken,
  username: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  request: request,
  onNonFatalError: logNonFatalError
};

// test('Pause', (t) => {window.c = t.end; console.log('After setting breakpoints, type c() to continue.');});
test('Stream from API.', apiDeedStreamTest);
test('Stream from API again, for fewer commits.', apiDeedStreamTest);

function apiDeedStreamTest(t) {
  var streamEndEventReceived = false;
  var shouldListenToEvents = false;
  var emittedDeeds = {};
  var emittedProjects = {};
  var numberOfDeedsEmittedFromAPISource = 0;

  var githubProjectsSource = GitHubProjectsSource(defaults(
    {
      onDeed: collectDeed,
      onProject: collectProject,
      filterProject: projectsToCareAbout ? weCareAboutThisProject : undefined,
      dbName: 'api-deed-stream-test'
    },
    defaultCtorOpts
  ));

  shouldListenToEvents = true;
  githubProjectsSource.startStream({sources: ['local', 'API']}, checkStreamEnd);

  function collectDeed(deed, source) {
    t.ok(!streamEndEventReceived, 'Did not receive deed event after end of stream.');
    // if (streamEndEventReceived) {
    //   debugger;
    // }

    if (source === 'API') {
      numberOfDeedsEmittedFromAPISource += 1;
    }
    if (shouldListenToEvents) {
      emittedDeeds[deed.id] = deed;
    }
  }

  function collectProject(project, source) {
    t.ok(!streamEndEventReceived, 'Did not receive project event after end of stream.');
    if (shouldListenToEvents) {
      emittedProjects[project.id] = project;
    }
  }

  function checkStreamEnd(error) {
    streamEndEventReceived = true;
    assertNoError(t.ok, error, 'No error while streaming local stuff.');

    var uniqueDeedsEmitted = Object.keys(emittedDeeds).length;
    console.log('uniqueDeedsEmitted:', uniqueDeedsEmitted);
    console.log('numberOfDeedsEmittedFromAPISource:', numberOfDeedsEmittedFromAPISource);
    t.ok(
      numberOfDeedsEmittedFromAPISource < emittedAPISourceDeedCountFromPreviousRun,
      'Fewer deeds were emitted from the API than on the previous run.'
    );
    emittedAPISourceDeedCountFromPreviousRun = numberOfDeedsEmittedFromAPISource;

    values(emittedDeeds).forEach(checkDeed);
    
    if (projectsToCareAbout) {
      t.equal(
        Object.keys(emittedProjects).length,
        projectsToCareAbout.length,
        'Correct number of projects was emitted.'
      );
    }
    values(emittedProjects).forEach(checkProject);

    // Allow a chance for events to be erroneously emitted after the
    // stream end event.
    setTimeout(t.end, 1000);
  }

  function checkDeed(deed) {
    t.ok(deed.message, 'Deed has a message.');
    t.ok(deed.id, 'Deed has an id.');
    t.ok(deed.committedDate, 'Deed has a date.');
    t.ok(deed.projectName, 'deed has a projectName');
  }

  function checkProject(project) {
    t.ok(project.name, 'Project has a name.');
    t.ok(project.pushedAt, 'Project has a pushedAt date.');
    t.ok(project.lastCheckedDate, 'Project has a lastCheckedDate.');
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}

function weCareAboutThisProject(project) {
  return projectsToCareAbout.indexOf(project.name) !== -1;
}
