/* 
Tiny URL app:
Author:   Joseph Cortina
Date:     October 11, 2017
Version:  1.0
Description:
  This app will, when give a regular URL string, generate
  a unique tiny URL alias.
*/
const alphaNum = ["a", "b", "0", "c", "d", "1", "e", "f", "2", "g", "h", "3", "i", "j", "4", "k", "l", "5", "m", "n", "6", "o", "p", "7", "q", "r", "8", "s", "t", "9", "u", "v", "w", "x", "y", "z"];

function genRandString()  {
  // generate 6 random alphanumeric chars, return as string
  let tinyString = "";
  let seed = Math.random();

  for (let ix = 1; ix <= 6; ix++) {
    // select character 0-9, a -z from alphaNum array randomly
    let charSel = alphaNum[Math.floor(Math.random(seed) * 36 )];
    // do coin flip - if 'heads', flip char to uppercase
    charSel = Math.floor(Math.random() * 2) ? charSel : charSel.toUpperCase();
  }
  return tinyString;
} 


var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());

var PORT = process.env.PORT || 8080; // default port 8080
const domain = "http://localhost:8080/"

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// define template variables as global, initialize to urlDatabse, domain
var templateVars = {urls: urlDatabase, root: domain};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  console.log("Hello there");
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(domain + "urls");
});
// post log-in information
app.post("/login", (req, res) => {
  //console.log(req.body.username);
  res.cookie("username", req.body.username);
  //add cookie to template variables
  templateVars.username = req.body.username;
  res.redirect(domain + "urls");  
});
// log-out requested - clear cookie, remove from templateVars
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  delete templateVars.username;
  res.redirect(domain + "/urls");
  
});
// get methon for update URL page
app.get("/urls/:id/update", (req, res) => {
  res.render("urls_show", { shortURL: req.params.id, longURL: urlDatabase[req.params.id] });
});
// update a long URL for a given short URL
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(domain + "urls"); 
});
app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  // get tiny URL, add it and long one to urlDatabase
  let tinyString = genRandString();
  urlDatabase[tinyString] = req.body.longURL; 
  // redirect response to urlRoot + tinyString
  res.redirect(domain + 'urls' + tinyString);
});
app.get("/u/:shortURL", (req, res) => {
  // let longURL = ...
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Example app listening on port ${PORT}!`);
}) 
