var callNextTick = require('call-next-tick');
var leveljs = require('level-js');
var levelup = require('levelup');
var Sublevel = require('level-sublevel');
var queue = require('d3-queue').queue;

function ProjectsSource(
  {
    user,
    onDeed,
    onProject,
    dbName = 'observatory',
    projectsToCareAbout
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
    var q = queue();

    if (sources.indexOf('local') !== -1) {
      q.defer(streamLocalEntities, deedDb, onDeed);
      q.defer(streamLocalEntities, projectDb, onProject);
    }

    if (sources.indexOf('API') !== -1) {
      // TODO: Connect to getUserCommits.
    }

    q.awaitAll(done);
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


module.exports = ProjectsSource;
