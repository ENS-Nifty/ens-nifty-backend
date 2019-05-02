const { utils } = require('ethers')

module.exports = (req, res) => {
  if (!req.body || !req.body.label) {
    return res.status(500).send('Label not provided')
  }
  const { label } = req.query
  const hash = utils.id(label)
  res.status(200).send(hash)
}
