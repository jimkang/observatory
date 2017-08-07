var userFormIds = require('../user-form-ids');

function getFormValues() {
  var formValues = {};
  userFormIds.forEach(getValueForId);
  return formValues;

  function getValueForId(id) {
    formValues[id] = document.getElementById(id).value;
  }
}

function setFormValues(formValues) {
  for (var id in formValues) {
    if (id in userFormIds) {
      document.getElementById(id).value = formValues[id];
    }
  }
}

module.exports = {
  getFormValues: getFormValues,
  setFormValues: setFormValues
};
