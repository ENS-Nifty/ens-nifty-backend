const faunadb = require('faunadb')
const moment = require('moment')
const { utils } = require('ethers')
const config = require('../config')

const client = new faunadb.Client(config.faunadb)

module.exports = (req, res) => {
  if (!req.body || !req.body.label) {
    return res.status(500).send('Label not provided')
  }
  const { label } = req.body
  const hash = utils.id(label)
  config.contracts.registrar.functions
    .entries(hash)
    .then(entryInfo => {
      const dateRegistered = moment(+entryInfo[2] * 1000).format('MM/DD/YYYY')
      const lockedEther = utils.formatEther(entryInfo[3])
      return client.query(
        faunadb.query.Let(
          {
            ref: faunadb.query.Match(
              faunadb.query.Index('domain_by_label_hash'),
              hash
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
                  data: { dateRegistered, lockedEther }
                }
              )
            ],
            [
              'created',
              faunadb.query.Create(faunadb.query.Class('domains'), {
                data: { label, hash, dateRegistered, lockedEther }
              })
            ]
          )
        )
      )
    })
    .then(ref => res.status(200).send('OK'))
    .catch(err => res.status(400).send(err.name + ':' + err.message))
}
