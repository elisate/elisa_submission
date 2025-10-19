import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/UserManagement";
import ProtoExport from "./components/ProtoExport";

function App() {
  return (
    <BrowserRouter>
      <Routes>
     {/* <Route index element={<LoginForm/>} /> */}
        <Route path="/" element={<Layout/>}>
        <Route path="/" index element={<Dashboard/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/users" element={<UserManagement/>}/>
        <Route path="/protobuf" element={<ProtoExport/>}/>
        
     
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
