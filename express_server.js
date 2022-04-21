const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { generateRandomString, emailLookup, userIDLookup } = require('./helpers');


const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

const salt = bcrypt.genSaltSync(10);
const key1 = bcrypt.genSaltSync(12); //using genSaltSync to generate our keys for the cookieSession
const key2 = bcrypt.genSaltSync(12);

app.use(cookieSession({
  name: 'session',  //keys are long strings to increase security
  keys: [key1, key2],
}
));

app.set("view engine", "ejs");



//project databases

const urlDatabase = { //Link Database
  // "random": {
  //   longURL: "http://example.com",
  //   userID: "example"
  // }
};

const users = { //User Database
  // "example": {
  //   id: "example",
  //   email: "example@test.com",
  //   password: "3x4mpl3"
  // }
};

//project get requests

app.get("/", (req, res) => { //root page
  if (!req.session["userID"]) {
    return res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => { //list of URLS in our urlDatabase
  const user = users[req.session["userID"]];

  
  if (user) {
    const userURL = userIDLookup(user.id, urlDatabase);

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
  const userID = req.session.userID;

  if (!userID) {
    res.status(403).send("<a href='/login'> You can not edit another user's URLs.</a>");
  } else if (userID !== urlDatabase[shortURL].userID) {
    res.status(403).send("<a href='/urls'> You can not edit another user's URLs.</a>");
  }
  
  if (urlDatabase[shortURL]) {
    const templateVars = {shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[req.session["userID"]]};
    res.render("urls_show", templateVars);
  } else if (!req.session["userID"]) {
    res.status(404).send("<a href='/login'>URL not found.</a>");
  } else {
    res.status(404).send("<a href='/urls'>URL not found.</a>");
  }
});

app.get("/urls.json", (_req, res) => { //JSON print out of the url database - could be called with APIs
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => { //redirect page
  const shortURL = req.params.shortURL;
  //res.redirect(urlDatabase[shortURL].longURL);

  if (urlDatabase[shortURL]) {
    //const templateVars = {shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[req.session["userID"]]};
    res.redirect(urlDatabase[shortURL].longURL);
  } else if (!req.session["userID"]) {
    res.status(404).send("<a href='/login'>URL not found.</a>");
  } else {
    res.status(404).send("<a href='/urls'>URL not found.</a>");
  }
});

app.get('/register', (req, res) => {
  if (req.session["userID"]) {
    res.redirect('/urls');
  }
  const templateVars = {user: users[req.session["userID"]]};
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  if (req.session["userID"]) {
    res.redirect('/urls');
  }
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
    };
    res.redirect(`/urls/${key}`);
  
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
    };
    res.redirect('/urls/');
  } else {
    res.status(403).send("You can not edit another user's URLs.");
  }

});

app.post("/urls/:shortURL/delete", (req, res) => { //delete
  let shortURL = req.params.shortURL;
  let user = req.session["userID"];
  if (user === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send("You can not delete another user's URLs.");
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
  res.redirect('/login'); //the project asks to redirect to /urls, but if no one is logged in this returns an error message from GET /urls.
  
});

//REGISTRATION

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, salt);
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
