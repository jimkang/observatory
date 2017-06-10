var test = require('tape');
var assertNoError = require('assert-no-error');
var request = require('request');
var config = require('../config');
var findWhere = require('lodash.findwhere');
require('longjohn');

var getUserGitHubCommits = require('../get-user-github-commits');

test('Get repos and commits', getUserGitHubCommitsTest);

var reposToCareAbout = [
  'exogenite',
  'godtributes',
  'off-brand-vine'
];

var existingRepos = [
  {
    name: 'exogenite',
    commits: [
      {
        committedDate: isoStringForDateString('2017-03-09')
      },
      {
        committedDate: isoStringForDateString('2017-03-13')
      },
      {
        committedDate: isoStringForDateString('2017-03-12')
      }
    ]
  },
  {
    name: 'godtributes',
    commits: [
      {
        committedDate: isoStringForDateString('2014-06-30')
      },
      {
        committedDate: isoStringForDateString('2014-09-22')
      },
      {
        committedDate: isoStringForDateString('2014-10-31')
      }
    ]
  },
  {
    name: 'off-brand-vine',
    commits: [
      {
        committedDate: isoStringForDateString('2017-04-06')
      },
      {
        committedDate: isoStringForDateString('2017-04-30')
      },
      {
        committedDate: isoStringForDateString('2017-04-20')
      }
    ]
  }
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
    shouldIncludeRepo: filterRepo,
    existingRepos: existingRepos
  };

  getUserGitHubCommits(opts, checkFinalResults);

  function checkRepo(repo) {
    repoCount += 1;
    t.ok(repo.name, 'Repo has a name.');
    t.ok(repo.pushedAt, 'Repo has a pushedAt date.');
    t.ok(repo.lastCheckedDate, 'Repo has a lastCheckedDate.');
  }

  function checkCommit(commit) {
    commitCount += 1;
    t.ok(commit.message, 'Commit has a message.');
    t.ok(commit.abbreviatedOid, 'Commit has an abbreviatedOid.');
    t.ok(commit.committedDate, 'Commit has a date.');
    t.ok(commit.repoName, 'Commit has a repoName');

    var existingRepo = findWhere(existingRepos, {name: commit.repoName});    
    t.ok(
      new Date(commit.committedDate) < new Date(existingRepo.commits[0].committedDate),
      'Commit date is older than the oldest existingRepo commit date.'
    );
  }

  function checkFinalResults(error, repos) {
    // console.log('Repos dump:');
    // console.log(JSON.stringify(repos, null, '  '));
    // console.log('End repos dump.');

    assertNoError(t.ok, error, 'No error while getting commits.');
    t.equal(
      repos.length,
      repoCount,
      'Final repo count same as the emitted repo count.'
    );
    t.equal(
      repos.reduce(addToCommitCount, 0),
      commitCount + 9, // There's nine fake existing commits.
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
  return reposToCareAbout.indexOf(repo.name) !== -1;
}

function isoStringForDateString(s) {
  return (new Date(s)).toISOString();
}
