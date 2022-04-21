const generateRandomString = function() {  //generator for new shortURL
  let shortenedURL = '';
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    shortenedURL += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortenedURL;

};

const emailLookup = function(eMail, dB) { //
  for (let key in dB) {
    if (dB[key].email === eMail) {
      return dB[key];
    }
  }
  return false;
};
/**
 * This function takes in a user id
 * 
 */
const userIDLookup = function (uID, dB) {
  let userURLS = {};
  for (let url in dB) {
    if (dB[url].userID === uID) {
      userURLS[url] = dB[url];
      
    }
  }
  return userURLS;
}

module.exports = { generateRandomString, emailLookup, userIDLookup}