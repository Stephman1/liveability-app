const mysql = require('mysql')
const config = require('./config.json')

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db
});
connection.connect((err) => err && console.log(err));

// Route 1: GET /search_us_zips
const search_us_zips = async function(req, res) {
    // Return all US zip codes that match the given search query with parameters defaulted to those specified in API spec ordered by state and zip code (ascending)

}

// Route 2: GET /search_uk_zips
const search_uk_zips = async function(req, res) {
    // Return all UK postcode sectors (zip code equivalent) that match the given search query with parameters defaulted to those specified in API spec ordered by 
    // local area (state equivalent) and postcode sector (ascending)
}

// Route 3: GET /search_all_zips
const search_all_zips = async function(req, res) {
    // Return all US and UK zip codes that match the given search query with parameters defaulted to those specified in API spec ordered by state and zip code 
    // (ascending). A UK local area is considered analagous to a US state.
}

module.exports = {
    search_us_zips,
    search_uk_zips,
    search_all_zips,
}
