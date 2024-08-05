import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Container, Card, Chip, Typography, Stack, Divider } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList } from 'recharts';
import { useParams } from 'react-router-dom';

const config = require('../config.json');

export default function ZipCodePage() {
    const { zip_code } = useParams();

    const [zipData, setZipData] = useState({});
    const [avgNatHousingPrice, setAvgNatPrice] = useState('');
    const [avgNatRentalPrice, setAvgNatRent] = useState('');
    const [avgNatLifeExpectancy, setAvgNatLifeExpectancy] = useState('');
    const [avgWalkability, setWalkability] = useState('');
    const [avgSqftPrice, setSqftPrice] = useState('');

    const [housingChartType, setHousingChartType] = useState('Price');
    const [country, setCountry] = useState("");

    useEffect(() => {
        const regex = /[a-zA-Z]/;

        // All UK zipcodes contain letters while US zipcodes only contain digits
        if (regex.test(zip_code)) {
            try { 
                setCountry("United Kingdom")
                fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code}`)
                .then(res => res.json())
                .then(resJson => setZipData(resJson));
                fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/property_price`)
                .then(res => res.json())
                .then(resJson => setAvgNatPrice(resJson.UKPropertyPrice));
                fetch(`http://${config.server_host}:${config.server_port}/search_average/uk/rental_price`)
                .then(res => res.json())
                .then(resJson => setAvgNatRent(resJson.UKRentalPrice));
            }
            catch(err) {
                console.log(err);
            }
        }
        else { // US Zipcode
            try { 
                setCountry("United States of America")
                fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code}`)
                .then(res => res.json())
                .then(resJson => setZipData(resJson));
                fetch(`http://${config.server_host}:${config.server_port}/search_average/us/property_price`)
                .then(res => res.json())
                .then(resJson => setAvgNatPrice(resJson.USPropertyPrice));
                fetch(`http://${config.server_host}:${config.server_port}/search_average/us/rental_price`)
                .then(res => res.json())
                .then(resJson => setAvgNatRent(resJson.USRentalPrice));
            }
            catch(err) {
                console.log(err);
            }
        }
    }, [zip_code]);

    const housingPriceData = [
        { name: 'Zip Code Property Price', value: zipData.AvgPrice },
        { name: 'Average Country Property Price', value: avgNatHousingPrice },
      ];

    const rentalPriceData = [
        { name: 'Zip Code Rent', value: zipData.AvgRent },
        { name: 'Average Country Rent', value: avgNatRentalPrice },
      ];

    const handleHousingGraphChange = (type) => {
        setHousingChartType(type);
      };

    return (
        <Container>
            <Box
                p={3} m={2}
                style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 1100 }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Zip code chosen:
        </Typography>
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
        <p>Walkability: {zipData.Walkability} &emsp;&emsp; Air Quality: {zipData.AQIRating} &emsp;&emsp; Social Rent: {zipData.SocialRent} &emsp;&emsp; Avg Household Income: ${zipData.AvgHouseholdIncome}</p>
        </Typography>
        </Card>
        


                <ButtonGroup>
                    <Button disabled={housingChartType === 'Price'} onClick={() => handleHousingGraphChange('Price')}>Housing Price</Button>
                    <Button disabled={housingChartType === 'Rent'} onClick={() => handleHousingGraphChange('Rent')}>Rent</Button>
                </ButtonGroup>
                <div style={{ margin: 20 }}>
                    { // This ternary statement returns a BarChart if barRadar is true, and a RadarChart otherwise
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
            </Box>
        </Container>
    );
}
