const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(__dirname + '/dist/trendemia'));

// Send all requests to Angular app
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname + '/dist/trendemia/index.html'));
});

// Default Heroku port or your custom port and log message in a fancy way
app.listen(process.env.PORT || 8080, () => {
    console.log(`App running on port ${process.env.PORT || 8080}`);
});

