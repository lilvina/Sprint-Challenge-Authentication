const axios = require('axios');
const { authenticate } = require('../auth/authenticate.js');
const db = require('../database/dbConfig.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || "keep it a secret";

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  let user = req.body
  const hash = bcrypt.hashSync(user.password, 8)
  user.password = hash

  db('users').insert(user).then(response => {
    res.status(201).json(response)
  }).catch(err => res.status(500).json(err))
}

function login(req, res) {
  // implement user login
  let { username, password } = req.body
  db('users')
    .where({ username })
    .first()
    .then(user => {
      if(user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user)

        res.status(200).json({
          message: `Welcome ${user.username}!`,
          token,
        })
      } else {
        res.status(401).json({ message: 'Invalid Credentials' })
      }
    }).catch(err => {console.log(err); res.status(500).json(err)})
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}

function generateToken(user){
  const payload = {
    subject: user.id,
    username: user.username
  };
  const options = {
    expiresIn: '1d'
  };

  return jwt.sign(payload, secret, options)
}
