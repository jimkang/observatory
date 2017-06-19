var test = require('tape');
var ProjectsSource = require('../../projects-source');
var assertNoError = require('assert-no-error');

test('Update db with deed.', deedUpdateTest);

// test('Stream repos from db.');

// test('Update repos in db from API');
// What should we emit? Commits? Whole repos?
// Should a stream from the db ever end? Just commit and repo events all day?
//

function deedUpdateTest(t) {
  t.plan(4);

  var projectsSource = ProjectsSource({
    onDeed: checkDeed    
  });
  var deed = {
    'abbreviatedOid': '30a7e8c',
    id: '30a7e8c',
    'message': 'Refactored mishear module to export a createMishear function that sets up  to use the probable given to createMishear.',
    'committedDate': '2015-10-05T01:42:19Z',
    'repoName': 'mishear',
    projectName: 'mishear',
    type: 'commit'
  };
  projectsSource.putDeed({deed: deed, user: 'jimkang'}, checkPutError);

  function checkDeed(emittedDeed) {
    t.deepEqual(emittedDeed, deed, 'Correct deed is emitted.');
  }

  function checkPutError(error) {
    assertNoError(t.ok, error, 'No error while putting deed.');
    projectsSource.getDeed({user: 'jimkang', project: 'mishear', id: '30a7e8c'}, checkGet);
  }

  function checkGet(error, gottenDeed) {
    assertNoError(t.ok, error, 'No error while getting deed.');
    checkDeed(gottenDeed);
  }
}
