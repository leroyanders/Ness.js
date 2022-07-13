import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';

// Routes
const HomePage = () => <Home/>

function Router() {
  return (
    <React.Fragment>
      <Routes>
        <Route path="/" element={<HomePage/>} />
      </Routes>
    </React.Fragment>
  )
}

export default Router;