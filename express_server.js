const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//project databases

const urlDatabase = { //Example 'database'
  // "b2xVn2": {
  //         longURL: "http://www.lighthouselabs.ca",
  //         userID: "test"
  // },
  // "9sm5xK": {
  //         longURL: "http://www.google.com",
  //         userID: "test"
  // },
};

const users = {
  "someDude": {
    id: "someDude",
    email: "somedude@tinyapp.com",
    password: "youllneverguessthis"
  },
  "someCoolDude": {
    id: "someCoolDude",
    email: "cooldude@tinyapp.com",
    password: "y0u11n3v3Rgu3557H15"
  },
  "test": {
    id: "test",
    email: "test@test.com",
    password: "test"
  }
};

//project get requests

app.get("/", (_req, res) => { //root page
  res.redirect("/register");
});

app.get("/urls", (req, res) => { //list of URLS in our urlDatabase
  const templateVars = {urls: urlDatabase, user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { //page to create a new URL link
  if (!req.cookies['user_id']) {
    res.redirect("/login");
  } else {
    const templateVars = {user: users[req.cookies['user_id']]};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => { //individual page for each created URL
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {shortURL: shortURL, longURL: longURL, user: users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (_req, res) => { //JSON print out of the url database - could be called with APIs
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => { //redirect page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(`${longURL}`);
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render("urls_login", templateVars);
});

//TinyApp Post Requests - Links

app.post("/urls", (req, res) => { //add a new shortened URL
  if (!req.cookies['user_id']) {
    res.status(403).send("Must be logged on to create new links.");
  } else {
    let key = generateRandomString();
    let val = req.body.longURL;
    let user = req.cookies['user_id'];
    urlDatabase[key] = {
      longURL: val,
      userID: user
    }
    res.redirect(`/urls/${key}`);
  
  }
});

app.post("/urls/:shortURL", (req, res) => { //update
  let key = req.params.shortURL;
  let val = req.body.longURL;
  let user = req.cookies['user_id'];
  urlDatabase[key] = {
    longURL: val,
    userID: user
  }
  res.redirect('/urls/');

});

app.post("/urls/:shortURL/delete", (req, res) => { //delete
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');

});

//TinyApp POST Requests - User

app.post("/login", (req, res) => {
  const email = req.body.useremail;
  const password = req.body.userpassword;
  const user = emailLookup(email);
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password.");

  }
  if (!emailLookup(email)) {
    return res.status(403).send("Email not registered.");
  }
  if (user.password === password) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }  else {
    res.status(403).send("Password Incorrect");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
  
});

//REGISTRATION

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password.");
    
  }
  if (emailLookup(email)) {
    return res.status(400).send("Email already registered.");
  }
  
  const userID = generateRandomString();
  users[userID] = { id: userID,
    email: email,
    password: password };
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

//server loop

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});

//project functions

const generateRandomString = function() {  //generator for new shortURL
  let shortenedURL = '';
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    shortenedURL += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortenedURL;

};

const emailLookup = function(eMail) { //
  for (let key in users) {
    if (users[key].email === eMail) {
      return users[key];
    }
  }
  return false;
};