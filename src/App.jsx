import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import './App.css'
import Home from './screens/Home'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element />
      </Routes>
    </BrowserRouter>
  );
}
export default App
