import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Collection from './pages/Collection';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import { Toaster } from 'react-hot-toast';
import { initializeSubCategories } from './utils/initSubCategories';

function App() {
  useEffect(() => {
    const initCategories = async () => {
      try {
        await initializeSubCategories();
      } catch (error) {
        console.error('Alt kategoriler başlatılırken hata:', error);
      }
    };

    initCategories();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-zinc-950 text-white">
          <Navbar />
          <main className="md:pl-20 pb-16 md:pb-0">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
        <Toaster position="bottom-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
