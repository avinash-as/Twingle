import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Search, Users, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ form: error.response?.data?.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10 animate-in">
          <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl animate-glow-pulse">
            <Sparkles className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-dark-900 dark:text-dark-100 tracking-tight gradient-text">
            Join Twingle
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-3 text-lg">Discover people nearby and connect</p>
        </div>

        <Card className="card-elevated animate-in animate-in-delayed">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.form && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm animate-in">
                  {errors.form}
                </div>
              )}

              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Your name"
                autoComplete="name"
                required
                maxLength={50}
                icon={<User className="w-5 h-5" />}
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="you@example.com"
                autoComplete="email"
                required
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                icon={<Lock className="w-5 h-5" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                icon={<Lock className="w-5 h-5" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-dark-600 dark:text-dark-400">
                Already have an account?{' '}
                <NavLink to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline transition-colors">
                  Sign in
                </NavLink>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-dark-500 dark:text-dark-400 animate-in">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-3 gap-4 animate-in">
          <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-dark-200 dark:border-dark-700">
            <Search className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <p className="text-xs text-dark-600 dark:text-dark-400">Scan nearby</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-dark-200 dark:border-dark-700">
            <Users className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <p className="text-xs text-dark-600 dark:text-dark-400">Connect</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-dark-200 dark:border-dark-700">
            <Heart className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <p className="text-xs text-dark-600 dark:text-dark-400">Chat live</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;