const faunadb, { query  } = require("faunadb");
const moment = require("moment");
const { utils } = require("ethers");
const { registrarContract } = require("./config/contracts");

require("dotenv").config();

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET
});

module.exports = (event, cb) => {
  if (!event.body || !JSON.parse(event.body).label) {
    return cb(null, {
      statusCode: 500,
      body: "Label not provided"
    });
  }
  const label = JSON.parse(event.body).label;
  const hash = utils.id(label);
  registrarContract.functions
    .entries(hash)
    .then(entryInfo => {
      const dateRegistered = moment(+entryInfo[2] * 1000).format("MM/DD/YYYY");
      const lockedEther = utils.formatEther(entryInfo[3]);
      return client.query(
        query.Let(
          { ref: query.Match(query.Index("domain_by_label_hash"), hash) },
          query.If(
            query.Exists(query.Var("ref")),
            [
              "updated",
              query.Update(query.Select("ref", query.Get(query.Var("ref"))), {
                data: { dateRegistered, lockedEther }
              })
            ],
            [
              "created",
              query.Create(query.Class("domains"), {
                data: { label, hash, dateRegistered, lockedEther }
              })
            ]
          )
        )
      );
    })
    .then(() => cb(null, { statusCode: 200, body: "OK" }))
    .catch(err =>
      cb(null, { statusCode: 400, body: err.name + ":" + err.message })
    );
};