var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var findWhere = require('lodash.findwhere');
var pluck = require('lodash.pluck');
var randomId = require('idmaker').randomId;
var splitArray = require('split-array');
var queue = require('d3-queue').queue;

const apiURL = 'https://api.github.com/graphql';
const nonAlphanumericRegex = /[^\w]/g;

function getUserGitHubCommits(
  {token, username, request, onRepo, onCommit, userAgent}, allDone) {

  var repos = [];

  getRepos(sb(callGetCommits, allDone));

  function callGetCommits() {
    var repoNames = pluck(repos, 'name');
    var repoGroups = splitArray(repoNames, 10);
    var q = queue();
    repoGroups.forEach(queueGet);
    q.awaitAll(sb(passRepos, allDone));

    function queueGet(repoNameGroup) {
      q.defer(getCommits, repoNameGroup);
    }
  }

  function passRepos() {
    callNextTick(allDone, null, repos);
  }

  function collectRepository(repo) {
    repos.push(repo);
    if (onRepo) {
      onRepo(repo);
    }
  }

  function collectCommit(repoName, commit) {
    var repo = findWhere(repos, {name: repoName});
    if (!repo.commits) {
      repo.commits = [];
    }
    commit.repoName = repoName;
    repo.commits.push(commit);

    if (onCommit) {
      onCommit(commit);
    }
  }

  function getRepos(done) {
    var lastRepoCursor;
    postNextQuery();

    function postNextQuery() {
      request(
        getGQLReqOpts(getRepoQuery(username, lastRepoCursor)),
        sb(handleRepoResponse, done)
      );
    }

    function handleRepoResponse(res, body) {
      if (body.errors) {
        callNextTick(done, new Error(pluck(body.errors, 'message').join('|')));
        return;
      }

      console.log('body', JSON.stringify(body, null, '  '));

      body.data.user.repositories.nodes.forEach(collectRepository);
      if (body.data.user.repositories.pageInfo.hasNextPage) {
        lastRepoCursor = body.data.user.repositories.pageInfo.endCursor;
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
    }
  }

  function getCommits(repoNames, done) {
    var reposThatHaveCommitsToGet = repoNames.slice();
    var lastCursorsForRepos = {};
    postNextQuery();

    function postNextQuery() {
      var query = getCommitQuery(
        reposThatHaveCommitsToGet, lastCursorsForRepos
      );
      console.log('query', query);
      request(
        getGQLReqOpts(query),
        sb(handleCommitResponse, done)
      );
    }

    function handleCommitResponse(res, body) {
      // WAS ABOUT TO WORK ON THIS.
      console.log('body', JSON.stringify(body, null, '  '));
      // if (body.data.user.repositories.pageInfo.hasNextPage) {
      //   lastRepoCursor = body.data.user.repositories.pageInfo.endCursor;
      //   callNextTick(postNextQuery);
      // }
      // else {
      //   callNextTick(done);
      // }
    }
  }



  function getGQLReqOpts(query) {
    return {
      method: 'POST',
      url: apiURL,
      headers: {
        Authorization: 'Bearer ' + token,
        'User-Agent': userAgent
      },
      body: {
        query: query
      },
      json: true
    };
  }
}

function getRepoQuery(username, lastCursor) {
  var afterSegment = '';
  if (lastCursor) {
    afterSegment = `, after: "${lastCursor}"`;
  }
  return `{
    user(login: "${username}") {
      repositories(first: 100${afterSegment}) {
        nodes {
          name
          id
          description
        },
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }
  }`;
}

function getCommitQuery(repoNames, lastCursorsForRepos) {
  return `{
    viewer {
      ${repoNames.map(getRepoCommitSubquery).join('\n')}
    }
  }

  fragment CommitHistoryFields on CommitHistoryConnection {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        abbreviatedOid
        message
        committedDate
      }
    }
  }`;

  function getRepoCommitSubquery(repoName) {
    var afterSegment = '';
    if (lastCursorsForRepos[repoName]) {
      afterSegment = `, after: "${lastCursorsForRepos[repoName]}"`;
    }

    return `${randomId(4)}_${sanitizeAsGQLId(repoName)}: repository(name: "${repoName}") {
      defaultBranchRef {
        id
        repository {
          name
        }
        target {
          ... on Commit {
            id
            history(first: 20${afterSegment}) {
              ...CommitHistoryFields
            }
          }
        }
      }
    }`;
  }
}

function sanitizeAsGQLId(s) {
  return s.replace(nonAlphanumericRegex, '');
}

module.exports = getUserGitHubCommits;
