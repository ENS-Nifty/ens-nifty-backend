const faunadb = require('faunadb')
const BigNumber = require('bignumber.js')
const config = require('../config')

const client = new faunadb.Client(config.faunadb)

function mod (numberOne, numberTwo) {
  return BigNumber(`${numberOne}`)
    .mod(BigNumber(`${numberTwo}`))
    .toString()
}

function rarebitsFormat (imageUrl, homeUrl, dateRegistered, lockedEther) {
  return {
    image_url: imageUrl,
    home_url: homeUrl,
    properties: [
      { key: 'locked-ether', value: parseFloat(lockedEther), type: 'integer' },
      { key: 'date-registered', value: dateRegistered, type: 'string' }
    ]
  }
}

function openseaFormat (imageUrl, homeUrl, dateRegistered, lockedEther) {
  return {
    image: imageUrl,
    external_url: homeUrl,
    background_color: 'FFFFFF',
    attributes: { lockedEther: parseFloat(lockedEther), dateRegistered }
  }
}

module.exports = (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept'
  }

  if (!req.query || !req.query.hash) {
    return res.status(500).send('Hash not provided')
  }

  if (req.query.hash.toLowerCase().substr(0, 2) !== '0x') {
    let foo = new BigNumber(req.query.hash)
    req.query.hash = '0x' + foo.toString(16)
  }
  req.query.hash =
    '0x' +
    req.query.hash
      .toLowerCase()
      .replace('0x', '')
      .padStart(64, '0')

  const labelHash = req.query.hash.toLowerCase()

  console.log({labelHash})

  if (labelHash == '0x3bf87c5c609b6a0e5b0daa400c18c396b1db1c927e55a0e1d61405b756e2b0b8') {
    let imageUrl = 'https://picsum.photos/200'
    let homeUrl = 'https://google.com'
    return res
        .status(200)
        .set(headers)
        .send({
          name: 'foo bar',
          description: `foo baz`,
          image: imageUrl,
          external_url: homeUrl,
          // background_color: 'FFFFFF',
          // attributes: { lockedEther: parseFloat(lockedEther), dateRegistered }
          image_url: imageUrl,
          home_url: homeUrl,
          // properties: [
          //   { key: 'locked-ether', value: parseFloat(lockedEther), type: 'integer' },
          //   { key: 'date-registered', value: dateRegistered, type: 'string' }
          // ]
        })
  }

  return client
    .query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('domain_by_label_hash'),
          labelHash
        )
      )
    )
    .then(ret => ret.data)
    .then(data => {
      const hue = mod(labelHash, 360)
      const tokenID = BigNumber(labelHash).toString(10)
      const lockedEther = data.lockedEther ? data.lockedEther : '?'
      const dateRegistered = data.dateRegistered ? data.dateRegistered : '?'
      const label = data.label ? data.label : '?'
      const homeUrl = `https://etherscan.io/token/${
        config.addresses.nifty
      }?a=${tokenID}`
      const imageUrl = `https://res.cloudinary.com/dszcbwdrl/image/upload/e_hue:${hue}/v1537475886/token.png`

      res
        .status(200)
        .set(headers)
        .send({
          name: label + '.eth',
          description: `ENS domain bought on ${dateRegistered} for ${lockedEther} ether. The owner of the '${label}.eth' token may untokenize the name for use at ensnifty.com`,
          ...rarebitsFormat(imageUrl, homeUrl, dateRegistered, lockedEther),
          ...openseaFormat(imageUrl, homeUrl, dateRegistered, lockedEther)
        })
    })
    .catch(err => {
      if (err.name === 'NotFound' && err.message === 'instance not found') {
        const labelHash = req.query.hash.toLowerCase()
        const hue = mod(labelHash, 360)
        const tokenID = BigNumber(labelHash).toString(10)
        const homeUrl = `https://etherscan.io/token/${
          config.addresses.nifty
        }?a=${tokenID}`
        const imageUrl = `https://res.cloudinary.com/dszcbwdrl/image/upload/e_hue:${hue}/v1537475886/token.png`
        const dateRegistered = '?'
        const lockedEther = '?'
        res
          .status(200)
          .set(headers)
          .send({
            name: 'Unknown',
            description: 'The name of this hash is unknown',
            ...rarebitsFormat(imageUrl, homeUrl, dateRegistered, lockedEther),
            ...openseaFormat(imageUrl, homeUrl, dateRegistered, lockedEther)
          })
      } else {
        res.status(400).send(err.name + ':' + err.message)
      }
    })
}
