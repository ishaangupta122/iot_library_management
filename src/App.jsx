import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar       from "./components/Navbar";
import StudentPage  from "./pages/StudentPage";
import AdminPage    from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <Routes>
          <Route path="/"      element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />}   />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
