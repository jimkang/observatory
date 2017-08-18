var ndjson = require('ndjson');

function getUserCommitsFromServer({
  request,
  onRepo,
  onCommit,
  onNonFatalError,
  existingRepos
},
done) {

  var ndjsonParsingStream = ndjson.parse();
  ndjsonParsingStream.on('data', emitObject);

  var reqOpts = {
    url: 'server-url-goes here',
    method: 'POST',
    body: JSON.stringify(existingRepos),
    onData: writeToStream
  };
  request(reqOpts, done);

  function writeToStream(text) {
    ndjsonParsingStream.write(text);
  }

  function emitObject(obj) {
    if (obj.oid) {
      onCommit(obj);
    }
    else {
      onRepo(obj);
    }
  }
}

module.exports = getUserCommitsFromServer;
