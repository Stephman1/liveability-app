const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));
// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/search_all_zips', routes.search_all_zips);
app.get('/search_uk_zips', routes.search_uk_zips);
app.get('/search_us_zips', routes.search_us_zips);
app.get('/search_us_zip/:zip', routes.search_us_zip);
app.get('/search_uk_zip/:zip', routes.search_uk_zip);
app.get('/search_historical_property_data/:zip', routes.search_historical_property_data);
app.get('/search_similar_zips/:zip', routes.search_similar_zips);
app.get('/search_average/:country/:type', routes.search_average);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
