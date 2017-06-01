var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var findWhere = require('lodash.findwhere');
var pluck = require('lodash.pluck');
var randomId = require('idmaker').randomId;
var splitArray = require('split-array');
var queue = require('d3-queue').queue;
var pathExists = require('object-path-exists');

const apiURL = 'https://api.github.com/graphql';
const nonAlphanumericRegex = /[^\w]/g;

function getUserGitHubCommits(
  {
    token,
    username,
    userEmail,
    request,
    onRepo,
    onCommit,
    onNonFatalError,
    userAgent
  },
  allDone) {

  var repos = [];

  getRepos(callGetCommits, passRepos);

  function callGetCommits() {
    var repoNames = pluck(repos, 'name');
    var repoGroups = splitArray(repoNames, 10);
    var q = queue(1);
    repoGroups.forEach(queueGet);

    q.awaitAll(passRepos);

    function queueGet(repoNameGroup) {
      q.defer(getCommits, repoNameGroup);
    }
  }

  function passRepos(error) {
    callNextTick(allDone, error, repos);
  }

  function collectRepository(repo) {
    repo.lastCheckedDate = (new Date()).toISOString();
    repos.push(repo);
    if (onRepo) {
      onRepo(repo);
    }
  }

  function collectCommits(repoName, edges) {
    var repo = findWhere(repos, {name: repoName});
    if (!repo.commits) {
      repo.commits = [];
    }

    edges.forEach(addCommit);

    function addCommit(edge) {
      edge.node.repoName = repoName;
      repo.commits.push(edge.node);
      if (onCommit) {
        onCommit(edge.node);
      }
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
        if (onNonFatalError) {
          onNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
        }
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing
          done(new Error('Rate limit error'));
          return;
        }
      }
      else if (pathExists(body, ['data', 'user', 'repositories', 'nodes'])) {
        body.data.user.repositories.nodes.forEach(collectRepository);
      }

      if (pathExists(body, ['data', 'user', 'repositories', 'pageInfo']) &&
        body.data.user.repositories.pageInfo.hasNextPage) {

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
        reposThatHaveCommitsToGet, lastCursorsForRepos, userEmail
      );
      // console.log('query', query);
      request(
        getGQLReqOpts(query),
        sb(handleCommitResponse, done)
      );
    }

    function handleCommitResponse(res, body) {
      if (!body) {
        if (onNonFatalError) {
          onNonFatalError(new Error('Empty body received from commit reqeust.'));
        }
      }
      else if (body.errors) {
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing
          callNextTick(done, new Error('Rate limit error'));
          return;
        }
        if (onNonFatalError) {
          onNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
        }
      }
      else if (!pathExists(body, ['data', 'viewer'])) {
        if (onNonFatalError) {
          onNonFatalError(
            new Error('Could not get data/viewer from commit query response body.')
          );
        }
      }
      else {
        for (var queryId in body.data.viewer) {
          let queryResult = body.data.viewer[queryId];
          if (queryResult) {
            let repoName = queryResult.defaultBranchRef.repository.name;
            let pageInfo = queryResult.defaultBranchRef.target.history.pageInfo;
            if (pageInfo.hasNextPage) {
              lastCursorsForRepos[repoName] = pageInfo.endCursor;
            }
            else {
              delete lastCursorsForRepos[repoName];
            }
            collectCommits(repoName, queryResult.defaultBranchRef.target.history.edges);
          }
        }
      }
      
      if (Object.keys(lastCursorsForRepos).length > 0) {
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
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

function getCommitQuery(repoNames, lastCursorsForRepos, userEmail) {
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
            history(author: {emails: "${userEmail}"}, first: 20${afterSegment}) {
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

function isAGitHubRateLimitErrorMessage(messageObject) {
  return messageObject && messageObject.message &&
    messageObject.message.startsWith('API rate limit exceeded for');
}

module.exports = getUserGitHubCommits;
