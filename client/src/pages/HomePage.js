import { useEffect, useState } from 'react';
import { Container, Divider, Link, Card, Typography, Box, Stack, Alert, Chip, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
//import SongCard from '../components/SongCard';
import SearchComponent from '../components/SearchComponent';
import CompareComponent from '../components/CompareComponent';
const config = require('../config.json');

export default function HomePage() {
  // We use the setState hook to persist information across renders (such as the result of our API calls)
  //const [songOfTheDay, setSongOfTheDay] = useState({});
  // TODO (TASK 13): add a state variable to store the app author (default to '')
  // The useEffect hook by default runs the provided callback after every render
  // The second (optional) argument, [], is the dependency array which signals
  // to the hook to only run the provided callback if the value of the dependency array
  // changes from the previous render. In this case, an empty array means the callback
  // will only run on the very first render.
  return (
    <Container sx={{p:2}}>
      <></>
      {/* SongCard is a custom component that we made. selectedSongId && <SongCard .../> makes use of short-circuit logic to only render the SongCard if a non-null song is selected */}
      {/*selectedSongId && <SongCard songId={selectedSongId} handleClose={() => setSelectedSongId(null)} />*/}
      <Card variant="outlined" sx={{p:2, m:2}}>
      <h2>Welcome to the Liveability App</h2>
      <Typography color="text.secondary" variant="body2">
      This is a group project for CIS 550. A liveability application that allows users to compare different zip codes, postcodes, and local areas in the US and UK.
      </Typography>


        {/*<Link onClick={() => setSelectedSongId(songOfTheDay.song_id)}>{songOfTheDay.title}</Link>*/}
      
      </Card>
      <Card variant="outlined" sx={{p:2, m:2}}>
      <h2>Compare zip codes</h2>
      <Alert severity="info">To compare two different zip codes, input them below and click on compare.</Alert>
      
      <CompareComponent></CompareComponent>
      </Card>      
      <SearchComponent></SearchComponent>
    </Container>
  );
};