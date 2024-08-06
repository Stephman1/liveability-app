import { useEffect, useState } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { NavLink } from 'react-router-dom';


import { SelectChangeEvent } from '@mui/material/Select';
const config = require('../config.json');

export default function SearchComponent() {
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);

  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('UK');
  const [state, setState] = useState('');
  const [life_exp, setLifeExp] = useState(null);
  const [avg_price, setAvgPrice] = useState(null);
  const [avg_rent, setAvgRent] = useState(null);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/search_all_zips`)
      .then(res => res.json())
      .then(resJson => {
        const zipsWithId = resJson.map((zip) => ({ id: zip.Zip, ...zip }));
        setData(zipsWithId);
      });
  }, []);

  const search = () => {
    fetch(`http://${config.server_host}:${config.server_port}/search_all_zips?zip=${zip}` +
      `&state=${state}` +
      `&lifeExpectancy=${life_exp}` +
      `&avgPrice=${avg_price}` +
      `&avgRent=${avg_rent}` +
      `&country=${country}`
    )
      .then(res => res.json())
      .then(resJson => {
        // DataGrid expects an array of objects with a unique id.
        // To accomplish this, we use a map with spread syntax (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
        const zipsWithId = resJson.map((zip) => ({ id: zip.Zip, ...zip }));
        setData(zipsWithId);
      });
  }

  // This defines the columns of the table of songs used by the DataGrid component.
  // The format of the columns array and the DataGrid component itself is very similar to our
  // LazyTable component. The big difference is we provide all data to the DataGrid component
  // instead of loading only the data we need (which is necessary in order to be able to sort by column)
  const columns = [
    { field: 'Zip', headerName: 'Zip', width: 90, renderCell: (params) => 
      <NavLink to={`/zip_code_view/${params.row.Zip}`}>{params.row.Zip}</NavLink>
     },
    { field: 'State', headerName: 'State or Geo',  width: 300 },
    { field: 'Country', headerName: 'Country',  width: 100 },
    { field: 'LifeExpectancy', headerName: 'Life Expectancy (Years)',  width: 200 },
    { field: 'AvgPrice', headerName: 'Average Housing Price',  width: 200 },
    { field: 'AvgRent', headerName: 'Average Rent',  width: 200 }
  ]

  // This component makes uses of the Grid component from MUI (https://mui.com/material-ui/react-grid/).
  // The Grid component is super simple way to create a page layout. Simply make a <Grid container> tag
  // (optionally has spacing prop that specifies the distance between grid items). Then, enclose whatever
  // component you want in a <Grid item xs={}> tag where xs is a number between 1 and 12. Each row of the
  // grid is 12 units wide and the xs attribute specifies how many units the grid item is. So if you want
  // two grid items of the same size on the same row, define two grid items with xs={6}. The Grid container
  // will automatically lay out all the grid items into rows based on their xs values.
  return (
    <Container>
      <h2>Search Areas</h2>
      <Grid container spacing={6}>
        <Grid item xs={4}>
          <TextField label='Zip Code' value={zip} onChange={(e) => setZip(e.target.value)} style={{ width: "100%" }}/>
        </Grid>
        <Grid item xs={4}>
          <TextField label='State' value={state} onChange={(e) => setState(e.target.value)} style={{ width: "100%" }}/>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Countries</InputLabel>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={country}
                label="Country"
                onChange={(e) => setCountry(e.target.value)}
            >
                <MenuItem value={'UK'}>UK</MenuItem>
                <MenuItem value={'US'}>US</MenuItem>
                <MenuItem value={'Both'}>Both</MenuItem>
            </Select>
</FormControl>
        </Grid>
        <Grid item xs={4}>
          <p>Life Expectancy</p>
          <Slider
            value={life_exp}
            min={55}
            max={90}
            step={1}
            onChange={(e, newValue) => setLifeExp(newValue)}
            valueLabelDisplay='auto'
          />
        </Grid>
        <Grid item xs={4}>
          <p>Housing Price</p>
          <Slider
            value={avg_price}
            min={10000}
            max={10000000}
            step={10000}
            onChange={(e, newValue) => setAvgPrice(newValue)}
            valueLabelDisplay='auto'
          />
        </Grid>
        <Grid item xs={4}>
          <p>Rental Price</p>
          <Slider
            value={avg_rent}
            min={100}
            max={10000}
            step={100}
            onChange={(e, newValue) => setAvgRent(newValue)}
            valueLabelDisplay='auto'
          />
        </Grid>
      </Grid>
      <Button onClick={() => search() } style={{ left: '50%', transform: 'translateX(-50%)' }}>
        Search
      </Button>
      <h2>Results</h2>
      <DataGrid
        rows={data}
        columns={columns}
        pageSize={pageSize}
        rowsPerPageOptions={[5, 10, 25]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        autoHeight
      />
    </Container>
  );
}