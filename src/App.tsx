import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Rules from './pages/Rules';
import Game from './pages/Game/Game';
import Achievements from './pages/Achievements/Achievements';
import Materials from './pages/Materials/Materials';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <div className="app">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={
                <ProtectedRoute requireProfile={false}>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/game" element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } />
              <Route path="/achievements" element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              } />
              <Route path="/materials" element={<Materials />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/rules" element={<Rules />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
