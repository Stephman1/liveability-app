import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Container } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useParams } from 'react-router-dom';

const config = require('../config.json');

export default function ZipCodePage() {
    const { zip_code } = useParams();

    const [zipData, setZipData] = useState({});

    const [barRadar, setBarRadar] = useState(true);

    useEffect(() => {
        const regex = /[a-zA-Z]/;

        // All UK zipcodes contain letters while US zipcodes only contain digits
        if (regex.test(zip_code)) {
            try { 
                fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code}`)
                .then(res => res.json())
                .then(resJson => setZipData(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
        else { // US Zipcode
            try { 
                fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code}`)
                .then(res => res.json())
                .then(resJson => setZipData(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
    }, [zip_code]);

    const chartData = [
        { name: 'Average Property Price', value: zipData.AvgPrice },
        { name: 'Average Rental Price', value: zipData.AvgRent },
        { name: 'Life Expectancy', value: zipData.LifeExpectancy },
      ];

    const handleGraphChange = () => {
        setBarRadar(!barRadar);
      };

    return (
        <Container>
            <Box
                p={3}
                style={{ background: 'white', borderRadius: '16px', border: '2px solid #000', width: 600 }}
            >
                <h1>{zip_code}</h1>
                <p>Walkability: {zipData.Walkability}</p>
                <p>Air Quality: {zipData.AQIRating}</p>
                <p>State: {zipData.State}</p>
                <ButtonGroup>
                    <Button disabled={barRadar} onClick={handleGraphChange}>Bar</Button>
                    <Button disabled={!barRadar} onClick={handleGraphChange}>Radar</Button>
                </ButtonGroup>
                <div style={{ margin: 20 }}>
                    { // This ternary statement returns a BarChart if barRadar is true, and a RadarChart otherwise
                    barRadar
                        ? (
                            <ResponsiveContainer height={250}>
                                <BarChart
                                    data={chartData}
                                    layout='vertical'
                                    margin={{ left: 40 }}
                                >
                                    <XAxis type='number' domain={[0, 1000000]} />
                                    <YAxis type='category' dataKey='name' />
                                    <Bar dataKey='value' stroke='#8884d8' fill='#8884d8' />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer height={250}>
                                <RadarChart outerRadius={90} width={730} height={250} data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey='name' />
                                    <PolarRadiusAxis angle={30} domain={[0, 1000000]} />
                                    <Radar name="category" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>
            </Box>
        </Container>
    );
}
