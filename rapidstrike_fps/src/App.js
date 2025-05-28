import React from 'react';
import './App.css';
import RapidStrikeContainer from './RapidStrikeContainer';

// PUBLIC_INTERFACE
function App() {
  // App renders just the RapidStrike FPS container as its core
  return (
    <RapidStrikeContainer />
  );
}

export default App;