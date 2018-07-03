const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const axios = require('axios');

require('dotenv').config();
const app = express();
massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

app.use(bodyPaser.json());
app.use(session({
  secret: "secret123413462457635",
  saveUninitialized: false,
  resave: false,
}));
// app.use(express.static(`${__dirname}/../build`));

app.post('/api/register', (req, res) => {
  const db = app.get('db');
  const { username, password } = req.body;
  bcrypt.hash(password, saltRounds).then(hashedPassword => {
    db.create_user([username, hashedPassword]).then(() => {
      req.session.user = { username };
      res.json({ user: req.session.user })
    }).catch(error => {
      console.log('error', error);
      res.status(500).json({ message: 'Something bad happened! '})
    });
  });
});

app.post('/api/login', (req, res) => {
  const db = app.get('db');
  const { username, password } = req.body;
  db.find_user([username]).then(users => {
    if (users.length) {
      bcrypt.compare(password, users[0].password).then(doPasswordsMatch => {
        if (doPasswordsMatch) {
          req.session.user = { username: users[0].username };
          res.json({ user: req.session.user });
        } else {
          res.status(403).json({ message: 'Wrong password' });
        }
      });
    } else {
      res.status(403).json({ message: "That user is not registered" })
    }
  });
});


app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.status(200).send();
});

function ensureLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'You are not authorized' });
  }
}

app.get('/secure-data', ensureLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
