const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { generateRandomString, emailLookup, userIDLookup } = require('./helpers')


const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}
));

app.set("view engine", "ejs");

//project databases

const urlDatabase = { //Link Database
  // "b2xVn2": {
  //         longURL: "http://www.lighthouselabs.ca",
  //         userID: "test"
  // },
  // "9sm5xK": {
  //         longURL: "http://www.google.com",
  //         userID: "test"
  // },
  // "test11": {
  //   longURL: "test.com",
  //   userID: "someDude"
  // }
};

const users = { //User Databse
  // "someDude": {
  //   id: "someDude",
  //   email: "somedude@tinyapp.com",
  //   password: "youllneverguessthis"
  // },
  // "someCoolDude": {
  //   id: "someCoolDude",
  //   email: "cooldude@tinyapp.com",
  //   password: "y0u11n3v3Rgu3557H15"
  // },
  // "test": {
  //   id: "test",
  //   email: "test@test.com",
  //   password: "test1"
  // }
};

//project get requests

app.get("/", (req, res) => { //root page
  if(!req.session["userID"]) { 
  return res.redirect("/register");
  } else {
  res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => { //list of URLS in our urlDatabase
  const user = users[req.session["userID"]];
  if (user) {
  const userURL = userIDLookup(user.id, urlDatabase)

  const templateVars = {urls: userURL, user: user};
  res.render("urls_index", templateVars);
  } else {
    res.status(403).send("<a href='/login'> No user logged in. </a>");
  } 
});

app.get("/urls/new", (req, res) => { //page to create a new URL link
  if (!req.session["userID"]) { 
    res.status(403).send("<a href='/login'> No user logged in. </a>");
  } else {
    const templateVars = {user: users[req.session["userID"]]};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => { //individual page for each created URL
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {shortURL: shortURL, longURL: longURL, user: users[req.session["userID"]]};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (_req, res) => { //JSON print out of the url database - could be called with APIs
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => { //redirect page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.session["userID"]]};
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {user: users[req.session["userID"]]};
  res.render("urls_login", templateVars);
});

//TinyApp Post Requests - Links

app.post("/urls", (req, res) => { //add a new shortened URL
  if (!req.session["userID"]) { 
    res.status(403).send("Must be logged on to create new links.");
  } else {
    let key = generateRandomString();
    let val = req.body.longURL;
    let user = req.session["userID"]; 
    urlDatabase[key] = {
      longURL: val,
      userID: user
    }
    res.redirect('/urls/');
  
  }
});

app.post("/urls/:shortURL", (req, res) => { //update
  let key = req.params.shortURL;
  let val = req.body.longURL;
  let user = req.session["userID"]; 

  if (user === urlDatabase[key].userID) {
    urlDatabase[key] = {
      longURL: val,
      userID: user
    }
    res.redirect('/urls/');
  } else {
    res.status(403).send("You can not edit another user's URLs.")
  }
  

});

app.post("/urls/:shortURL/delete", (req, res) => { //delete
  let shortURL = req.params.shortURL;
  let user = req.session["userID"]; 
  if(user === urlDatabase[shortURL].userID) {

  delete urlDatabase[shortURL];
  res.redirect('/urls');
} else {
  res.status(403).send("You can not delete another user's URLs.")
}
});

//TinyApp POST Requests - User

app.post("/login", (req, res) => {
  const email = req.body.useremail;
  const password = req.body.userpassword;
  const user = emailLookup(email, users);
  if (!email || !password) {
    return res.status(400).send("<a href='/login'>Please enter a valid email and password.</a>");

  }
  if (!emailLookup(email, users)) {
    return res.status(403).send("<a href='/login'>Email not registered.</a>");
  }
  if (bcrypt.compareSync(password, user.password)) {
    req.session['userID'] = user.id;
    return res.redirect('/urls');
  }  else {
    res.status(403).send("<a href='/login'>Password Incorrect</a>");
  }

});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
  
});

//REGISTRATION

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) {
    return res.status(400).send("<a href='/register'>Please enter a valid email and password.</a>");
    
  }
  if (emailLookup(email, users)) {
    return res.status(400).send("<a href='/register'>Email already registered.</a>");
  }
  
  const userID = generateRandomString();
  users[userID] = { id: userID,
    email: email,
    password: hashedPassword };
  req.session['userID'] = userID;
  res.redirect('/urls');
});

//server loop

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});
