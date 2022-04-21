const { assert } = require('chai');

const { emailLookup } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('emailLookup', function() {
  it('should return a user with valid email', function() {
    const user = emailLookup("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID)
  });
});

describe('emailLookup', function() {
  it('should return undefined for an email not in our database', function() {
    const user = emailLookup("user@nothere.com", testUsers)
    assert.equal(user.id, undefined)
  });
});
