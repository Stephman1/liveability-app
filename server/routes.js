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
        SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, LifeExpectancy, NatWalkInd AS Walkability
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        WHERE p.Zip = ?
        `, [zipcode, zipcode], 
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
    const zipcode = req.params.zip.toUpperCase();

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
            WHERE Sector = ?
        )
        SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, LifeExpectancy, (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AvgHouseholdIncome, CONCAT(SocialRent, '%') AS SocialRent
        FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
        WHERE p.Sector = ?
        `, [zipcode, zipcode], 
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
    const avg_price = req.query.avgPrice ? Number(req.query.avgPrice) : null;
    const avg_rent = req.query.avgRent ? Number(req.query.avgRent) : null;
    const life_expectancy = req.query.lifeExpectancy ? Number(req.query.lifeExpectancy) : null;
    const walkability = req.query.walkability ? Number(req.query.walkability): null;
    const state = req.query.state ? `${req.query.state}`: null;

    let us_where_clauses = [];

    if (avg_price !== null) {
        us_where_clauses.push(`AvgPrice IS NOT NULL AND AvgPrice < ${avg_price}`);
    }

    if (avg_rent !== null) {
        us_where_clauses.push(`AvgRent IS NOT NULL AND AvgRent < ${avg_rent}`);
    }

    if (life_expectancy !== null) {
        us_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
    }

    if (walkability !== null) {
        us_where_clauses.push(`NatWalkInd IS NOT NULL AND NatWalkInd > ${walkability}`);
    }

    if (state !== null) {
        us_where_clauses.push(`State IS NOT NULL AND State = '${state}'`);
    }

    let us_where_clause = us_where_clauses.length > 0 ? 'WHERE ' + us_where_clauses.join(' AND ') : '';

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            GROUP BY Zip
        )
        SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, LifeExpectancy, NatWalkInd AS Walkability
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        ${us_where_clause} 
        ORDER BY State, Zip
        `, [],
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
    const avg_price = req.query.avgPrice ? Number(req.query.avgPrice) : null;
    const avg_rent = req.query.avgRent ? Number(req.query.avgRent) : null;
    const life_expectancy = req.query.lifeExpectancy ? Number(req.query.lifeExpectancy) : null;
    const state = req.query.state ? `${req.query.state}`: null;
    const avg_blended_sqft = req.query.avgBlendedSqft ? Number(req.query.avgBlendedSqft) : null;
    const avg_household_income = req.query.avgHouseholdIncome ? Number(req.query.avgHouseholdIncome) : null;
    const social_rent = req.query.socialRent ? Number(req.query.socialRent) : null;

    let uk_where_clauses = [];

    if (avg_price !== null) {
        uk_where_clauses.push(`AvgAskingPrice IS NOT NULL AND (AvgAskingPrice * 1.29) < ${avg_price}`);
    }

    if (avg_rent !== null) {
        uk_where_clauses.push(`AvgAskingRent IS NOT NULL AND (AvgAskingRent * 1.29) < ${avg_rent}`);
    }

    if (life_expectancy !== null) {
        uk_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
    }

    if (state !== null) {
        uk_where_clauses.push(`LocalArea IS NOT NULL AND LocalArea LIKE '%${state}%'`);
    }

    if (avg_blended_sqft !== null) {
        uk_where_clauses.push(`AvgBlendedSqftPrice IS NOT NULL AND (AvgBlendedSqftPrice * 1.29) < ${avg_blended_sqft}`);
    }

    if (avg_household_income !== null) {
        uk_where_clauses.push(`AvgHouseholdIncome IS NOT NULL AND (AvgHouseholdIncome * 1.29) < ${avg_household_income}`);
    }

    if (social_rent !== null) {
        uk_where_clauses.push(`SocialRent IS NOT NULL AND SocialRent < ${social_rent}`);
    }

    let uk_where_clause = uk_where_clauses.length > 0 ? 'WHERE ' + uk_where_clauses.join(' AND ') : '';

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
        )
        SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, LifeExpectancy, (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AS AvgHouseholdIncome, CONCAT(SocialRent, '%') AS SocialRent
        FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
        ${uk_where_clause}
        ORDER BY State, Zip
        `, [],
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
    const avg_price = req.query.avgPrice ? Number(req.query.avgPrice) : null;
    const avg_rent = req.query.avgRent ? Number(req.query.avgRent) : null;
    const life_expectancy = req.query.lifeExpectancy ? Number(req.query.lifeExpectancy) : null;

    let us_where_clauses = [];
    let uk_where_clauses = [];

    if (avg_price !== null) {
        us_where_clauses.push(`AvgPrice IS NOT NULL AND AvgPrice < ${avg_price}`);
        uk_where_clauses.push(`AvgAskingPrice IS NOT NULL AND (AvgAskingPrice * 1.29) < ${avg_price}`);
    }

    if (avg_rent !== null) {
        us_where_clauses.push(`AvgRent IS NOT NULL AND AvgRent < ${avg_rent}`);
        uk_where_clauses.push(`AvgAskingRent IS NOT NULL AND (AvgAskingRent * 1.29) < ${avg_rent}`);
    }

    if (life_expectancy !== null) {
        us_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
        uk_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
    }

    let us_where_clause = us_where_clauses.length > 0 ? 'WHERE ' + us_where_clauses.join(' AND ') : '';
    let uk_where_clause = uk_where_clauses.length > 0 ? 'WHERE ' + uk_where_clauses.join(' AND ') : '';
    
    connection.query(`
        WITH USLifeExpectancy AS (
            SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            GROUP BY Zip
        ), UKLifeExpectancy AS (
            SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
        )
        SELECT * FROM (
        (SELECT p.Zip AS Zip, State, AvgPrice, AvgRent, LifeExpectancy, 'US' AS Country
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN USLifeExpectancy l ON l.Zip = p.Zip 
        ${us_where_clause})
        UNION ALL
        (SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, LifeExpectancy, 'UK' AS Country
        FROM UKProperties p LEFT OUTER JOIN UKLifeExpectancy e ON p.Sector = e.Sector
        ${uk_where_clause})) AS combinedResults
        ORDER BY Country, State, Zip
        `, [],
        (err, data) => {
        if (err || data.length === 0) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data);
        }}
    );
}

// Route 6: GET /search_similar_zips/:zip
const search_similar_zips = async function(req, res) {
    // Return all zip codes that are similar to the zip code input by the user ordered by state and zip code (ascending).
    // POSSIBLE API CALL. MAY OR MAY NOT BE NEEDED.
}

module.exports = {
    search_us_zip,
    search_uk_zip,
    search_us_zips,
    search_uk_zips,
    search_all_zips,
}
