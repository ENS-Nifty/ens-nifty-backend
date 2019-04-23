const faunadb, { query } =  require("faunadb");

require("dotenv").config();

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET
});

module.exports = (event, cb) => {
  if (!event.queryStringParameters || !event.queryStringParameters.hash) {
    return cb(null, {
      statusCode: 500,
      body: "Hash not provided"
    });
  }
  const hash =
    "0x" + event.queryStringParameters.hash.replace("0x", "").padStart(64, 0);
  return client
    .query(query.Get(query.Match(query.Index("domain_by_label_hash"), hash)))
    .then(ret => cb(null, { statusCode: 200, body: ret.data.label }))
    .catch(err =>
      cb(null, { statusCode: 400, body: err.name + ":" + err.message })
    );
};
