import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
     <Route index element={<LoginForm/>} />
        <Route path="/" element={<Layout/>}>
        <Route path="/" index element={<Dashboard/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
     
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
