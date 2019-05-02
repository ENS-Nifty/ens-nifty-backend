const { utils } = require('ethers')
const faunadb = require('faunadb')
const config = require('../config')

const client = new faunadb.Client(config.faunadb)

module.exports = (req, res) => {
  if (!req.body || !req.body.label) {
    return res.status(500).send('Label not provided')
  }
  const { label } = req.body
  const hash = utils.id(label)
  return client
    .query(
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
                data: { label, hash }
              }
            )
          ],
          [
            'created',
            faunadb.query.Create(faunadb.query.Class('domains'), {
              data: { label, hash }
            })
          ]
        )
      )
    )
    .then(ref => res.status(200).send('OK'))
    .catch(err => res.status(400).send(err.name + ':' + err.message))
}
