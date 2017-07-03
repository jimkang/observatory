/* global window */

var test = require('tape');
var ProjectsSource = require('../../projects-source');
var assertNoError = require('assert-no-error');
var queue = require('d3-queue').queue;
var values = require('lodash.values');
var config = require('../../config');
var request = require('basic-browser-request');
var defaults = require('lodash.defaults');
var pluck = require('lodash.pluck');

var projectsToCareAbout = ['iemxrre', 'attnbot', 'slack-gis'];
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

test('Stream from API.', apiDeedStreamTest);
// test('Pause', (t) => {window.c = t.end; console.log('After setting breakpoints, type c() to continue.');});

function apiDeedStreamTest(t) {
  var shouldListenToEvents = false;
  var emittedDeeds = {};
  var emittedProjects = {};

  var projectsSource = ProjectsSource(defaults(
    {
      onDeed: collectDeed,
      onProject: collectProject,
      filterProject: weCareAboutThisProject,
      dbName: 'api-deed-stream-test'
    },
    defaultCtorOpts
  ));

  var existingDeeds = [
    {
      'abbreviatedOid': '30a7e8c',
      id: '30a7e8c',
      'message': 'Refactored mishear module to export a createMishear function that sets up  to use the probable given to createMishear.',
      'committedDate': '2015-10-05T01:42:19Z',
      'repoName': 'mishear',
      projectName: 'mishear',
      type: 'commit'
    },
    {
      'abbreviatedOid': '1d35d45',
      id: '1d35d45',
      'message': '1.0.1',
      'committedDate': '2015-09-28T13:07:55Z',
      'repoName': 'mishear',
      projectName: 'mishear',
      type: 'commit'
    },
    {
      id: '1e273c2',
      'abbreviatedOid': '1e273c2',
      'message': 'Nominally working.',
      'committedDate': '2015-09-26T04:48:26Z',
      'repoName': 'attnbot',
      projectName: 'attnbot',
      type: 'commit'
    }
  ];

  var existingProjects = [
    {
      'name': 'mishear',
      'id': 'MDEwOlJlcG9zaXRvcnk0MzEwMTQ0Mg==',
      'pushedAt': '2015-10-18T16:53:27Z',
      'description': 'Finds possible mishearings for a given word.',
      'lastCheckedDate': '2017-06-19T01:39:22.345Z',
      'weHaveTheOldestCommit': true
    },
    {
      'name': 'attnbot',
      'id': 'MDEwOlJlcG9zaXRvcnk0MzA2NjIwMA==',
      'pushedAt': '2015-10-18T17:09:10Z',
      'description': 'A bot that doesn\'t always hear things correctly.',
      'lastCheckedDate': '2017-06-19T01:39:22.344Z'
    }
  ];

  var q = queue();
  existingProjects.forEach(queuePutProject);
  existingDeeds.forEach(queuePutDeed);
  q.awaitAll(streamDeeds);

  function queuePutDeed(deed) {
    q.defer(projectsSource.putDeed, deed);
  }

  function queuePutProject(project) {
    q.defer(projectsSource.putProject, project);
  }

  function streamDeeds(error) {
    assertNoError(t.ok, error, 'No error while putting deeds and projects.');
    shouldListenToEvents = true;
    projectsSource.startStream({sources: ['local', 'API']}, checkStreamEnd);
  }

  function collectDeed(deed) {
    if (shouldListenToEvents) {
      emittedDeeds[deed.id] = deed;
    }
  }

  function collectProject(project) {
    if (shouldListenToEvents) {
      emittedProjects[project.id] = project;
    }
  }

  function checkStreamEnd(error) {
    assertNoError(t.ok, error, 'No error while streaming local stuff.');
    var uniqueDeedsEmitted = Object.keys(emittedDeeds).length;
    // console.log('uniqueDeedsEmitted:', uniqueDeedsEmitted);

    t.ok(
      uniqueDeedsEmitted > existingDeeds.length,
      'Correct number of deeds was emitted.'
    );
    values(emittedDeeds).forEach(checkDeed);
    
    t.equal(
      Object.keys(emittedProjects).length,
      projectsToCareAbout.length,
      'Correct number of projects was emitted.'
    );
    values(emittedProjects).forEach(checkProject);
    t.end();
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

    if (projectsToCareAbout) {
      t.ok(
        projectsToCareAbout.indexOf(project.name) !== -1 ||
        pluck(existingProjects, 'name').indexOf(project.name) !== -1,
        'Project is in projectsToCareAbout'
      );
    }
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}

function weCareAboutThisProject(project) {
  return projectsToCareAbout.indexOf(project.name) !== -1;
}
