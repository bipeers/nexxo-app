import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './App.css';

const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
    h2: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
    h3: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
    h4: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
    h5: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
    h6: {
      fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
    },
  },
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff6f61',
      dark: '#9a0036',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Nexxo Frontend</h1>
            <p>Multi-vendor Marketplace Platform</p>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<div><h2>Welcome to Nexxo</h2><p>Frontend is running successfully!</p></div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
