import { useEffect, useState } from 'react';
import { Container, Divider, Link, Card, Typography, Box, Stack, Alert, Chip, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
import SearchComponent from '../components/SearchComponent';
import CompareComponent from '../components/CompareComponent';
const config = require('../config.json');

export default function HomePage() {

  return (
    <Container sx={{p:2}}>
      <></>
      <Card variant="outlined" sx={{p:2, m:2}}>
      <h2>Welcome to the Liveability App</h2>
      <Typography color="text.secondary" variant="body2">
      This is a group project for CIS 550. A liveability application that allows users to compare different zip codes, postcodes, and local areas in the US and UK.
      </Typography>


      
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