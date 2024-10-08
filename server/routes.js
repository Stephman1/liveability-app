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
    const zipcode = req.params.zip ? req.params.zip.trim() : '';

    connection.query(`
        WITH LifeExpectancy AS (
            SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            WHERE Zip = ?
            GROUP BY Zip
        )
        SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy,
               ROUND(NatWalkInd, 2) AS Walkability, q.90th_Percentile_AQI AS AQI, AQI_Rating AS AQIRating
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        LEFT OUTER JOIN MaterializedUSAirQuality q ON q.Zip = p.Zip
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
    const zipcode = (req.params.zip || '').replace(/\s+/g, '').toUpperCase();
    
    connection.query(`
        WITH LifeExpectancy AS (
    SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
    FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
    WHERE Sector = ?
    )
    SELECT p.Sector AS Zip, e.LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice,
        (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy,
        (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AvgHouseholdIncome,
        CONCAT(SocialRent, '%') AS SocialRent, PM25, PM10, NO2, O3, AQIRating
    FROM UKProperties p
    LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
    LEFT OUTER JOIN MaterializedUKAirQuality f ON f.Sector = p.Sector
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

// Route 3: GET /search_all_zips
const search_all_zips = async function(req, res) {
    // Return all US and UK zip codes that match the given search query with parameters defaulted to those specified in API spec ordered by state and zip code 
    // (ascending). A UK local area is considered analagous to a US state.
    const avg_price = req.query.avgPrice ? Number(req.query.avgPrice) : null;
    const avg_rent = req.query.avgRent ? Number(req.query.avgRent) : null;
    const life_expectancy = req.query.lifeExpectancy ? Number(req.query.lifeExpectancy) : null;
    const AQIRating = req.query.AQIRating ? `${req.query.AQIRating}` : null;
    const state = req.query.state ? `${req.query.state}`: null;
    const country = req.query.country ? `${req.query.country}`: null;
    const zip = req.query.zip ? `${req.query.zip}`: null;

    let us_where_clauses = [];
    let uk_where_clauses = [];
    let geo_where_clauses = [];

    let us_cte = `SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
            FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
            GROUP BY Zip`;
    
    let uk_cte = `SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
            FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea`;

    let uk_search = `SELECT p.Sector AS Zip, e.LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, 'UK' AS Country, AQIRating
        FROM UKProperties p LEFT OUTER JOIN UKLifeExpectancy e ON p.Sector = e.Sector
        LEFT OUTER JOIN MaterializedUKAirQuality f ON f.Sector = p.Sector`;

    let us_search = `SELECT p.Zip AS Zip, State, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy,
        'US' AS Country, AQI_Rating AS AQIRating
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN USLifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN MaterializedUSAirQuality q ON q.Zip = p.Zip`;

    if (avg_price !== null && typeof avg_price === 'number' && avg_price > 0) {
        us_where_clauses.push(`AvgPrice IS NOT NULL AND AvgPrice < ${avg_price}`);
        uk_where_clauses.push(`AvgAskingPrice IS NOT NULL AND (AvgAskingPrice * 1.29) < ${avg_price}`);
    }

    if (avg_rent !== null && typeof avg_rent === 'number' && avg_rent > 0) {
        us_where_clauses.push(`AvgRent IS NOT NULL AND AvgRent < ${avg_rent}`);
        uk_where_clauses.push(`AvgAskingRent IS NOT NULL AND (AvgAskingRent * 1.29) < ${avg_rent}`);
    }

    if (life_expectancy !== null && typeof life_expectancy === 'number' && life_expectancy > 0) {
        us_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
        uk_where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
    }

    if (AQIRating !== null && AQIRating !== 'All') {
        us_where_clauses.push(`AQI_Rating IS NOT NULL AND AQI_Rating = '${AQIRating}'`);
        uk_where_clauses.push(`AQIRating IS NOT NULL AND AQIRating = '${AQIRating}'`);
    }

    if (state !== null) {
        let formatted_state = state.trim();
        if (formatted_state !== '') {
            geo_where_clauses.push(`State IS NOT NULL AND State LIKE '%${formatted_state}%'`);
        }
    }

    if (zip !== null) {
        let formatted_zip = zip.trim();
        if (formatted_zip !== '') {
            geo_where_clauses.push(`Zip IS NOT NULL AND Zip LIKE '%${formatted_zip}%'`);
        }
    }

    if (country !== null && country !== 'Both') {
        if (country === 'UK') {
            us_cte = `SELECT NULL as col1 WHERE 0`;
            us_search = `SELECT NULL AS Zip, NULL AS State, NULL AS AvgPrice, NULL AS AvgRent, NULL AS LifeExpectancy, NULL AS Country, NULL AS AQIRating
                    FROM DUAL
                    WHERE 0`;
            us_where_clauses = [];
        }
        else if (country === 'US') {
            uk_cte = `SELECT NULL as col1 WHERE 0`;
            uk_search = `SELECT NULL AS Zip, NULL AS State, NULL AS AvgPrice, NULL AS AvgRent, NULL AS LifeExpectancy, NULL AS Country, NULL AS AQIRating
                    FROM DUAL
                    WHERE 0`;
            uk_where_clauses = [];
        }
    }

    let us_where_clause = us_where_clauses.length > 0 ? 'WHERE ' + us_where_clauses.join(' AND ') : '';
    let uk_where_clause = uk_where_clauses.length > 0 ? 'WHERE ' + uk_where_clauses.join(' AND ') : '';
    let geo_where_clause = geo_where_clauses.length > 0 ? 'WHERE ' + geo_where_clauses.join(' AND ') : '';
    
    connection.query(`
        WITH USLifeExpectancy AS (
            ${us_cte}
        ), UKLifeExpectancy AS (
            ${uk_cte}
        )
        SELECT * FROM (
        (${us_search}
        ${us_where_clause})
        UNION ALL
        (${uk_search}
        ${uk_where_clause})) AS combinedResults
        ${geo_where_clause}
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

// Route 4: GET /search_historical_property_data/:zip
const search_historical_property_data = async function(req, res) {
    // Return historical property data for US zip codes ordered by date.
    const zipcode = req.params.zip;

    connection.query(`
        SELECT p.Zip AS Zip, AvgPrice, AvgRent, DATE_FORMAT(p.Date, '%m/%d/%Y') AS Date
        FROM AvgPropertyPrices p LEFT OUTER JOIN AvgRentalPrices r ON p.Zip = r.Zip AND p.Date = r.Date
        WHERE p.Zip = ?
        ORDER BY Date DESC
        `, [zipcode],
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }}
    ); 
}

// Route 5: GET /search_similar_zips/:zip
const search_similar_zips = async function(req, res) {
    // Return 3 random zip codes that are similar to the zip code input by the user
    const zipcode = req.params.zip;
    const regex = /[a-zA-Z]/;

    // All UK zipcodes contain letters while US zipcodes only contain digits
    if (regex.test(zipcode)){
        try{ 
            const zipData = await searchUKZip(zipcode);
            const searchParams = {
                avgPrice: zipData.AvgPrice,
                avgRent: zipData.AvgRent,
                lifeExpectancy: zipData.LifeExpectancy,
                airQuality: zipData.AQIRating,
            };
            const similarZips = await searchSimilarZips(searchParams);
            res.json( similarZips );
        }
        catch(err){
            console.log(err);
            res.json([]);
        }
    }
    else{ // US Zipcode
        try{ 
            const zipData = await searchUSZip(zipcode);
            const searchParams = {
                avgPrice: zipData.AvgPrice,
                avgRent: zipData.AvgRent,
                lifeExpectancy: zipData.LifeExpectancy,
                walkability: zipData.Walkability,
                airQuality: zipData.AQIRating,
            };
            const similarZips = await searchSimilarZips(searchParams);
            res.json( similarZips );
        }catch(err){
            console.log(err);
            res.json([]);
        }
    }
}

const searchSimilarZips = (params) => {
    return new Promise((resolve, reject) => {

        const avg_price = params.avgPrice ? Number(params.avgPrice) : null;
        const avg_rent = params.avgRent ? Number(params.avgRent) : null;
        const life_expectancy = params.lifeExpectancy ? Number(params.lifeExpectancy) : null;
        const AQIRating = params.airQuality ? `${params.airQuality}` : null;
        const walkability = params.walkability ? Number(params.walkability)-1.5 : null;


        let where_clauses = []

        if (AQIRating !== null) {
            where_clauses.push(`AQIRating IS NOT NULL AND AQIRating = '${AQIRating}'`);
        }

        if (avg_price !== null) {
            where_clauses.push(`AvgPrice IS NOT NULL`);
            where_clauses.push(`((Country='US' AND AvgPrice < ${avg_price}) OR (Country='UK' AND (AvgPrice * 1.29) < ${avg_price}))`);
        }

        if (avg_rent !== null) {
            where_clauses.push(`AvgRent IS NOT NULL`);
            where_clauses.push(`((Country='US' AND AvgRent < ${avg_rent}) OR (Country='UK' AND (AvgRent * 1.29) < ${avg_rent}))`);
        }

        if (life_expectancy !== null) {
            where_clauses.push(`LifeExpectancy IS NOT NULL AND LifeExpectancy > ${life_expectancy}`);
        }
        if (walkability !== null) {
            where_clauses.push(`(Country='UK' OR Walkability > ${walkability})`);
        }

        let where_clause = where_clauses.length > 0 ? 'WHERE ' + where_clauses.join(' AND ') : '';
        
        connection.query(`
            SELECT Zip
            FROM SimilarSearchCombined
            ${where_clause}
            ORDER BY RAND()
            LIMIT 3
            `, [],
            (err, data) => {
            if (err) {
                console.log(err);
                reject(new Error("Database query failed"))
            } 
            else if (data.length === 0){
                reject(new Error("No data found for specified parameters"))
            }
            else {
                resolve(data);
            }}
        );
    }
)}
const searchUKZip = (zipcode) => {
    return new Promise((resolve, reject) => {
        zipcode = (zipcode || '').replace(/\s+/g, '').toUpperCase();
    
        connection.query(`
            WITH LifeExpectancy AS (
                SELECT Sector, Combined AS LifeExpectancy, l.LocalArea AS LocalArea
                FROM UKAreasLookUp a LEFT OUTER JOIN UKLifeExpectancy l ON l.LocalArea = a.LocalArea
                WHERE Sector = ?
            )
            SELECT p.Sector AS Zip, e.LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AvgHouseholdIncome, CONCAT(SocialRent, '%') AS SocialRent, AQIRating
            FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
            LEFT OUTER JOIN MaterializedUKAirQuality f ON f.Sector = p.Sector
            WHERE p.Sector = ?
            `, [zipcode, zipcode], 
            (err, data) => {
            if (err) {
                console.log(err);
                reject(new Error("Database query failed"))
            } 
            else if (data.length === 0){
                reject(new Error("No data found for zipcode: " + zipcode))
            }
            else {
                resolve(data);
            }}
        );
    }
        
)}

const searchUSZip = (zipcode) => {
    return new Promise((resolve, reject) => {
        zipcode = zipcode.trim();

        connection.query(`
            WITH LifeExpectancy AS (
                SELECT Zip, AVG(LifeExpectancy) AS LifeExpectancy, ZipState AS State, ZipCity AS City
                FROM ZipTract z LEFT OUTER JOIN USLifeExpectancy u ON z.CensusTract = u.CensusTract
                WHERE Zip = ?
                GROUP BY Zip
            )
            SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, ROUND(NatWalkInd, 2) AS Walkability, AQI_Rating AS AQIRating
            FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
            LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
            LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
            LEFT OUTER JOIN MaterializedUSAirQuality q ON q.Zip = p.Zip
            WHERE p.Zip = ?
            `, [zipcode, zipcode], 
            (err, data) => {
            if (err) {
                console.log(err);
                reject(new Error("Database query failed"))
            } 
            else if (data.length === 0){
                reject(new Error("No data found for zipcode: " + zipcode))
            }
            else {
                resolve(data[0]);
            }}
        );
    }
)}

// Route 6: GET /search_average/:country/:type
const search_average = async function(req, res) {
    // Return the average value for a particular type of variable, e.g., life expectancy, for a specified country
    const country = req.params.country.toUpperCase();
    const type = req.params.type;
    let search_type = '';
    let search_query = ``;

    if (country == 'US') {
        if (type == 'walkability') {
            search_type = 'Walkability';
            search_query = `SELECT AVG(NatWalkInd) AS AverageValue FROM USZipWalkability`;
        }
        else if (type == 'property_price') {
            search_type = 'USPropertyPrice';
            search_query = `SELECT AVG(AvgPrice) AS AverageValue FROM LatestPropertyPrices`;
        }
        else if (type == 'rental_price') {
            search_type = 'USRentalPrice';
            search_query = `SELECT AVG(AvgRent) AS AverageValue FROM LatestRentalPrices`;
        }
        else if (type == 'life_expectancy') {
            search_type = 'USLifeExpectancy';
            search_query = `SELECT AVG(LifeExpectancy) AS AverageValue FROM USLifeExpectancy`;
        }
    }
    else if (country == 'UK') {
        if (type == 'sqft_price') {
            search_type = 'AvgBlendedSqft';
            search_query = `SELECT AVG(AvgBlendedSqftPrice * 1.29) AS AverageValue FROM UKProperties`;
        }
        else if (type == 'property_price') {
            search_type = 'UKPropertyPrice';
            search_query = `SELECT AVG(AvgAskingPrice * 1.29) AS AverageValue FROM UKProperties`;
        }
        else if (type == 'rental_price') {
            search_type = 'UKRentalPrice';
            search_query = `SELECT AVG(AvgAskingRent * 1.29) AS AverageValue FROM UKProperties`;
        }
        else if (type == 'life_expectancy') {
            search_type = 'UKLifeExpectancy';
            search_query = `SELECT AVG(Combined) AS AverageValue FROM UKLifeExpectancy`;
        }
    }

    connection.query(`
        WITH ${search_type} AS (
            ${search_query}
        )
        SELECT ROUND(AverageValue, 2) AS ?
        FROM ${search_type}
        `, [search_type],
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data[0]);
        }}
    );
}

module.exports = {
    search_us_zip,
    search_uk_zip,
    search_all_zips,
    search_historical_property_data,
    search_similar_zips,
    search_average,
}
