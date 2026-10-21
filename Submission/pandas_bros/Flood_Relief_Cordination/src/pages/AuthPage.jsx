import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { 
      role: 'Relief Coordinator (Admin)', 
      email: 'admin@reliefhub.org', 
      password: 'admin123', 
      permissions: 'Full access: manage camps, inventory, needs, dispatches, donations, volunteers',
      icon: Shield,
      color: 'text-primary-600 bg-primary-100'
    },
    { 
      role: 'Field Volunteer', 
      email: 'volunteer@reliefhub.org', 
      password: 'volunteer123', 
      permissions: 'View access: camps, needs, inventory, dispatches, donations, volunteers',
      icon: Users,
      color: 'text-primary-600 bg-primary-100'
    },
  ];

  const autoFill = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-bg">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-100/50 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary-100/50 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-100/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-xl mb-5">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">ReliefHub</h1>
          <p className="text-surface-500 mt-2 text-lg">Empowering Coordinated Response</p>
        </div>

        {/* Login Card */}
        <Card className="mb-6 shadow-xl border-surface-200 bg-white">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-shake" role="alert">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <label htmlFor="email" className="label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@reliefhub.org"
                    required
                    autoComplete="email"
                    className="input pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="input pl-12 pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 transition-colors underline-offset-2 hover:underline">
                  Forgot Password?
                </a>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3.5 text-lg font-medium rounded-xl transition-all"
                loading={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.4)'
                }}
              >
                Sign In to ReliefHub
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Quick Access Cards */}
        <div className="mb-6">
          <p className="text-center text-sm text-surface-500 mb-4">Quick sign in with demo accounts</p>
          <div className="grid grid-cols-2 gap-3">
            {demoCredentials.map((cred, index) => (
              <button
                key={index}
                type="button"
                onClick={() => autoFill(cred)}
                className="group p-4 rounded-xl border-2 border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cred.color}`}>
                    <cred.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{cred.role}</span>
                </div>
                <div className="text-xs text-surface-500 space-y-1 font-mono">
                  <div>✉ {cred.email}</div>
                  <div>🔒 {cred.password}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-8">
          Demo application • Not for production use • Data resets on server restart
        </p>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-primary-100/30 blur-2xl" />
      <div className="absolute top-20 left-5 w-16 h-16 rounded-full bg-primary-100/30 blur-2xl" />
    </div>
  );
};

export default AuthPage;