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

// Route 1: GET /search_us_zip/:zip
const search_us_zip = async function(req, res) {
    // Return all information on a given US zip code
    const zipcode = req.params.zip;

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            WHERE Zip = ?
            GROUP BY Zip
        )
        SELECT p.Zip AS Zip, AvgPrice, AvgRent, LifeExpectancy, NatWalkInd AS Walkability, State, City
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        WHERE p.Zip = ?
        `, [zipcode], 
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data[0]);
        }}
    );
}

// Route 2: GET /search_uk_zip/:zip
const search_uk_zip = async function(req, res) {
    // Return all information on a given UK post code sector (zip code equivalent)
    const zipcode = req.params.zip;

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
            WHERE Sector = ?
        )
        SELECT p.Sector AS Zip, LocalArea AS State, AvgAskingPrice AS AvgPrice, AvgAskingRent AS AvgRent, LifeExpectancy, AvgHouseholdIncome, SocialRent
        FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
        WHERE p.Sector = ?
        `, [zipcode], 
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data[0]);
        }}
    );
}

// Route 3: GET /search_us_zips
const search_us_zips = async function(req, res) {
    // Return all US zip codes that match the given search query with parameters defaulted to those specified in API spec ordered by state and zip code (ascending)
    const avg_price = Number(req.query.avgPrice ?? 10000000);
    const avg_rent = Number(req.query.avgRent ?? 50000);
    const life_expectancy = Number(req.query.lifeExpectancy ?? 0);
    const walkability = Number(req.query.walkability ?? 0);
    const state = req.query.state ? `%${req.query.state}%`: '%';

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            GROUP BY Zip
        )
        SELECT p.Zip AS Zip, AvgPrice, AvgRent, LifeExpectancy, NatWalkInd AS Walkability, State, City
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        WHERE (AvgPrice < ? OR AvgPrice IS NULL) AND (AvgRent < ? OR AvgRent IS NULL) AND (LifeExpectancy > ? OR LifeExpectancy IS NULL) 
        AND (NatWalkInd > ? OR NatWalkInd IS NULL) AND State LIKE ?
        ORDER BY State, Zip
        `, [avg_price, avg_rent, life_expectancy, walkability, state],
        (err, data) => {
        if (err || data.length === 0) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data);
        }}
    );
}

// Route 4: GET /search_uk_zips
const search_uk_zips = async function(req, res) {
    // Return all UK postcode sectors (zip code equivalent) that match the given search query with parameters defaulted to those specified in API spec ordered by 
    // local area (state equivalent) and postcode sector (ascending)
    const avg_price = Number(req.query.avgPrice ?? 10000000);
    const avg_rent = Number(req.query.avgRent ?? 50000);
    const life_expectancy = Number(req.query.lifeExpectancy ?? 0);
    const state = req.query.state ? `%${req.query.state}%`: '%';

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
        )
        SELECT p.Sector AS Zip, LocalArea AS State, AvgAskingPrice AS AvgPrice, AvgAskingRent AS AvgRent, LifeExpectancy, AvgHouseholdIncome, SocialRent
        FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
        WHERE AvgAskingPrice < ? AND (AvgAskingRent < ? OR AvgAskingRent IS NULL) AND (LifeExpectancy > ? OR LifeExpectancy IS NULL)
        AND LocalArea LIKE ?
        ORDER BY State, Zip
        `, [avg_price, avg_rent, life_expectancy, state],
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }}
    );
}

// Route 5: GET /search_all_zips
const search_all_zips = async function(req, res) {
    // Return all US and UK zip codes that match the given search query with parameters defaulted to those specified in API spec ordered by state and zip code 
    // (ascending). A UK local area is considered analagous to a US state.
}

module.exports = {
    search_us_zip,
    search_uk_zip,
    search_us_zips,
    search_uk_zips,
    search_all_zips,
}
