const ethers = require('ethers')
const dotenv = require('dotenv')
const { ensJson, registrarJson, niftyJson } = require('./abi')

dotenv.config()

const env = process.env.NODE_ENV || 'development'
const debug = env !== 'production'

const addresses = {
  ens: '0x314159265dD8dbb310642f98f50C066173C1259b',
  registrar: '0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef',
  nifty: '0x7c523c42AD255E5b270B12fEE2Ecc1103e88a9dC'
}

const provider = new ethers.providers.InfuraProvider('mainnet')
const ens = new ethers.Contract(addresses.ens, ensJson, provider)
const registrar = new ethers.Contract(
  addresses.registrar,
  registrarJson,
  provider
)
const nifty = new ethers.Contract(addresses.nifty, niftyJson, provider)

const contracts = { ens, registrar, nifty }

module.exports = {
  env: env,
  debug: debug,
  port: process.env.PORT || env === 'production' ? 5000 : 5001,
  twitter: {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET_KEY,
    access_token: process.env.TWITTER_TOKEN,
    access_token_secret: process.env.TWITTER_TOKEN_SECRET
  },
  faunadb: {
    secret: process.env.FAUNADB_SECRET
  },
  addresses: addresses,
  contracts: contracts
}
