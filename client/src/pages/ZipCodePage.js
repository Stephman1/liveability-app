import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Container, Card, Chip, Typography, Stack, TextField, IconButton } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LabelList, LineChart, Line, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';

const config = require('../config.json');

export default function ZipCodePage() {
    const { zip_code } = useParams();
    const navigate = useNavigate();

    const [zipData, setZipData] = useState({});
    const [avgNatHousingPrice, setAvgNatPrice] = useState('');
    const [avgNatRentalPrice, setAvgNatRent] = useState('');
    const [avgNatLifeExpectancy, setAvgNatLifeExpectancy] = useState('');
    const [avgWalkability, setWalkability] = useState('');
    const [avgSqftPrice, setSqftPrice] = useState('');
    const [historicalHousing, setHistoricalHousing] = useState([]);

    const [housingChartType, setHousingChartType] = useState('Price');
    const [lifeWalkChartType, setLifeWalkChartType] = useState('Life');
    const [country, setCountry] = useState("");
    const [newZipCode, setNewZipCode] = useState("");
    const zipUndefined = zip_code === "undefined" || !zip_code;


    useEffect(() => {
        const regex = /[a-zA-Z]/;

        const fetchData = async () => {
            try {
                if (regex.test(zip_code)) {
                    // UK zipcode
                    setCountry("United Kingdom");
                    const [zipData, avgNatPrice, avgNatRent, avgNatLifeExpectancy, sqftPrice] = await Promise.all([
                        fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code}`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/property_price`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/rental_price`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/life_expectancy`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/sqft_price`).then(res => res.json())
                    ]);
                    setZipData(zipData);
                    setAvgNatPrice(avgNatPrice.UKPropertyPrice);
                    setAvgNatRent(avgNatRent.UKRentalPrice);
                    setAvgNatLifeExpectancy(avgNatLifeExpectancy.UKLifeExpectancy);
                    setSqftPrice(sqftPrice.AvgBlendedSqft);

                    // Reset unused data to default value
                    setWalkability('');
                    setHistoricalHousing([]);
                } else {
                    // US zipcode
                    setCountry("United States of America");
                    const [zipData, avgNatPrice, avgNatRent, avgNatLifeExpectancy, walkability, historicalHousing] = await Promise.all([
                        fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code}`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/us/property_price`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/us/rental_price`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/us/life_expectancy`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_average/us/walkability`).then(res => res.json()),
                        fetch(`http://${config.server_host}:${config.server_port}/search_historical_property_data/${zip_code}`).then(res => res.json())
                    ]);
                    setZipData(zipData);
                    setAvgNatPrice(avgNatPrice.USPropertyPrice);
                    setAvgNatRent(avgNatRent.USRentalPrice);
                    setAvgNatLifeExpectancy(avgNatLifeExpectancy.USLifeExpectancy);
                    setWalkability(walkability.Walkability);
                    setHistoricalHousing(historicalHousing);

                    // Reset unused data to default value
                    setSqftPrice('');
                }
            } catch (err) {
                console.log(err);
            }
        };
        fetchData();
    }, [zip_code]);

    const handleInputChange = (event) => {
        setNewZipCode(event.target.value);
    };

    const handleSearch = () => {
        navigate(`/zip_code_view/${newZipCode}`);
    };

    const housingPriceData = [
        { name: 'Zip Code Property Price', value: zipData.AvgPrice },
        { name: 'Average National Property Price', value: avgNatHousingPrice },
      ];

    const rentalPriceData = [
        { name: 'Zip Code Rent', value: zipData.AvgRent },
        { name: 'Average National Rent', value: avgNatRentalPrice },
      ];

    const lifeExpectancyData = [
        { name: 'Zip Code Life Expectancy', value: zipData.LifeExpectancy },
        { name: 'Average National Life Expectancy', value: avgNatLifeExpectancy },
      ];
    
    const walkabilityData = [
        { name: 'Zip Code Walkability', value: zipData.Walkability },
        { name: 'Average US Walkability', value: avgWalkability },
      ];

    const sqftPriceData = [
        { name: 'Zip Code Housing Sqft Price', value: zipData.AverageBlended$SqftPrice },
        { name: 'Average UK Sqft Price', value: avgSqftPrice },
      ];

    let historicalHousingPricesData = [];
    let historicalRentalPricesData = [];

    for (let i = 0; i < historicalHousing.length; i++) {
        historicalHousingPricesData.push({Date: historicalHousing[i].Date, HousingPrice: historicalHousing[i].AvgPrice });
    };

    for (let i = 0; i < historicalHousing.length; i++) {
        historicalRentalPricesData.push({Date: historicalHousing[i].Date, Rent: historicalHousing[i].AvgRent });
    };

    const handleHousingGraphChange = (type) => {
        setHousingChartType(type);
      };

    const handleLifeWalkGraphChange = (type) => {
        setLifeWalkChartType(type);
    }
    
        
        

    return (
        <>
        <Container>
            <Box
                p={3} m={2}
                style={{ background: 'white', borderRadius: '16px', border: '1px solid grey', width: 1100 }}
            >
                <Stack direction="row" alignItems="left" spacing={2}>
                <Typography variant="h6" color="text.primary" gutterBottom>
        Zip code chosen:
      </Typography>
      <TextField
          value={newZipCode}
          onChange={handleInputChange}
          placeholder="Enter zip code"
          size="small"
          variant="outlined"
          style={{ marginRight: 10 }}
      />
      <IconButton onClick={handleSearch} color="primary">
          <SearchIcon />
      </IconButton>

                </Stack>
       </Box>
       </Container>
       {!zipUndefined && (
        <Container>
            <Box
                p={3} m={2}
                style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 1100 }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">

        <Typography gutterBottom variant="h5" component="div">
          <Chip color="primary" label={country} size="large" />
          
          </Typography>
        </Stack>
          <Typography gutterBottom variant="h2" component="div">
          <b>{zip_code}</b>
          </Typography>
          
          
        
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
        Area: <Chip color="secondary" label={zipData.State} size="small" />
        </Typography>
        <Card variant="outlined" sx={{p:2, m:1}}>
        <Typography variant="body"> 
        <p>{zip_code} is a zip code in {zipData.State}, an area in the {country}.</p>
        <p>Avg Housing Price: ${zipData.AvgPrice} &emsp;&emsp; Avg Rent: ${zipData.AvgRent} &emsp;&emsp; Life Expectancy: {zipData.LifeExpectancy} years</p>
        <p>Walkability: {zipData.Walkability} &emsp;&emsp; Air Quality: <b>{zipData.AQIRating}</b> &emsp;&emsp; Social Rent: {zipData.SocialRent} &emsp;&emsp; Avg Household Income: ${zipData.AvgHouseholdIncome} &emsp;&emsp; Avg Housing Sqft Price: ${zipData.AverageBlended$SqftPrice}</p>
        </Typography>
        </Card>
        


                <ButtonGroup>
                    <Button disabled={housingChartType === 'Price'} onClick={() => handleHousingGraphChange('Price')}>Housing Price</Button>
                    <Button disabled={housingChartType === 'Rent'} onClick={() => handleHousingGraphChange('Rent')}>Rent</Button>
                </ButtonGroup>
                <div style={{ margin: 20 }}>
                    {
                    (housingChartType === 'Price')
                        ? (
                            <ResponsiveContainer height={250}>
                                <BarChart
                                    data={housingPriceData}
                                    layout='vertical'
                                    margin={{ left: 40 }}
                                >
                                    <XAxis type='number' domain={[0, 9000000]} />
                                    <YAxis type='category' dataKey='name' />
                                    <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' >
                                        <LabelList dataKey='value' position='right' />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer height={250}>
                                <BarChart
                                    data={rentalPriceData}
                                    layout='vertical'
                                    margin={{ left: 40 }}
                                >
                                    <XAxis type='number' domain={[0, 90000]} />
                                    <YAxis type='category' dataKey='name' />
                                    <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' >
                                        <LabelList dataKey='value' position='right' />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>


                <ButtonGroup>
                    <Button disabled={lifeWalkChartType === 'Life'} onClick={() => handleLifeWalkGraphChange('Life')}>Life Expectancy</Button>
                    <Button disabled={lifeWalkChartType === 'Walk'} onClick={() => handleLifeWalkGraphChange('Walk')}>Walkability</Button>
                </ButtonGroup>
                <div style={{ margin: 20 }}>
                    { // This ternary statement returns a BarChart if barRadar is true, and a RadarChart otherwise
                    (lifeWalkChartType === 'Life')
                        ? (
                            <ResponsiveContainer height={250}>
                                <BarChart
                                    data={lifeExpectancyData}
                                    layout='vertical'
                                    margin={{ left: 40 }}
                                >
                                    <XAxis type='number' domain={[0, 100]} />
                                    <YAxis type='category' dataKey='name' />
                                    <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' >
                                        <LabelList dataKey='value' position='right' />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer height={250}>
                                <BarChart
                                    data={walkabilityData}
                                    layout='vertical'
                                    margin={{ left: 40 }}
                                >
                                    <XAxis type='number' domain={[0, 20]} />
                                    <YAxis type='category' dataKey='name' />
                                    <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' >
                                        <LabelList dataKey='value' position='right' />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>



                <Button >Housing Sqft Price</Button>
                <div style={{ margin: 20 }}>
                <ResponsiveContainer height={250}>
                    <BarChart
                        data={sqftPriceData}
                        layout='vertical'
                        margin={{ left: 40 }}
                    >
                        <XAxis type='number' domain={[0, 4200]} />
                        <YAxis type='category' dataKey='name' />
                        <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' >
                            <LabelList dataKey='value' position='right' />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
                


                <Button >Historical Housing Prices</Button>
                <div style={{ margin: 20 }}></div>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={historicalHousingPricesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="HousingPrice" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>



                <Button >Historical Rental Prices</Button>
                <div style={{ margin: 20 }}></div>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={historicalRentalPricesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Rent" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Container>)}
        </>
    );
}
