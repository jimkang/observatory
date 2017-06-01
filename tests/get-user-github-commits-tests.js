var test = require('tape');
var assertNoError = require('assert-no-error');
var request = require('request');
var config = require('../config');

var getUserGitHubCommits = require('../get-user-github-commits');

test('Get repos and commits', getUserGitHubCommitsTest);

var reposToDisown = [
  'oauthconsumer',
  'KIF',
  'OARequestHeader',
  'objectiveflickr',
  'facebook-ios-sdk',
  'ShakeKit',
  'asi-http-request',
  'node-ci',
  'forever-monitor',
  'collection-interference',
  'node-braque',
  'search-index',
  'fortune',
  'node-ab',
  'sublime-user-package',
  'node-level-cache-tools',
  'mstranslator',
  'IDEAS',
  'paella',
  'dce-4.1.1-paella-master-diffs',
  'prezto',
  'mh-opsworks',
  'node-webkit-screenshot',
  'svg-pencil',
  'mapquest',
  'javascript-karplus-strong',
  'ally-design',
  'bucket-runner',
  'quantize',
  'corpora',
  'protobuf',
  'openelections-sources-ma',
  'node-github',
  'jamchops',
  'secretknowledge'
];

function getUserGitHubCommitsTest(t) {
  var repoCount = 0;
  var commitCount = 0;

  var opts = {
    token: config.githubTestToken,
    username: 'jimkang',
    userEmail: 'jimkang@gmail.com',
    request: request,
    onRepo: checkRepo,
    onCommit: checkCommit,
    userAgent: 'observatory-tests',
    onNonFatalError: logNonFatalError,
    shouldIncludeRepo: filterRepo
  };

  getUserGitHubCommits(opts, checkFinalResults);

  function checkRepo(repo) {
    repoCount += 1;
    t.ok(repo.name, 'Repo has a name.');
    t.equal(
      reposToDisown.indexOf(repo.name),
      -1,
      'Repo name is not in the repos to be filtered.'
    );
    t.ok(repo.pushedAt, 'Repo has a pushedAt date.');
    // t.ok(repo.description, 'Repo has a description.');
    t.ok(repo.lastCheckedDate, 'Repo has a lastCheckedDate.');
  }

  function checkCommit(commit) {
    commitCount += 1;
    t.ok(commit.message, 'Commit has a message.');
    t.ok(commit.abbreviatedOid, 'Commit has an abbreviatedOid.');
    t.ok(commit.committedDate, 'Commit has a date.');
    t.ok(commit.repoName, 'Commit has a repoName');
  }

  function checkFinalResults(error, repos) {
    console.log('Repos dump:');
    console.log(JSON.stringify(repos, null, '  '));
    console.log('End repos dump.');

    assertNoError(t.ok, error, 'No error while getting commits.');
    t.equal(
      repos.length,
      repoCount,
      'Final repo count same as the emitted repo count.'
    );
    t.equal(
      repos.reduce(addToCommitCount, 0),
      commitCount,
      'Final commit count is the same as the emitted commit count.'
    );
    t.end();
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}

function addToCommitCount(count, repo) {
  var newCount = count;
  if (repo && repo.commits) {
    newCount += repo.commits.length;
  }
  return newCount;
}

function filterRepo(repo) {
  return reposToDisown.indexOf(repo.name) === -1;
}
