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
        ), US_AQI AS (SELECT State, County, Year, 90th_Percentile_AQI
        FROM US_air_quality_2023_data), County AS (
            SELECT County, County_code
            FROM US_County_Codes
        ), Zip AS (
            SELECT Zip, CountyCode
            FROM ZipTract
        ), FinalAQI AS (
        SELECT Zip, 90th_Percentile_AQI
        FROM US_AQI
        LEFT JOIN County ON US_AQI.County = County.County
        LEFT JOIN Zip ON County.County_code = Zip.CountyCode
        GROUP BY Zip)
        SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, ROUND(NatWalkInd, 2) AS Walkability, q.90th_Percentile_AQI AS AQI
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip
        LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
        LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
        LEFT OUTER JOIN FinalAQI q ON q.Zip = p.Zip
        WHERE p.Zip = ?
        `, [zipcode, zipcode], 
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            let result = data[0];
            result.AQIRating = getUSAQIRating(result.AQI);
            res.json(result);
        }}
    );
}

function getUSAQIRating(AQI) {
    if (AQI <= 50) {
        return 'Good'
    } else if (AQI > 50 && AQI <= 100) {
        return 'Moderate'
    } else {
        return 'Poor'
    }
}


// Define the AQI rating logic
function getUKAQIRating(PM25, PM10, NO2, O3) {
    const mySet = new Set();
    // set as null
    let NO2_rating=-1, PM10_rating=-1, PM25_rating=-1, O3_rating = -1;
    // these values are ug/m^3
    if (NO2 <= 200) {
        NO2_rating = 'Good';
    } else if (NO2 > 200 && NO2 <= 400) {
        NO2_rating = 'Moderate';
    } else {
        NO2_rating = 'Poor';
    }
    if (NO2 != null) {mySet.add(NO2_rating)};
    if (O3 <= 100) {
        O3_rating = 'Good';
    } else if (O3 > 100 && O3 <= 180) {
        O3_rating = 'Moderate';
    } else {
        O3_rating = 'Poor';
    }
    if (O3 != null) { mySet.add(O3_rating)};
    if (PM25 <= 35) {
        PM25_rating = 'Good';
    } else if (PM25 > 35 && PM25 <= 53) {
        PM25_rating = 'Moderate';
    } else {
        PM25_rating = 'Poor';
    }
    if (PM25 != null) {mySet.add(PM25_rating)};
    if (PM10 <= 50) {
        PM10_rating = 'Good';
    } else if (PM10 > 50 && PM10 <= 100) {
        PM10_rating = 'Moderate';
    } else {
        PM10_rating = 'Poor';
    }
    if (PM10 != null) {mySet.add(PM10_rating)};
    // choose worst rating as AQI rating'
    if  (mySet.has('Poor')) {
        return 'Poor';
    } else if (mySet.has('Moderate')) {
        return 'Moderate';
    } else if (mySet.has('Good')) {
        return 'Good';
    } else {
        return "NA"
    }
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
        ), Combined AS (
        SELECT site, year FROM UK_pm10_data
        UNION
        SELECT site, year FROM UK_pm25_data
        UNION
        SELECT site, year FROM UK_NO2_data
        UNION
        SELECT site, year FROM UK_O3_data
        ), AirQualityData AS (
        SELECT
            Combined.site,
            Combined.year,
            pm10_data.Annual_Mean_PM10,
            pm25_data.Annual_Mean_PM25,
            no2_data.Annual_Mean_NO2,
            o3_data.Annual_Avg_Max_Daily_O3
        FROM Combined
        LEFT JOIN UK_pm10_data pm10_data ON Combined.site = pm10_data.site AND Combined.year = pm10_data.year
        LEFT JOIN UK_pm25_data pm25_data ON Combined.site = pm25_data.site AND Combined.year = pm25_data.year
        LEFT JOIN UK_NO2_data no2_data ON Combined.site = no2_data.site AND Combined.year = no2_data.year
        LEFT JOIN UK_O3_data o3_data ON Combined.site = o3_data.site AND Combined.year = o3_data.year
        ), FinalAirQualityData AS (
        SELECT A.Postcode, B.Site, year, Annual_Mean_PM10, Annual_Mean_PM25, Annual_Mean_NO2, Annual_Avg_Max_Daily_O3
        FROM UK_Site_postcodes A
        JOIN AirQualityData B ON A.Site = B.Site
        WHERE Year = 2023
        ), LocalAreaAQI AS (
        SELECT
            F.Postcode,
            F.Site,
            F.year,
            U.LocalArea,
            F.Annual_Mean_PM10,
            F.Annual_Mean_PM25,
            F.Annual_Mean_NO2,
            F.Annual_Avg_Max_Daily_O3
        FROM FinalAirQualityData F
        JOIN UKAreasLookUp U ON F.Postcode = U.Sector
    ), LocalAreaAvgAQI AS (
        SELECT
            LocalArea,
            AVG(Annual_Mean_PM10) AS Avg_Annual_Mean_PM10,
            AVG(Annual_Mean_PM25) AS Avg_Annual_Mean_PM25,
            AVG(Annual_Mean_NO2) AS Avg_Annual_Mean_NO2,
            AVG(Annual_Avg_Max_Daily_O3) AS Avg_Annual_Avg_Max_Daily_O3
        FROM LocalAreaAQI
        GROUP BY LocalArea
    ), FinalAQI AS (
        SELECT
        L.Sector,
        L.LocalArea,
        A.Avg_Annual_Mean_PM10,
        A.Avg_Annual_Mean_PM25,
        A.Avg_Annual_Mean_NO2,
        A.Avg_Annual_Avg_Max_Daily_O3
    FROM UKAreasLookUp L
    JOIN LocalAreaAvgAQI A ON L.LocalArea = A.LocalArea
    )
        SELECT p.Sector AS Zip, e.LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice,
       (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy,
       (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AvgHouseholdIncome,
       CONCAT(SocialRent, '%') AS SocialRent, f.Avg_Annual_Mean_PM25 AS PM25, f.Avg_Annual_Mean_PM10 AS PM10,
       f.Avg_Annual_Mean_NO2 AS N02, f.Avg_Annual_Avg_Max_Daily_O3 AS O3
        FROM UKProperties p
        LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
        LEFT OUTER JOIN FinalAQI f ON f.Sector = p.Sector
        WHERE p.Sector = ?
        `, [zipcode, zipcode], 
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            let result = data[0];
            result.AQIRating = getUKAQIRating(result.PM25, result.PM10, result.NO2, result.O3);
            res.json(result);
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
        SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, ROUND(NatWalkInd, 2) AS Walkability
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
        SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AS AvgHouseholdIncome, CONCAT(SocialRent, '%') AS SocialRent
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
        (SELECT p.Zip AS Zip, State, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, 'US' AS Country
        FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
        LEFT OUTER JOIN USLifeExpectancy l ON l.Zip = p.Zip 
        ${us_where_clause})
        UNION ALL
        (SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, 'UK' AS Country
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

// Route 6: GET /search_historical_property_data/:zip
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

// Route 7: GET /search_similar_zips/:zip
const search_similar_zips = async function(req, res) {
    // Return all zip codes that are similar to the zip code input by the user ordered by state and zip code (ascending).
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
            (SELECT p.Zip AS Zip, State, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, 'US' AS Country
            FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
            LEFT OUTER JOIN USLifeExpectancy l ON l.Zip = p.Zip 
            ${us_where_clause})
            UNION ALL
            (SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, 'UK' AS Country
            FROM UKProperties p LEFT OUTER JOIN UKLifeExpectancy e ON p.Sector = e.Sector
            ${uk_where_clause})) AS combinedResults
            ORDER BY Country, State, Zip
            `, [],
            (err, data) => {
            if (err) {
                console.log(err);
                reject(new Error("Database query failed"))
            } 
            else if (data.length === 0){
                reject(new Error("No data found for zipcode: " + zipcode))
            }
            else {
                if (data.length > 20){ // trim down results by selecting random 20 zip codes
                    similarZips = []
                    indices = new Set();
                    for (let i=0; i < 20; i++){
                        while(true){
                            randInd = Math.floor(Math.random()*data.length)
                            if (!indices.has(randInd)){
                                indices.add(randInd)
                                similarZips.push(data[randInd]);
                                break;
                            }
                        }
                    }
                    resolve(similarZips)
                }
                else{
                    resolve(data);
                }
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
            SELECT p.Sector AS Zip, LocalArea AS State, (AvgAskingPrice * 1.29) AS AvgPrice, (AvgAskingRent * 1.29) AS AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, (AvgBlendedSqftPrice * 1.29) AS AverageBlended$SqftPrice, (AvgHouseholdIncome * 1.29) AvgHouseholdIncome, CONCAT(SocialRent, '%') AS SocialRent
            FROM UKProperties p LEFT OUTER JOIN LifeExpectancy e ON p.Sector = e.Sector
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
            SELECT p.Zip AS Zip, State, City, AvgPrice, AvgRent, ROUND(LifeExpectancy, 2) AS LifeExpectancy, ROUND(NatWalkInd, 2) AS Walkability
            FROM LatestPropertyPrices p LEFT OUTER JOIN LatestRentalPrices r ON p.Zip = r.Zip 
            LEFT OUTER JOIN LifeExpectancy l ON l.Zip = p.Zip
            LEFT OUTER JOIN USZipWalkability w ON w.Zip = p.Zip
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

// Route 8: GET /average/:country/:type
const search_average = async function(req, res) {
    // Return the average value for a particular type of variable, e.g., life expectancy, for a specified country
    const country = req.params.country.toUpperCase();
    const type = req.params.type;
    let search_type = '';

    if (country == 'US') {
        if (type == 'walkability') {
            search_type = 'Walkability';
        }
        else if (type == 'property_price') {
            search_type = 'USPropertyPrice';
        }
        else if (type == 'rental_price') {
            search_type = 'USRentalPrice';
        }
        else if (type == 'life_expectancy') {
            search_type = 'USLifeExpectancy';
        }
    }
    else if (country == 'UK') {
        if (type == 'sqft_price') {
            search_type = 'AvgBlendedSqft';
        }
        else if (type == 'property_price') {
            search_type = 'UKPropertyPrice';
        }
        else if (type == 'rental_price') {
            search_type = 'UKRentalPrice';
        }
        else if (type == 'life_expectancy') {
            search_type = 'UKLifeExpectancy';
        }
    }

    connection.query(`
        WITH USLifeExpectancy AS (
            SELECT AVG(LifeExpectancy) AS AverageValue
            FROM USLifeExpectancy
        ), Walkability AS (
            SELECT AVG(NatWalkInd) AS AverageValue
            FROM USZipWalkability
        ), USPropertyPrice AS (
            SELECT AVG(AvgPrice) AS AverageValue
            FROM LatestPropertyPrices
        ), USRentalPrice AS (
            SELECT AVG(AvgRent) AS AverageValue
            FROM LatestRentalPrices
        ), UKPropertyPrice AS (
            SELECT AVG(AvgAskingPrice * 1.29) AS AverageValue
            FROM UKProperties
        ), UKRentalPrice AS (
            SELECT AVG(AvgAskingRent * 1.29) AS AverageValue
            FROM UKProperties
        ), UKLifeExpectancy AS (
            SELECT AVG(Combined) AS AverageValue
            FROM UKLifeExpectancy
        ), AvgBlendedSqft AS (
            SELECT AVG(AvgBlendedSqftPrice * 1.29) AS AverageValue
            FROM UKProperties
        )
        SELECT ROUND(AverageValue, 2) AS ?
        FROM ${search_type}
        `, [search_type],
        (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }}
    );
}

module.exports = {
    search_us_zip,
    search_uk_zip,
    search_us_zips,
    search_uk_zips,
    search_all_zips,
    search_historical_property_data,
    search_similar_zips,
    search_average,
}
