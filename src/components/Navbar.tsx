import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiBookmark, FiLogOut, FiUser } from 'react-icons/fi';

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-20 h-screen bg-background-dark border-r border-primary-light/20 flex flex-col items-center py-8 z-50">
      <div className="mb-12">
        <Link to="/" className="flex flex-col items-center">
          <img src="/insight-box-logo.svg" alt="InsightBox Logo" className="w-12 h-12" />
        </Link>
      </div>

      <div className="flex flex-col items-center space-y-8 flex-1">
        <Link
          to="/"
          className="nav-icon-link group"
        >
          <FiHome className="w-6 h-6" />
          <span className="nav-tooltip">Ana Sayfa</span>
        </Link>

        {currentUser && (
          <>
            <Link
              to="/collection"
              className="nav-icon-link group"
            >
              <FiBookmark className="w-6 h-6" />
              <span className="nav-tooltip">Koleksiyon</span>
            </Link>

            <Link
              to="/profile"
              className="nav-icon-link group"
            >
              <FiUser className="w-6 h-6" />
              <span className="nav-tooltip">Profil</span>
            </Link>

            <button
              onClick={handleLogout}
              className="nav-icon-link group mt-auto"
            >
              <FiLogOut className="w-6 h-6" />
              <span className="nav-tooltip">Çıkış</span>
            </button>
          </>
        )}

        {!currentUser && (
          <Link
            to="/login"
            className="nav-icon-link group"
          >
            <FiUser className="w-6 h-6" />
            <span className="nav-tooltip">Giriş</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 