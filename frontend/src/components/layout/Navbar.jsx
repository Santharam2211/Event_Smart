import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, LayoutDashboard, Calendar, Settings, Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Events', path: '/events', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Winners', path: '/winners', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const authLinks = user ? [
    { name: 'Dashboard', path: user.role === 'Admin' ? '/admin/dashboard' : user.role === 'Association Member' ? '/scanner' : '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-4 h-4" /> },
  ] : [
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register', primary: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'py-3 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20' : 'py-6 bg-transparent'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Event<span className="text-primary-600">Smart</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6 pr-6 border-r border-slate-200">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`flex items-center gap-2 font-bold text-sm transition-colors ${
                  location.pathname === link.path ? 'text-primary-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-6">
                {authLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="font-bold text-sm text-slate-700 hover:text-primary-600 transition-all flex items-center gap-2">
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
                <button onClick={handleLogout} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="font-bold text-sm text-slate-700 hover:text-primary-600 px-4">Login</Link>
                <Link to="/register" className="btn-primary py-2.5 px-6 !text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {navLinks.concat(authLinks).map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-slate-700 hover:text-primary-600"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              {user && (
                <button onClick={handleLogout} className="w-full flex items-center gap-3 text-lg font-bold text-red-500 pt-4 border-t border-slate-100">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
