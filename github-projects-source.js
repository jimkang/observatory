var callNextTick = require('call-next-tick');
var leveljs = require('level-js');
var levelup = require('levelup');
var Sublevel = require('level-sublevel');
var queue = require('d3-queue').queue;
var getUserCommits = require('./get-user-commits');
var sb = require('standard-bail')();
var findWhere = require('lodash.findwhere');
var shamble = require('./shamble');

function GitHubProjectsSource(
  {
    user,
    onDeed,
    onProject,
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
      valueEncoding: 'json'
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
    put(deedDb, deed, onDeed, done);
  }

  function getDeed(id, done) {
    deedDb.get(id, done);
  }

  function putProject(project, done) {
    put(projectDb, project, onProject, done);
  }

  function getProject(id, done) {
    projectDb.get(id, done);
  }

  function startStream({sources = ['local', 'API']}, done) {
    var outstandingPuts = 0;
    startLocalStream(sb(proceedAfterStreamingLocal, done));

    function proceedAfterStreamingLocal(localProjects) {
      if (sources.indexOf('API') !== -1) {
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
            ['a', putProject],
            ['s', handlePutError],
            ['s', decrementOutstandingPuts]
          ]),
          onCommit: shamble([
            ['s', convertCommitToDeed],
            ['s', incrementOutstandingPuts],
            ['a', putDeed],
            ['s', handlePutError],
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
      console.log('incrementOutstandingPuts', outstandingPuts);
      // Pass this for the next function in the chain.
      // TODO: Revisit this awkwardness.
      return deed;
    }

    function decrementOutstandingPuts() {
      outstandingPuts -= 1;
      console.log('decrementOutstandingPuts', outstandingPuts);
    }

    function callDoneWhenOutstandingPutsComplete() {
      console.log('callDoneWhenOutstandingPutsComplete outstandingPuts', outstandingPuts);
      if (outstandingPuts < 1) {
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

  function handlePutError(error) {
    if (error && error instanceof Error) {
      onNonFatalError(error);
    }
  }

  function startLocalStream(done) {
    var projects = [];
    var q = queue(1);
    q.defer(streamLocalEntities, projectDb, collectLocalProject);
    q.defer(streamLocalEntities, deedDb, collectLocalDeed);
    q.awaitAll(sb(passProjects, done));

    function collectLocalDeed(deed) {
      var containingProject = findWhere(projects, {name: deed.projectName});
      if (!containingProject.deeds) {
        containingProject.deeds = [];
      }
      containingProject.deeds.push(deed);
      onDeed(deed);
    }

    function collectLocalProject(project) {
      projects.push(project);
      onProject(project);
    }

    function passProjects() {
      done(null, projects);
    }
  }
}

function put(db, entity, listener, done) {
  db.put(entity.id, entity, processEntity);

  function processEntity(error) {
    if (error) {
      done(error);
    }
    else {
      if (listener) {
        listener(entity);
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


module.exports = GitHubProjectsSource;
