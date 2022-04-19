const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const e = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//project databases

const urlDatabase = { //Example 'database'
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  }
}

//project get requests

app.get("/", (req, res) => { //root page
  res.redirect("/register");
});

app.get("/hello", (req, res) => { //Test Page
  const templateVars = { greeting: 'Hello World!'};
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => { //list of URLS in our urlDatabase
  const templateVars = {urls: urlDatabase, user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => { //page to create a new URL link
  const templateVars = {user: users[req.cookies['user_id']]}
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => { //individual page for each created URL
  const shortURL = req.params.shortURL;
  const templateVars = {shortURL: shortURL, longURL: urlDatabase[shortURL], user: users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => { //JSON print out of the url database - could be called with APIs
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => { //redirect page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(`${longURL}`);
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render("urls_register", templateVars)
});

//project post requests

app.post("/urls", (req, res) => { //add a new shortened URL
  let key = generateRandomString();
  let val = req.body.longURL;
  urlDatabase[key] = val;
  res.redirect(`/urls/${key}`); 
});

app.post("/urls/:shortURL", (req, res) => { //update
  let key = req.params.shortURL;
  let val = req.body.longURL;
  urlDatabase[key] = val;
  res.redirect(`/urls/${key}`);

});

app.post("/urls/:shortURL/delete", (req, res) => { //delete
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')

});

app.post("/login", (req, res) => {
  res.cookie('user_id', users.user_id);
  res.redirect('/urls')

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls')
  
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    console.log(users)  
    return res.status(400).send("Please enter a valid email and password.")  
    
  }
  if (!emailDupe(email)) {
    return res.status(400).send("Email already registered.")  
  }
  
  const userID = generateRandomString();
  users[userID] = { id: userID, 
    email: email, 
    password: password };
    console.log(users)
  res.cookie('user_id', userID);
  res.redirect('/urls')
})

//server loop

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});

//project functions

function generateRandomString() {  //generator for new shortURL
  let shortenedURL = '';
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    shortenedURL += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortenedURL;

}

const emailDupe = function(eMail) {
  for (key in users) {
    if(users[key].email === eMail) {
      return false;
    }
  }
  return true;
}

      // res.status(400);
      // res.send("Email already registered.")
