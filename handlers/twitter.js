const { utils } = require("ethers");
const { niftyContract } = require("./config/contracts");
const addresses = require("./config/addresses");
const faunadb, { query } = require("faunadb");
const BigNumber = require("bignumber.js");

require("dotenv").config();

const Twit = require("twit");

const twitter_keys = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET_KEY,
  access_token: process.env.TWITTER_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET
};

const twit = new Twit(twitter_keys);

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET
});

const hasTweeted = labelHash => {
  return client
    .query(
      query.Get(query.Match(query.Index("domain_by_label_hash"), labelHash))
    )
    .then(ret => (ret.data.hasTweeted ? true : false))
    .catch(e => false);
};

const dbUpdateTweeted = label => {
  const labelHash = utils.id(label);

  return client.query(
    query.Let(
      { ref: query.Match(query.Index("domain_by_label_hash"), labelHash) },
      query.If(
        query.Exists(query.Var("ref")),
        [
          "updated",
          query.Update(query.Select("ref", query.Get(query.Var("ref"))), {
            data: { hasTweeted: true }
          })
        ],
        [
          "created",
          query.Create(query.Class("domains"), {
            data: { label, hash: labelHash, hasTweeted: true }
          })
        ]
      )
    )
  );
};

const tweet = label => {
  return new Promise((resolve, reject) => {
    const labelHash = utils.id(label);
    const tokenId = BigNumber(labelHash).toString(10);
    const link = `https://opensea.io/assets/${addresses.nifty}/${tokenId}`;
    twit.post(
      "statuses/update",
      {
        status: `${label}.eth has just been tokenized!\n\n${link}`
      },
      (err, data, response) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      }
    );
  });
};

module.exports = (event, cb) => {
  if (!event.body || !JSON.parse(event.body).label) {
    return cb(null, {
      statusCode: 500,
      body: "Label not provided"
    });
  }
  const label = JSON.parse(event.body).label;
  const labelHash = utils.id(label);

  niftyContract.functions
    .exists(labelHash)
    .then(async exists => {
      if (!exists) {
        throw { name: "Error", message: `${label}.eth is not tokenized` };
      }
      if (await hasTweeted(labelHash)) {
        throw {
          name: "Error",
          message: `${label}.eth has been tweeted already`
        };
      }
      await dbUpdateTweeted(label);
      await tweet(label);
      cb(null, {
        statusCode: 200,
        body: "OK"
      });
    })
    .catch(err =>
      cb(null, { statusCode: 400, body: err.name + ": " + err.message })
    );
};
