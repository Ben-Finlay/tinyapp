//TinyApp requirements

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { generateRandomString, emailLookup, userIDLookup } = require('./helpers');

//Server setup

const app = express();
const PORT = 8080; // default port 8080

//Hash values, and cookieSession keys

const salt = bcrypt.genSaltSync(10);
const key1 = bcrypt.genSaltSync(12); //using genSaltSync to generate our keys for the cookieSession
const key2 = bcrypt.genSaltSync(12);


//App Use requirements

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [key1, key2], //keys are long randomized strings to increase security
}
));

app.set("view engine", "ejs");

//TinyApp Databases for URLs and Users

const urlDatabase = { //Link Database

};

const users = { //User Database

};

//TinyApp GET Requests

//Root page
app.get("/", (req, res) => {
  if (!req.session["userID"]) {
    return res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//Users Short URL List
app.get("/urls", (req, res) => {
  const user = users[req.session["userID"]];
  //If User is Logged in, run userIdLookup to retrieve and display their links.
  if (user) {
    const userURL = userIDLookup(user.id, urlDatabase);
    const templateVars = {urls: userURL, user: user};
    res.render("urls_index", templateVars);
  //If no user is logged on, redirect them to the login page.
  } else {
    res.status(403).send("<a href='/login'> No user logged in. </a>");
  }
});

//A Page where a logged in user can create a new Short URL
app.get("/urls/new", (req, res) => {
  if (!req.session["userID"]) {
    res.status(403).send("<a href='/login'> No user logged in. </a>");
  } else {
    const templateVars = {user: users[req.session["userID"]]};
    res.render("urls_new", templateVars);
  }
});

//Individual Page for a Short URL, provides an option to edit the URL it links to
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  //If there is no user logged in, prevents editting existing URLs
  if (!userID) {
    res.status(403).send("<a href='/login'> You can not edit another user's URLs.</a>");
  //If the user logged in is not the creator of the short URL, prevents editting that URL
  } else if (userID !== urlDatabase[shortURL].userID) {
    res.status(403).send("<a href='/urls'> You can not edit another user's URLs.</a>");
  }
  //Allows the user to Edit their URL
  if (urlDatabase[shortURL]) {
    const templateVars = {shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[req.session["userID"]]};
    res.render("urls_show", templateVars);
  //If the shortURL does not exist return an error message.
  } else if (!req.session["userID"]) {
    res.status(404).send("<a href='/login'>URL not found.</a>");
  } else {
    res.status(404).send("<a href='/urls'>URL not found.</a>");
  }
});

//Redirect page from the short URL to the linked URL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  //Checks to make sure the shortURL exists.
  if (urlDatabase[shortURL]) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else if (!req.session["userID"]) {
    res.status(404).send("<a href='/login'>URL not found.</a>");
  } else {
    res.status(404).send("<a href='/urls'>URL not found.</a>");
  }
});

//User Registration Page
app.get('/register', (req, res) => {
  if (req.session["userID"]) {
    res.redirect('/urls');
  }
  const templateVars = {user: users[req.session["userID"]]};
  res.render("urls_register", templateVars);
});

//User Login Page
app.get('/login', (req, res) => {
  if (req.session["userID"]) {
    res.redirect('/urls');
  }
  const templateVars = {user: users[req.session["userID"]]};
  res.render("urls_login", templateVars);
});

//TinyApp POST Requests - Links

//Adds a new short URL
app.post("/urls", (req, res) => {
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

//Updates an existing short URL
app.post("/urls/:shortURL", (req, res) => {
  let key = req.params.shortURL;
  let val = req.body.longURL;
  let user = req.session["userID"];
  
  if (user === urlDatabase[key].userID) {
    urlDatabase[key] = {
      longURL: val,
      userID: user
    };
    res.redirect('/urls/');
  //Prevents anyone but the creator of the link to edit.
  } else {
    res.status(403).send("You can not edit another user's URLs.");
  }
});

//Deletes an existing short URL
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  let user = req.session["userID"];
  if (user === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  //Prevents anyone but the creator of the link to delete
  } else {
    res.status(403).send("You can not delete another user's URLs.");
  }
});

//TinyApp POST Requests - User

//Logs the User in.
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

//Logs the User Out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login'); //the project asks to redirect to /urls, but if no one is logged in this returns an error message from GET /urls.
  
});

//Registers the User.
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

//Server Loop
app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});
