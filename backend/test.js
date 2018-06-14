'use strict';
let express = require('express');
let app = express();

app.get('/', function (req, res) {
  res.send('!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

