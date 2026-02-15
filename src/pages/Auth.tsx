import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ThemeLogo } from '@/components/ThemeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Eye, EyeOff, ArrowRight, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

type AuthView = 'login' | 'signup' | 'verify-otp' | 'forgot-password';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<AuthView>('login');
  const [otpCode, setOtpCode] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        setSignupEmail(email);
        setView('verify-otp');
        toast.success('Código de verificação enviado para seu e-mail!');
      }
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: signupEmail,
        token: otpCode,
        type: 'signup',
      });
      if (error) {
        toast.error('Código inválido ou expirado. Tente novamente.');
      } else {
        toast.success('Conta verificada com sucesso! Bem-vindo!');
        navigate('/');
      }
    } catch {
      toast.error('Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(resetEmail);
    setLoading(false);
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setOtpCode('');
  };

  const renderLogin = () => (
    <div className="animate-fade-scale">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Bem-vindo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Entre com sua conta para continuar
        </p>
      </div>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2 animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <Label htmlFor="signin-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200"
          />
        </div>
        <div className="space-y-2 animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <Label htmlFor="signin-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end animate-slide-up stagger-3" style={{ opacity: 0 }}>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={() => switchView('forgot-password')}
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="animate-slide-up stagger-4" style={{ opacity: 0 }}>
          <Button 
            type="submit" 
            className="w-full h-11 font-medium group"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </div>
        <div className="animate-slide-up stagger-4" style={{ opacity: 0 }}>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2"
            onClick={() => switchView('signup')}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Criar uma conta
          </button>
        </div>
      </form>
    </div>
  );

  const renderSignup = () => (
    <div className="animate-fade-scale">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Criar conta</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados para se cadastrar
        </p>
      </div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2 animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <Label htmlFor="signup-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200"
          />
        </div>
        <div className="space-y-2 animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <Label htmlFor="signup-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2 animate-slide-up stagger-3" style={{ opacity: 0 }}>
          <Label htmlFor="signup-confirm" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Confirmar senha
          </Label>
          <Input
            id="signup-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200"
          />
        </div>
        <div className="animate-slide-up stagger-4" style={{ opacity: 0 }}>
          <Button 
            type="submit" 
            className="w-full h-11 font-medium group"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Criando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Criar conta
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </div>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2"
          onClick={() => switchView('login')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Já tenho uma conta
        </button>
      </form>
    </div>
  );

  const renderVerifyOtp = () => (
    <div className="animate-fade-scale">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Verificar e-mail</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o código de 6 dígitos enviado para <span className="font-medium text-foreground">{signupEmail}</span>
        </p>
      </div>
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div className="flex justify-center animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={(value) => setOtpCode(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <Button 
            type="submit" 
            className="w-full h-11 font-medium group"
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Verificar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </div>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2"
          onClick={() => switchView('login')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </button>
      </form>
    </div>
  );

  const renderForgotPassword = () => (
    <div className="animate-fade-scale">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Redefinir senha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enviaremos um link para seu e-mail
        </p>
      </div>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="seu@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors duration-200"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full h-11 font-medium group" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Enviar link
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2"
          onClick={() => switchView('login')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 animate-glow-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/8 animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-primary/5 animate-glow-pulse" style={{ animationDelay: '4s' }} />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle variant="outline" />
      </div>

      {/* Main content */}
      <div 
        className={`relative z-10 w-full max-w-sm transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo & brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="animate-float">
              <ThemeLogo className="h-14 w-14 object-contain drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
            DRX Central
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de operações e equipes
          </p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-6 hover-lift">
          {view === 'login' && renderLogin()}
          {view === 'signup' && renderSignup()}
          {view === 'verify-otp' && renderVerifyOtp()}
          {view === 'forgot-password' && renderForgotPassword()}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          DRX Central © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Auth;
