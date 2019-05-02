const faunadb = require('faunadb')
const config = require('../config')

const client = new faunadb.Client(config.faunadb)

module.exports = (req, res) => {
  if (!req.query || !req.query.hash) {
    return res.status(500).send('Hash not provided')
  }
  const hash = '0x' + req.query.hash.replace('0x', '').padStart(64, 0)
  return client
    .query(
      faunadb.query.Get(
        faunadb.query.Match(faunadb.query.Index('domain_by_label_hash'), hash)
      )
    )
    .then(ret => res.status(200).send(ret.data.label))
    .catch(err => res.status(400).send(err.name + ':' + err.message))
}
