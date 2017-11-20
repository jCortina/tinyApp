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

var users = {
  "userRandomID": {
    id: "userRandomID",
    email: "bob@example.com",
    password: "$2a$10$Lk0nr6azGvO2i9.t9//sz.u3sMEY.WKYB7DFz1rbN/2RGQjUn5eZe"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "jh8H6m": {
    id: "jh8H6m",
    email: "tim@example.com",
    password: "timthetoolman"
  }
}
var urlDatabase = {
  "b2xVn2":
    { userID: "userRandomID",
         url: "http://www.lighthouselabs.ca"
    },
  "b2xVn3":
    { userID: "userRandomID",
         url: "http://www.thegreatpub.ca"
    },
  "b2xVn4":
    { userID: "userRandomID",
         url: "http://www.jusstanotherlongname.com"
    },
  "b2xVn5":
    { userID: "userRandomID",
         url: "http://www.anotheruselesswebsite.com"
    },
  "b2xVn6":
    { userID: "userRandomID",
         url: "http://www.yetanotherwebsite.ca"
    },
  "b2xVn7":
    { userID: "userRandomID",
         url: "http://www.prettydamgoodone.com"
    },
  "9sm5xK":
    { userID: "user2RandomID",
         url: "http://www.google.com"
    },
  "jh8H6m":
    { userID: "jh8H6m",
         url: "http://www.mydomain.com"
    }
  };

function genRandString()  {
  // generate 6 random alphanumeric chars, return as string
  let tinyString = "";
  let seed = Math.random();

  for (let ix = 1; ix <= 6; ix++) {
    // select character 0-9, a -z from alphaNum array randomly
    let charSel = alphaNum[Math.floor(Math.random(seed) * 36 )];
    // do coin flip - if 'heads', flip char to uppercase
    charSel = Math.floor(Math.random() * 2) ? charSel : charSel.toUpperCase();
    tinyString = tinyString + charSel;
  }
  return tinyString;
}
// filter urlsDatabase; return only urls for a given user
function urlsForUser(id, loggedIn)  {
  let urls = [];
  for (let tinyURL in urlDatabase)  {
    //if id is not null include only for specific user, else all
    if (loggedIn) {
      if (urlDatabase[tinyURL].userID === id)  {
        urls.push({"tinyURL": tinyURL, "bigURL": urlDatabase[tinyURL].url});
      }
      } else {
        urls.push({"tinyURL": tinyURL, "bigURL": urlDatabase[tinyURL].url});
    }
  }
  return urls;
}

var express = require("express");
var cookieSession = require('cookie-session');
var app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

var PORT = process.env.PORT || 8080; // default port 8080
const domain = "http://localhost:8080/";

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

app.get("/", (req, res) => {
  // if user logged in redirect to /urls, otherwise /login
  if ("user_id" in req.session) {
    res.redirect(domain + "urls");
  } else {
    res.redirect(domain + "login");
  }
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;  //*
  const loggedIn = user_id ? true : false;  //*
  //get subset of urls for this user
  //const user_id = "userRandomID"; //***
  //const loggedIn = true;          // ***
  let userUrls = urlsForUser(user_id, loggedIn);  
  const templateVars = {root: domain, userID: user_id, urls: userUrls, loggedIn: loggedIn, user: users[user_id]};
  res.render("urls_index", templateVars); 
});

//create a new tiny url -only allow for registered users
app.get("/urls/:id/new", (req, res) => {
  if (!("user_id" in req.session)) {   
    res.redirect(domain + "login");
  } else {
  //create a random tinyURL
  const userID = req.session.user_id;
  const tinyURL = genRandString();
  templateVars = {user: users[req.params.id], userID: userID, tinyURL: tinyURL};
  res.render("urls_new", templateVars);
  }
});

//post newly created tinyURL/longURL combo - update data
app.post("/urls/:id/new/", (req, res) => {
  urlDatabase[req.params.id] = {userID: req.session.user_id, url: req.body.longURL};
  res.redirect(domain + "urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(domain + "urls");
});

// process the Get login
app.get("/login", (req, res) => {
  res.render("login");
});
// post log-in information
app.post("/login", (req, res) => {
  //when email or password blank or empty - error
  if (req.body.email === "" || req.body.password === "")  {
    res.status(400);
    res.send("ERROR: email or password missing");
  }
  //ensure email exists, otherwise error
  let emailFound = false;
  for (var user in users) {
    if (users[user].email === req.body.email) {
      emailFound = true;
      break;
    }
  }
  //if email not found, send error page
  if (!emailFound)  {
    res.status(403);
    res.send("ERROR: Invalid email");
  }
  //if password not match, error
  if (!bcrypt.compareSync(req.body.password, users[user].password))  {
    res.status(403);
    res.send("ERROR: Password is invalid");
  }
  req.session.user_id = user;
  res.redirect(domain + "urls");
});
// log-out requested - clear cookie, remove from templateVars
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(domain + "urls");

});
// get method for update URL page
app.get("/urls/:id/update", (req, res) => {
  const tinyURL = req.params.id;
  const user = users[req.session.user_id];
  const templateVars = { user: user, userID: user.id, tinyURL: tinyURL, longURL: urlDatabase[req.params.id].url };
  res.render("urls_show", templateVars);
});
// update a long URL for a given short URL
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect(domain + "urls");
});
// get request for the registration page
app.get("/register", (req, res) => {
  if ("user_id" in req.session) {
    res.redirect(domain + "urls");
  } else {
  res.render("user_register");
  }
});
// handle postings of registration requests
app.post("/register", (req, res) => {
  //when email or password blank or empty - error
  if (req.body.email === "" || req.body.password === "")  {
     res.status(400);
     res.send("ERROR: email or password missing");
     return;
  }
  //go through users, check for existence of user with same email
  for (let usr in users)  {
    if (users[usr].email === req.body.email) {
      res.status(400);
      res.send("ERROR: email already exists");
    return;
    }
  }
  //gen user id, add it and email, password to users database
  let newID = genRandString();
  users[newID] = {};
  users[newID].id = newID;
  users[newID].email = req.body.email;
  let passwrd = req.body.password;
  let passHash = bcrypt.hashSync(passwrd, 10);
  users[newID].password = passHash;
  req.session.user_id = newID;
  res.redirect(domain + "urls");
});
app.post("/urls", (req, res) => {
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
  const user = users[req.session.user_id];
  let templateVars = { user: user, usershortURL: req.params.id, userID: user.id};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Example app listening on port ${PORT}!`);
});
