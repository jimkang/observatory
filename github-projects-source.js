var callNextTick = require('call-next-tick');
var leveljs = require('level-js');
var levelup = require('levelup');
var Sublevel = require('level-sublevel');
var queue = require('d3-queue').queue;
var getUserCommits = require('./get-user-commits');
var sb = require('standard-bail')();
var curry = require('lodash.curry');
var shamble = require('./shamble');
var BatchJSONParser = require('batch-json-parser');
var addDeedToProject = require('./add-deed-to-project');

function GitHubProjectsSource(
  {
    user,
    onDeeds,
    onProjects,
    dbName = 'observatory',
    filterProject,
    githubToken,
    username,
    userEmail,
    request,
    userAgent,
    onNonFatalError
  }) {

  var db = levelup(
    dbName,
    {
      db: leveljs,
      valueEncoding: 'utf8'
    }
  );
  var userDb = Sublevel(db).sublevel('user').sublevel(user);
  var deedDb = userDb.sublevel('deed');
  var projectDb = userDb.sublevel('project');

  return {
    putDeed,
    getDeed,
    putProject,
    getProject,
    startStream
  };

  function putDeed(deed, done) {
    put(deedDb, deed, onDeeds, done);
  }

  function putDeedFromSource(source, projects, deed, done) {
    put(deedDb, deed, onDeedsWithSource, done);

    function onDeedsWithSource(deeds) {
      onDeeds(deeds, source);
    }
  }

  function getDeed(id, done) {
    deedDb.get(id, curry(parseSingleGetResult)(done));
  }

  function parseSingleGetResult(done, error, result) {
    handleDbError(error);
    callNextTick(done, null, JSON.parse(result));
  }

  function putProject(project, done) {
    put(projectDb, project, onProjects, done);
  }

  function putProjectFromSource(source, project, done) {
    put(projectDb, project, onProjectsWithSource, done);

    function onProjectsWithSource(projects) {
      onProjects(projects, source);
    }
  }

  function getProject(id, done) {
    projectDb.get(id, done);
  }

  function startStream({sources = ['local', 'API']}, done) {
    var outstandingPuts = 0;
    startLocalStream(sb(proceedAfterStreamingLocal, done));

    function proceedAfterStreamingLocal(localProjects) {
      if (sources.indexOf('API') !== -1) {
        // We need to do this so that when getUserCommits looks at what
        // commits are needed from GitHub, they'll see the existing deeds
        // as commits.
        localProjects.forEach(convertDeedsToCommits);
        // console.log('existingRepos', localProjects);

        var getUserCommitsOpts = {
          token: githubToken,
          username,
          userEmail,
          request,
          userAgent,
          onNonFatalError,
          shouldIncludeRepo: filterProject,
          existingRepos: localProjects,
          onRepo: shamble([
            ['s', incrementOutstandingPuts],
            ['a', curry(putProjectFromSource)('API')],
            ['s', handleDbError],
            ['s', decrementOutstandingPuts]
          ]),
          onCommit: shamble([
            ['s', convertCommitToDeed],
            ['s', incrementOutstandingPuts],
            ['a', curry(putDeedFromSource)('API', localProjects)],
            ['s', handleDbError],
            ['s', decrementOutstandingPuts]
          ])
        };
        // console.log('localProjects', localProjects);

        getUserCommits(
          getUserCommitsOpts,
          callDoneWhenOutstandingPutsComplete
        );
      }
      else {
        callNextTick(done);
      }
    }

    function incrementOutstandingPuts(deed) {
      outstandingPuts += 1;
      // console.log('incrementOutstandingPuts', outstandingPuts);
      // Pass this for the next function in the chain.
      // TODO: Revisit this awkwardness.
      return deed;
    }

    function decrementOutstandingPuts() {
      outstandingPuts -= 1;
      // console.log('decrementOutstandingPuts', outstandingPuts);
    }

    function callDoneWhenOutstandingPutsComplete(error) {
      // console.log('callDoneWhenOutstandingPutsComplete outstandingPuts', outstandingPuts);
      if (error) {
        done(error);
      }
      else if (outstandingPuts < 1) {
        callNextTick(done);
      }
      else {
        setTimeout(callDoneWhenOutstandingPutsComplete, 200);
      }
    }
  }

  function convertCommitToDeed(commit) {
    // Is it OK to mutate here? Probably.
    commit.id = commit.abbreviatedOid;
    commit.projectName = commit.repoName;
    return commit;
  }

  function handleDbError(error) {
    if (error && error instanceof Error) {
      onNonFatalError(error);
    }
  }

  function startLocalStream(done) {
    var batchProjectJSONParser = BatchJSONParser({
      batchSize: 10,
      onBatchParsed: collectLocalProjects
    });
    var batchDeedJSONParser = BatchJSONParser({
      batchSize: 100,
      onBatchParsed: collectLocalDeeds
    });

    var projects = [];
    var addDeedToLocalProject = curry(addDeedToProject)(
      onNonFatalError, projects
    );

    var q = queue(1);
    q.defer(streamLocalEntities, projectDb, batchProjectJSONParser.write);
    q.defer(asyncWrap(batchProjectJSONParser.flush));
    q.defer(streamLocalEntities, deedDb, batchDeedJSONParser.write);
    q.defer(asyncWrap(batchDeedJSONParser.flush));
    q.awaitAll(sb(passProjects, done));

    function collectLocalDeeds(deeds) {
      deeds.forEach(addDeedToLocalProject);
      onDeeds(deeds, 'local');
    }

    function collectLocalProjects(incomingProjects) {
      incomingProjects.forEach(addToProjects);
      // console.log('update projects', projects);
      onProjects(incomingProjects);
    }

    function addToProjects(project) {
      projects.push(project);
    }

    function passProjects() {
      done(null, projects);
    }
  }
}

function put(db, entity, batchListener, done) {
  db.put(entity.id, JSON.stringify(entity), processEntity);

  function processEntity(error) {
    if (error) {
      done(error);
    }
    else {
      if (batchListener) {
        batchListener([entity]);
      }
      done();
    }
  }
}

function streamLocalEntities(db, listener, done) {
  if (listener) {
    var stream = db.createValueStream();
    stream.on('data', listener);
    stream.on('end', done);
  }
  else {
    callNextTick(done);
  }
}

function convertDeedsToCommits(project) {
  project.commits = project.deeds;
}

function asyncWrap(syncFn) {
  return function runSync(done) {
    syncFn();
    callNextTick(done);
  };
}

module.exports = GitHubProjectsSource;
