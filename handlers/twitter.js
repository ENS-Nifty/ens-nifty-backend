const { utils } = require('ethers')
const faunadb = require('faunadb')
const BigNumber = require('bignumber.js')
const Twit = require('twit')
const config = require('../config')

const twit = new Twit(config.twitter)

const client = new faunadb.Client(config.faunadb)

const hasTweeted = labelHash => {
  return client
    .query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('domain_by_label_hash'),
          labelHash
        )
      )
    )
    .then(ret => !!ret.data.hasTweeted)
    .catch(e => false)
}

const dbUpdateTweeted = label => {
  const labelHash = utils.id(label)

  return client.query(
    faunadb.query.Let(
      {
        ref: faunadb.query.Match(
          faunadb.query.Index('domain_by_label_hash'),
          labelHash
        )
      },
      faunadb.query.If(
        faunadb.query.Exists(faunadb.query.Var('ref')),
        [
          'updated',
          faunadb.query.Update(
            faunadb.query.Select(
              'ref',
              faunadb.query.Get(faunadb.query.Var('ref'))
            ),
            {
              data: { hasTweeted: true }
            }
          )
        ],
        [
          'created',
          faunadb.query.Create(faunadb.query.Class('domains'), {
            data: { label, hash: labelHash, hasTweeted: true }
          })
        ]
      )
    )
  )
}

const tweet = label => {
  return new Promise((resolve, reject) => {
    const labelHash = utils.id(label)
    const tokenId = BigNumber(labelHash).toString(10)
    const link = `https://opensea.io/assets/${
      config.addresses.nifty
    }/${tokenId}`
    twit.post(
      'statuses/update',
      {
        status: `${label}.eth has just been tokenized!\n\n${link}`
      },
      (err, data, response) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      }
    )
  })
}

module.exports = (req, res) => {
  if (!req.body || !req.body.label) {
    return res.status(500).send('Label not provided')
  }
  const { label } = req.body
  const labelHash = utils.id(label)

  config.contracts.nifty.functions
    .exists(labelHash)
    .then(async exists => {
      if (!exists) {
        throw new Error(`${label}.eth is not tokenized`)
      }
      if (await hasTweeted(labelHash)) {
        throw new Error(`${label}.eth has been tweeted already`)
      }
      await dbUpdateTweeted(label)
      await tweet(label)
      res.status(200).send('OK')
    })
    .catch(err => res.status(400).send(err.name + ': ' + err.message))
}
