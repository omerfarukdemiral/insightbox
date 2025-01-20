import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/');
    } catch (error) {
      setError('Google ile giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="card backdrop-blur-lg bg-opacity-50">
          <div className="text-center mb-8">
            <h2 className="logo-text text-3xl mb-2">InsightBox</h2>
            <p className="font-display text-gray-400">AI Destekli Bilgi Platformu</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 w-full"
                placeholder="E-posta adresiniz"
                required
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 w-full"
                placeholder="Şifreniz"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>Giriş Yap</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary-light/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-dark text-gray-400 font-display">veya</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-secondary w-full flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Google ile Giriş Yap</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 font-display">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-accent-blue hover:text-accent-purple transition-colors">
                Kayıt Olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 