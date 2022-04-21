//TinyApp Functions

//Generates a six character string to serve as our short URL, and to generate a random user id.
const generateRandomString = function() {
  let shortenedURL = '';
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    shortenedURL += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortenedURL;
};

//Checks the user email against the email in the database and returns the user, or if not found false.
const emailLookup = function(eMail, dB) {
  for (let key in dB) {
    if (dB[key].email === eMail) {
      return dB[key];
    }
  }
  return false;
};

//Checks the user in the database, and returns any links they created in an object for rendering in /urls
const userIDLookup = function(uID, dB) {
  let userURLS = {};
  for (let url in dB) {
    if (dB[url].userID === uID) {
      userURLS[url] = dB[url];
    }
  }
  return userURLS;
};

module.exports = { generateRandomString, emailLookup, userIDLookup};