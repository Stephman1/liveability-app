import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom';

// The hyperlinks in the NavBar contain a lot of repeated formatting code so a
// helper component NavText local to the file is defined to prevent repeated code.
function NavText({ href, text, isMain }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'h7'}
      noWrap
      style={{
        marginRight: '30px',
        fontFamily: 'Roboto',
        fontWeight: 900,
        letterSpacing: '.2rem',
        color: 'white'
      }}
    >
      <NavLink
        to={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        {text}
      </NavLink>
    </Typography>
  )
}

// Here, we define the NavBar. Note that we heavily leverage MUI components
// to make the component look nice. Feel free to try changing the formatting
// props to how it changes the look of the component.
export default function NavBar() {
  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <NavText href='/' text='Liveability App' isMain />
          <NavText href="/zip_code_view/undefined" text='Zip Code' />
          <NavText href="comparison_view/undefined/undefined" text='Comparison' />
          <NavText href="/explore_similar/" text='Explore Similar' />
          {/*<NavText href='/songs' text='SONGS' />*/}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
