import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Container, Modal } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useParams } from 'react-router-dom';

const config = require('../config.json');

export default function ZipCodePage() {
    const { zip_code } = useParams();

    const [zipData, setZipData] = useState({});

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

    return (
        <Container>
            <h1>{zip_code}</h1>
        </Container>
    );
}
