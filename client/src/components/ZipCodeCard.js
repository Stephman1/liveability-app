import React from 'react';
import { Box, Button, ButtonGroup, Card, Chip, Typography, Stack, Rating } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';



function ZipCodeCard({ zipCode, country, zipData }) {

  // Check if AQIRating is available or not
  const aqiRating = zipData.AQIRating === 'NA' || zipData.AQIRating == null ? 'NA' : zipData.AQIRating;
  const walkability = zipData.Walkability === 'NA' || zipData.Walkability == null ? 'NA' : zipData.Walkability;
  const sqftPrice = zipData.AverageBlended$SqftPrice === 'NA' || zipData.AverageBlended$SqftPrice == null ? 'NA': zipData.AverageBlended$SqftPrice; 

  const aqiVal = aqiRating === "Good" ? 3 : (aqiRating === "Moderate" ? 2 : 1)

  function createData(categories, values) {
    return { categories, values };
  }
  
  const rows = [
    createData('Avg. Property Price', `$ ${parseFloat(zipData.AvgPrice).toLocaleString()}`),
    createData('Average Rental Price', `$ ${parseFloat(zipData.AvgRent).toLocaleString()}`),
    createData('Life Expectancy', zipData.LifeExpectancy),
    createData('Walkability Score', zipData.Walkability)  ];

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
        <p><b>{zipCode}</b> is a zip code in <b>{zipData.State}</b>, an area in the <b>{country}</b>.</p>
        {/*<p>Walkability: {walkability}</p>*/}

        <Typography component="legend">Air Quality: <b>{aqiRating}</b></Typography>
        <Rating name="read-only" value={aqiVal} readOnly max={3}/>

        {!(sqftPrice === "NA") && <p>Housing Sqft Price: ${sqftPrice}</p>}
        </Typography>
        <TableContainer component={Paper}>
      <Table sx={{ minWidth: 250 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.categories}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.categories}
              </TableCell>
              <TableCell align="right">{row.values}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
        </Card>
    </Box>
  );
}

export default ZipCodeCard;