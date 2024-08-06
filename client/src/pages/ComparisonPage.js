import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Container, Card, Chip, Typography, Stack, Divider } from '@mui/material';
import { ResponsiveContainer, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useParams } from 'react-router-dom';
import ZipCodeCard from '../components/ZipCodeCard'; // Import the new component
import { BarChart } from '@mui/x-charts/BarChart';
import CompareComponent from '../components/CompareComponent';


const config = require('../config.json');

export default function ZipCodePage() {
    const { zip_code1, zip_code2 } = useParams();

    const [zipData1, setZipData1] = useState({});
    const [zipData2, setZipData2] = useState({});

    const [barRadar1, setBarRadar1] = useState(true);
    const [barRadar2, setBarRadar2] = useState(true);
    const [country1, setCountry1] = useState("")
    const [country2, setCountry2] = useState("")

    useEffect(() => {
        const regex = /[a-zA-Z]/;

        // All UK zipcodes contain letters while US zipcodes only contain digits
        if (regex.test(zip_code1)) {
            try { 
                setCountry1("United Kingdom")
                fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code1}`)
                .then(res => res.json())
                .then(resJson => setZipData1(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
        else { // US Zipcode
            try { 
                setCountry1("United States of America")
                fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code1}`)
                .then(res => res.json())
                .then(resJson => setZipData1(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
    }, [zip_code1]);


    useEffect(() => {
        const regex = /[a-zA-Z]/;

        // All UK zipcodes contain letters while US zipcodes only contain digits
        if (regex.test(zip_code2)) {
            try { 
                setCountry2("United Kingdom")
                fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code2}`)
                .then(res => res.json())
                .then(resJson => setZipData2(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
        else { // US Zipcode
            try { 
                setCountry2("United States of America")
                fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code2}`)
                .then(res => res.json())
                .then(resJson => setZipData2(resJson));
            }
            catch(err) {
                console.log(err);
            }
        }
    }, [zip_code2]);


    const handleGraphChange = () => {
        setBarRadar1(!barRadar1);
      };

    return (
        <Container>
            <CompareComponent />;
           <Stack direction="row" justifyContent="space-between" alignItems="center">
           <ZipCodeCard
        zipCode={zip_code1}
        country={country1}
        zipData={zipData1}
      />

      <ZipCodeCard
        zipCode={zip_code2}
        country={country2}
        zipData={zipData2}
      />
           </Stack>

           <Box p={2} m={2} style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 1100 }}>
           <Stack direction="row" justifyContent="space-between" alignItems="center">
           <BarChart
      xAxis={[{ scaleType: 'band', data: ["Average Property Price"] }]}
      series={[{ label: zip_code1, data: [zipData1.AvgPrice] }, { label: zip_code2, data: [zipData2.AvgPrice]}]}
      width={250}
      height={300}
    />
           <BarChart
      xAxis={[{ scaleType: 'band', data: ["Average Rental Price"] }]}
      series={[{ data: [zipData1.AvgRent] }, { data: [zipData2.AvgRent]}]}
      width={250}
      height={300}
    />

<BarChart
      xAxis={[{ scaleType: 'band', data: ["Life Expectancy"] }]}
      series={[{ data: [zipData1.LifeExpectancy] }, { data: [zipData2.LifeExpectancy]}]}
      width={250}
      height={300}
    />

<BarChart
      xAxis={[{ scaleType: 'band', data: ["Walkability Score"] }]}
      series={[{ data: [zipData1.Walkability] }, { data: [zipData2.Walkability]}]}
      width={250}
      height={300}
    />


</Stack>
</Box>

            
        </Container>
    );
}
