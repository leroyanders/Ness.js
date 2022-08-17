import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import QuickStart from './pages/QuickStart';
import Documentation from './pages/Documentation';
import NotFound from './pages/NotFound';

// Routes
const HomePage = () => <Home/>
const QuickStartPage = () => <QuickStart/>
const DocumentationPage = () => <Documentation/>

function Router() {
  return (
    <React.Fragment>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/getting-started" element={<QuickStartPage/>} />
        <Route path="/documentation" element={<DocumentationPage/>} />
        <Route path="/*" element={<NotFound/>} />
      </Routes>
    </React.Fragment>
  )
}

export default Router;