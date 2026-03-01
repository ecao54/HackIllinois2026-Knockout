import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Mock/offline game routes (no API needed)
import PlaySetup from './pages/PlaySetup';
import MockGame from './pages/MockGame';
import MockGameOver from './pages/MockGameOver';

// Full API-backed routes
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import WaitingRoom from './pages/WaitingRoom';
import GameBoard from './pages/GameBoard';
import GameOver from './pages/GameOver';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        {/* Playable game (mock engine, no API) */}
        <Route path="/" element={<PlaySetup />} />
        <Route path="/play/game" element={<MockGame />} />
        <Route path="/play/over" element={<MockGameOver />} />

        {/* Full flow (needs API backend) */}
        <Route path="/home" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/game/waiting" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
        <Route path="/game/:gameId" element={<ProtectedRoute><GameBoard /></ProtectedRoute>} />
        <Route path="/game/:gameId/over" element={<ProtectedRoute><GameOver /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
