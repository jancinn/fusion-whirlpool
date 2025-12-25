import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminSystem from './pages/AdminSystem';
import Requests from './pages/Requests';
import Calendar from './pages/Calendar';

import Approvals from './pages/Approvals';
import Users from './pages/Users';
import Proposals from './pages/Proposals';
import Communication from './pages/Communication';
import ToDoList from './pages/ToDoList';
import Documents from './pages/Documents';
import MeetingMinutes from './pages/MeetingMinutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sistema" element={<AdminSystem />} />
            <Route path="/solicitudes" element={<Requests />} />
            <Route path="/propuestas" element={<Proposals />} />
            <Route path="/comunicacion" element={<Communication />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/aprobaciones" element={<Approvals />} />
            <Route path="/todo" element={<ToDoList />} />
            <Route path="/documentos" element={<Documents />} />
            <Route path="/actas" element={<MeetingMinutes />} />
            <Route path="/registro-usuarios" element={<Users />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
