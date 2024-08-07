import { useEffect, useState } from 'react';
import { Box, Container, Typography, Stack, TextField, IconButton } from '@mui/material';

import ZipCodeCard from '../components/ZipCodeCard'; // Import the new component
import { BarChart } from '@mui/x-charts/BarChart';
import SearchIcon from '@mui/icons-material/Search';


const config = require('../config.json');

export default function ExploreSimilarPage() {
    const [country1, setCountry1] = useState("");
    const [country2, setCountry2] = useState("");
    const [country3, setCountry3] = useState("");
    const [country4, setCountry4] = useState("");
    const [UserSearch, setUserSearch] = useState("");
    const [threeSimilarZips, setThreeSimilarZips] = useState([])

    const [zip_code, setZipCode] = useState("");
    const [zipData1, setZipData1] = useState({});
    const [zipData2, setZipData2] = useState({});
    const [zipData3, setZipData3] = useState({});
    const [zipData4, setZipData4] = useState({});

    // Find similar zip codes 
    const fetchSimilar = async (search_criteria) => {
            try{
                setZipCode(search_criteria);
                const similar = await fetch(`http://${config.server_host}:${config.server_port}/search_similar_zips/${search_criteria}`).then(res => res.json());
                setThreeSimilarZips(similar);
                }
                catch(err) {
                    console.log(err);
                }
    };

    // Once similar zips found fetch data for all 4 zips
    useEffect(()=>{
        const fetchZipData = async () => {
            try {
                fetchOneZip(zip_code, setZipData1, setCountry1)
                if (threeSimilarZips.length > 0){
                    fetchOneZip(threeSimilarZips[0].Zip, setZipData2, setCountry2);
                }
                else{ 
                    setZipData2({});
                }
                if (threeSimilarZips.length > 1){
                    fetchOneZip(threeSimilarZips[1].Zip, setZipData3, setCountry3);
                }
                else{ 
                    setZipData3({});
                }
                if (threeSimilarZips.length > 2){
                    fetchOneZip(threeSimilarZips[2].Zip, setZipData4, setCountry4);
                }
                else{ 
                    setZipData4({});
                }
            } catch (err) {
                console.log(err);
            }
        };
        if (threeSimilarZips.length === 3){
            fetchZipData();
        }
    },[threeSimilarZips]);
    

  // Function to fetch data for a single zip
  const fetchOneZip = async (zip_code, setZipData, setCountry) => {
    const regex = /[a-zA-Z]/;
    if (regex.test(zip_code)) {
        try {
            setCountry("United Kingdom");
            const response = await fetch(`http://${config.server_host}:${config.server_port}/search_uk_zip/${zip_code}`).then(res => res.json());
            setZipData(response);
        }
        catch(err) {
            console.log(err);
        }
    }
    else { // US Zipcode
        try { 
            setCountry("United States");
            const response = await fetch(`http://${config.server_host}:${config.server_port}/search_us_zip/${zip_code}`).then(res => res.json());
            setZipData(response);
        }
        catch(err) {
            console.log(err);
        }
    }
  };

        const handleInputChange = (event) => {
            setUserSearch(event.target.value);
        };
        const handleSearch = (event) => {
            fetchSimilar(UserSearch);
        };

    return (
        <Container>
            <Box
                p={3} m={2}
                style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 1100 }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                        Enter a zipcode to find similar locations in the US and UK:
                    </Typography>
                    <TextField
                        value={UserSearch}
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
            <div style={{ display: 'flex', overflowX: 'auto' }}>
                {[zipData1, zipData2, zipData3, zipData4].map((zipData, index) => (
                    <ZipCodeCard
                    key={index}
                    zipCode={zipData.Zip}
                    country={zipData.country}
                    zipData={zipData}
                    />
                ))}
            </div>
           <Box p={2} m={2} style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 1100 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <BarChart
                    xAxis={[{ scaleType: 'band', data: ["Average Property Price"] }]}
                    series={[{ label: zipData1.Zip, data: [zipData1.AvgPrice] }, { label: zipData2.Zip, data: [zipData2.AvgPrice]}, { data: [zipData3.AvgPrice]}, { data: [zipData4.AvgPrice]}]}
                    width={250}
                    height={300}
                    />
                    <BarChart
                    xAxis={[{ scaleType: 'band', data: ["Average Rental Price"] }]}
                    series={[{ data: [zipData1.AvgRent] }, { data: [zipData2.AvgRent]}, { label: zipData3.Zip, data: [zipData3.AvgRent]}, { label: zipData4.Zip, data: [zipData4.AvgRent]}]}
                    width={250}
                    height={300}
                    />

                    <BarChart
                        xAxis={[{ scaleType: 'band', data: ["Life Expectancy"] }]}
                        series={[{ data: [zipData1.LifeExpectancy] }, { data: [zipData2.LifeExpectancy]}, { data: [zipData3.LifeExpectancy]}, { data: [zipData4.LifeExpectancy]}]}
                        width={250}
                        height={300}
                        />

                    <BarChart
                        xAxis={[{ scaleType: 'band', data: ["Walkability Score"] }]}
                        series={[{ data: [zipData1.Walkability] }, { data: [zipData2.Walkability]}, { data: [zipData3.Walkability]}, { data: [zipData4.Walkability]}]}
                        width={250}
                        height={300}
                        />
                </Stack>
            </Box> 
        </Container>
    );
}
