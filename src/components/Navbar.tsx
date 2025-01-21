import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiHome, FiCompass, FiFolder } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import logo from '../assets/insight-box-logo.svg';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: FiHome, label: 'Ana Sayfa' },
    { path: '/discover', icon: FiCompass, label: 'Keşfet' },
    { path: '/collection', icon: FiFolder, label: 'Koleksiyonlar' },
    { path: '/profile', icon: FiUser, label: 'Profil' },
  ];

  return (
    <nav className="fixed w-full md:w-20 h-16 md:h-full bottom-0 md:left-0 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 border-t md:border-t-0 md:border-r border-white/10 z-50">
      {/* Logo - Sadece masaüstünde görünür */}
      <div className="hidden md:flex justify-center py-6">
        <Link to="/">
          <img src={logo} alt="InsightBox Logo" className="w-10 h-10" />
        </Link>
      </div>

      {/* Navigasyon Linkleri */}
      <div className="h-full md:h-[calc(100%-160px)] flex md:flex-col items-center justify-around md:justify-center md:gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative group flex items-center justify-center w-16 h-16 md:w-full transition-all duration-300 ${
                active ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {/* Aktif sayfa göstergesi - Masaüstü */}
              {active && (
                <div className="hidden md:block absolute left-0 w-1 h-8 bg-gradient-to-b from-accent-purple to-accent-purple/50 rounded-r-full shadow-[0_0_12px_rgba(147,51,234,0.5)]" />
              )}
              
              {/* Aktif sayfa göstergesi - Mobil */}
              {active && (
                <div className="md:hidden absolute bottom-0 w-8 h-1 bg-gradient-to-r from-accent-purple to-accent-purple/50 rounded-t-full shadow-[0_0_12px_rgba(147,51,234,0.5)]" />
              )}
              
              {/* İkon Container */}
              <div className={`relative flex items-center justify-center transition-all duration-300 ${
                active ? 'scale-110 transform' : 'group-hover:scale-105'
              }`}>
                <Icon className="w-6 h-6" />
                
                {/* Aktif durumda arka plan efekti */}
                {active && (
                  <div className="absolute inset-0 w-10 h-10 bg-accent-purple/10 rounded-full blur-xl animate-pulse" />
                )}
              </div>

              {/* Hover tooltip - Sadece masaüstünde */}
              <div className="hidden md:block absolute left-20 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Çıkış Butonu - Sadece masaüstünde görünür */}
      {currentUser && (
        <div className="hidden md:flex justify-center absolute bottom-0 left-0 w-full p-6">
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors relative group"
          >
            <FiLogOut className="w-6 h-6" />
            <div className="absolute left-14 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
              Çıkış Yap
            </div>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 