import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { blue, purple, pink, green } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import AlbumsPage from './pages/AlbumsPage';
import SongsPage from './pages/SongsPage';
import AlbumInfoPage from './pages/AlbumInfoPage';
import ZipCodePage from "./pages/ZipCodePage";
import ComparisonPage from "./pages/ComparisonPage";

// createTheme enables you to customize the look and feel of your app past the default
// in this case, we only change the color scheme
export const theme = createTheme({
  palette: {
    primary: {
      light: blue[300],
      main: '#134B70',//green[500],
      dark: blue[700],
    },
    secondary: {
      light: pink[300],
      main: "#00c5d8",
      dark: pink[700],
    },
  },
  shape: {
    borderRadius: 18,
  }, 
  padding: 40,
});

// App is the root component of our application and as children contain all our pages
// We use React Router's BrowserRouter and Routes components to define the pages for
// our application, with each Route component representing a page and the common
// NavBar component allowing us to navigate between pages (with hyperlinks)
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:album_id" element={<AlbumInfoPage />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/zip_code_view/:zip_code" element={<ZipCodePage />} />
          <Route path="/comparison_view/:zip_code1/:zip_code2" element={<ComparisonPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}