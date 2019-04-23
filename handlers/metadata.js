const addresses = require("./config/addresses");
const faunadb, { query } = require("faunadb");
const BigNumber = require("bignumber.js");

require("dotenv").config();

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET
});

function mod(numberOne, numberTwo) {
  return BigNumber(`${numberOne}`)
    .mod(BigNumber(`${numberTwo}`))
    .toString();
}

function rarebitsFormat(imageUrl, homeUrl, dateRegistered, lockedEther) {
  return {
    image_url: imageUrl,
    home_url: homeUrl,
    properties: [
      { key: "locked-ether", value: parseFloat(lockedEther), type: "integer" },
      { key: "date-registered", value: dateRegistered, type: "string" }
    ]
  };
}

function openseaFormat(imageUrl, homeUrl, dateRegistered, lockedEther) {
  return {
    image: imageUrl,
    external_url: homeUrl,
    background_color: "FFFFFF",
    attributes: { lockedEther: parseFloat(lockedEther), dateRegistered }
  };
}

module.exports = (event, cb) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept"
  };
  if (!event.queryStringParameters || !event.queryStringParameters.hash) {
    return cb(null, { statusCode: 500, body: "Hash not provided" });
  }

  if (event.queryStringParameters.hash.toLowerCase().substr(0, 2) !== "0x") {
    let foo = new BigNumber(event.queryStringParameters.hash);
    event.queryStringParameters.hash = "0x" + foo.toString(16);
  }
  event.queryStringParameters.hash =
    "0x" +
    event.queryStringParameters.hash
      .toLowerCase()
      .replace("0x", "")
      .padStart(64, "0");

  const labelHash = event.queryStringParameters.hash.toLowerCase();
  return client
    .query(query.Get(query.Match(query.Index("domain_by_label_hash"), labelHash)))
    .then(ret => ret.data)
    .then(data => {
      const hue = mod(labelHash, 360);
      const tokenID = BigNumber(labelHash).toString(10);
      const lockedEther = data.lockedEther ? data.lockedEther : "?";
      const dateRegistered = data.dateRegistered ? data.dateRegistered : "?";
      const label = data.label ? data.label : "?";
      const homeUrl = `https://etherscan.io/token/${
        addresses.nifty
      }?a=${tokenID}`;
      const imageUrl = `https://res.cloudinary.com/dszcbwdrl/image/upload/e_hue:${hue}/v1537475886/token.png`;
      cb(null, {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          name: label + ".eth",
          description: `ENS domain bought on ${dateRegistered} for ${lockedEther} ether. The owner of the '${label}.eth' token may untokenize the name for use at ensnifty.com`,
          ...rarebitsFormat(imageUrl, homeUrl, dateRegistered, lockedEther),
          ...openseaFormat(imageUrl, homeUrl, dateRegistered, lockedEther)
        })
      });
    })
    .catch(err => {
      if (err.name === "NotFound" && err.message === "instance not found") {
        const labelHash = event.queryStringParameters.hash.toLowerCase();
        const hue = mod(labelHash, 360);
        const tokenID = BigNumber(labelHash).toString(10);
        const homeUrl = `https://etherscan.io/token/${
          addresses.nifty
        }?a=${tokenID}`;
        const imageUrl = `https://res.cloudinary.com/dszcbwdrl/image/upload/e_hue:${hue}/v1537475886/token.png`;
        const dateRegistered = "?";
        const lockedEther = "?";
        cb(null, {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            name: "Unknown",
            description: "The name of this hash is unknown",
            ...rarebitsFormat(imageUrl, homeUrl, dateRegistered, lockedEther),
            ...openseaFormat(imageUrl, homeUrl, dateRegistered, lockedEther)
          })
        });
      } else {
        cb(null, { statusCode: 400, body: err.name + ":" + err.message });
      }
    });
};
