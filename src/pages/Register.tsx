import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup, googleSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError('Şifreler eşleşmiyor');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (error) {
      setError('Hesap oluşturulurken bir hata oluştu.');
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
      setError('Google ile kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background-dark">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/insight-box-logo.svg" alt="InsightBox Logo" className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hesap Oluştur</h2>
            <p className="text-gray-400">AI Destekli Bilgi Platformuna Katılın</p>
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

            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input-field pl-10 w-full"
                placeholder="Şifrenizi tekrar girin"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>Kayıt Ol</span>
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
              <span>Google ile Kayıt Ol</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-white hover:text-gray-300 transition-colors">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 