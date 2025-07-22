import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import './App.css'
import Home from './screens/Home'
import Login from './screens/Login'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
