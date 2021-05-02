const express = require('express')
const logger = require('morgan')
const helmet = require('helmet')
const config = require('./config')
const {
  addLabel,
  addMetadata,
  metadata,
  retrieveHash,
  retrieveLabel,
  twitter
} = require('./handlers')

const app = express()

app.use(logger(config.debug ? 'dev' : false))
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/add-label', (req, res) => {
  addLabel(req, res)
})

app.get('/add-metadata', (req, res) => {
  addMetadata(req, res)
})

app.get('/metadata', (req, res) => {
  metadata(req, res)
})

app.get('/retrieve-hash', (req, res) => {
  retrieveHash(req, res)
})

app.get('/retrieve-label', (req, res) => {
  retrieveLabel(req, res)
})

app.get('/twitter', (req, res) => {
  twitter(req, res)
})

app.listen(config.port, () => {
  console.log('hello??')
  console.log(`Listening on localhost:${config.port}`)
})
