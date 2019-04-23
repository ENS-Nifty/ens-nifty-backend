const express = require("express");
const app = express();

// Routes
app.get("/add-label", (req, res) => {
  res.send("Hello World!");
});

// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});
