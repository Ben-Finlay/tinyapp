const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = { //Example 'database'
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => { //root page
  res.redirect("/urls");
});

app.get("/hello", (req, res) => { //Test Page
  const templateVars = { greeting: 'Hello World!'};
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => { //list of URLS in our urlDatabase
  const templateVars = {urls: urlDatabase, username: req.cookies['username']};
  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => { //page to create a new URL link
  const templateVars = {username: req.cookies['username']}
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => { //individual page for each created URL
  const shortURL = req.params.shortURL;
  const templateVars = {shortURL: shortURL, longURL: urlDatabase[shortURL], username: req.cookies['username']};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => { //JSON print out of the url database - could be called with APIs
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => { //redirect page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(`${longURL}`);
})

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
  res.cookie('username', req.body.username);
  res.redirect('/urls')

});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls')
  
});


app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});

function generateRandomString() {  //generator for new shortURL
  let shortenedURL = '';
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    shortenedURL += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortenedURL;

}