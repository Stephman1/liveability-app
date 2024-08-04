import { useEffect, useState } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField, MenuItem, Select, InputLabel, FormControl, Divider, Autocomplete } from '@mui/material';

import { formatDuration } from '../helpers/formatter';
import { SelectChangeEvent } from '@mui/material/Select';
const config = require('../config.json');

export default function CompareComponent() {

  const [zip1, setZip1] = useState("");
  const [zip2, setZip2] = useState("");

  const [data, setData] = useState(null);
//data.map(x => console.log(x.Zip))
//console.log(data)
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/search_all_zips`)
      .then(res => res.json())
      .then(resJson => {
        const zipsWithId = resJson.map((zip) => ({ label: zip.Zip }));
        setData(zipsWithId);
      });
  }, []);

  const handleZip2Change = (event, values) => {
    setZip2(values);
    };

  const handleZip1Change = (event, values) => {
    setZip1(values);
  }



  // This component makes uses of the Grid component from MUI (https://mui.com/material-ui/react-grid/).
  // The Grid component is super simple way to create a page layout. Simply make a <Grid container> tag
  // (optionally has spacing prop that specifies the distance between grid items). Then, enclose whatever
  // component you want in a <Grid item xs={}> tag where xs is a number between 1 and 12. Each row of the
  // grid is 12 units wide and the xs attribute specifies how many units the grid item is. So if you want
  // two grid items of the same size on the same row, define two grid items with xs={6}. The Grid container
  // will automatically lay out all the grid items into rows based on their xs values.
  return (
    <Container>
      <h3>Pick two areas</h3>
      <Grid container spacing={6}>
        <Grid item xs={4}>
        <Autocomplete
            disablePortal
            options={data}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Area or zip" />}
            onChange={handleZip1Change}
         />
         <h5>{zip1.label ? zip1.label : ""}</h5>
        </Grid>
        <Grid item xs={4}>
        <Autocomplete
            disablePortal
            options={data}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Area or zip" />}
            onChange={handleZip2Change}
         />
         <h5>{zip2.label ? zip2.label: ""}</h5>
        </Grid>
        <Grid item xs={4}>
        <Button  style={{ }}>
        Compare
      </Button>

        </Grid>
</Grid>
      

    </Container>
  );
}