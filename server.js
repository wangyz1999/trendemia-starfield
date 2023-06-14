const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(__dirname + '/dist/research-dym'));

// Send all requests to Angular app
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/research-dym/index.html'));
});

// Default Heroku port or your custom port and log message
app.listen(process.env.PORT || 8080, () => {
    console.log('Server started');
    });


