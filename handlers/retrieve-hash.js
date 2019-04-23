const { utils } = require("ethers");

module.exports = (event, cb) => {
  if (!event.queryStringParameters || !event.queryStringParameters.label) {
    return cb(null, {
      statusCode: 500,
      body: "Label not provided"
    });
  }
  const label = event.queryStringParameters.label;
  const hash = utils.id(label);
  cb(null, { statusCode: 200, body: hash });
};
