var callNextTick = require('call-next-tick');
var leveljs = require('level-js');
var levelup = require('levelup');
var Sublevel = require('level-sublevel');

function ProjectsSource({onDeed}) {
  var db = levelup(
    'observatory',
    {
      db: leveljs,
      valueEncoding: 'json'
    }
  );
  var userDb = Sublevel(db).sublevel('user');  

  return {
    putDeed: putDeed,
    getDeed: getDeed
  };

  function putDeed({deed, user}, done) {
    getDeedDb(user).put(deed.id, deed, processDeed);

    function processDeed(error) {
      if (error) {
        done(error);
      }
      else {
        if (onDeed) {
          onDeed(deed);
        }
        done();
      }
    }
  }

  function getDeed({user, id}, done) {
    getDeedDb(user).get(id, done);
  }

  function getDeedDb(user) {
    var currentUserDb = userDb.sublevel(user);
    return currentUserDb.sublevel('deed');
  }
}

module.exports = ProjectsSource;
