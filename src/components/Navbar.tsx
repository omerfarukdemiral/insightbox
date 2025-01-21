import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiHome, FiCompass, FiFolder } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import logo from '../assets/insight-box-logo.svg';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <nav className="fixed md:top-0 bottom-0 md:left-0 w-full md:w-20 md:h-screen h-16 bg-background-dark border-t md:border-t-0 md:border-r border-primary-light/20 flex md:flex-col flex-row items-center md:py-8 z-50">
      <div className="md:mb-12 hidden md:block">
        <Link to="/" className="flex flex-col items-center">
          <img src={logo} alt="InsightBox Logo" className="w-12 h-12" />
        </Link>
      </div>

      <div className="flex md:flex-col flex-row items-center md:space-y-8 md:space-x-0 space-x-8 flex-1 justify-center md:justify-start px-4 md:px-0">
        <Link
          to="/"
          className={`nav-icon-link group ${
            location.pathname === '/' ? 'text-white' : 'text-gray-400'
          }`}
        >
          <FiHome className="w-6 h-6" />
          <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Ana Sayfa</span>
        </Link>

        <Link
          to="/discover"
          className={`nav-icon-link group ${
            location.pathname === '/discover' ? 'text-white' : 'text-gray-400'
          }`}
        >
          <FiCompass className="w-6 h-6" />
          <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Keşfet</span>
        </Link>

        <Link
          to="/collection"
          className={`nav-icon-link group ${
            location.pathname === '/collection' ? 'text-white' : 'text-gray-400'
          }`}
        >
          <FiFolder className="w-6 h-6" />
          <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Koleksiyonlarım</span>
        </Link>

        {currentUser && (
          <>
            <Link
              to="/profile"
              className={`nav-icon-link group ${
                location.pathname === '/profile' ? 'text-white' : 'text-gray-400'
              }`}
            >
              <FiUser className="w-6 h-6" />
              <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Profil</span>
            </Link>

            <button
              onClick={handleLogout}
              className="nav-icon-link group md:mt-auto text-gray-400 hover:text-white"
            >
              <FiLogOut className="w-6 h-6" />
              <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Çıkış</span>
            </button>
          </>
        )}

        {!currentUser && (
          <Link
            to="/login"
            className={`nav-icon-link group ${
              location.pathname === '/login' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <FiUser className="w-6 h-6" />
            <span className="nav-tooltip md:left-full md:ml-2 md:top-0 -top-full left-1/2 -translate-x-1/2 md:translate-x-0">Giriş</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 