import React from 'react';
import { Box, Button, ButtonGroup, Card, Chip, Typography, Stack } from '@mui/material';


function ZipCodeCard({ zipCode, country, zipData }) {

  // Check if AQIRating is available or not
  const aqiRating = zipData.AQIRating === 'NA' || zipData.AQIRating == null ? 'NA' : zipData.AQIRating;
  const walkability = zipData.Walkability === 'NA' || zipData.Walkability == null ? 'NA' : zipData.Walkability;

  return (
    <Box p={3} m={2} style={{ background: '#e5f2fb', borderRadius: '16px', border: '0px solid #000', width: 600 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Zip code chosen:
        </Typography>
        <Typography gutterBottom variant="h5" component="div">
          <Chip color="primary" label={country} size="large" />
          
          </Typography>
        </Stack>
          <Typography gutterBottom variant="h2" component="div">
          <b>{zipCode}</b>
          </Typography>
          
          
        
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
        Area: <Chip color="secondary" label={zipData.State} size="small" />
        </Typography>
        <Card variant="outlined" sx={{p:2, m:1}}>
        <Typography variant="body"> 
        <p>{zipCode} is a zip code in {zipData.State}, an area in the {country}.</p>
        <p>Walkability: {walkability}</p>
        <p>Air Quality: {aqiRating}</p>
        <p>State: {zipData.State}</p>
        </Typography>
        </Card>
    </Box>
  );
}

export default ZipCodeCard;