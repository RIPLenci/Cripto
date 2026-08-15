import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, User, Key, Eye, EyeOff, 
  ShieldCheck, ArrowRight, Activity, Terminal, ShieldAlert, CheckCircle2, UserPlus, LogIn,
  Fingerprint, ScanFace, Cpu, Network, Shield
} from 'lucide-react';
import { authService } from '../services';
import { CustomPreferences, UserProfile } from '../types';

interface AuthScreenProps {
  preferences: CustomPreferences;
  onAuthSuccess: (token: string, user: UserProfile) => void;
  notify: (msg: string, type: 'success' | 'alert' | 'info') => void;
}

export function AuthScreen({ preferences, onAuthSuccess, notify }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [verificationStep, setVerificationStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isSendingForgotCode, setIsSendingForgotCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setSecurityLogs(prev => [...prev.slice(-5), `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    addLog("Aether Security Engine initialized.");
    addLog("Waiting for biometric/credential input...");
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    addLog("Verifying identity via encrypted channel...");

    try {
      const data = await authService.login(authEmail, authPassword);
      addLog("Authentication successful. Handshake complete.");
      notify('Conexión Segura e Inicio de Sesión exitoso', 'success');
      
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 800);
    } catch (err: any) {
      addLog(`ERR: ${err.message}`);
      setAuthError(err.message);
      setIsAuthenticating(false);
    }
  };

  const handleRequestVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail.includes('@')) {
      setAuthError('Por favor ingresa un correo Gmail válido.');
      return;
    }

    setIsSendingCode(true);
    addLog("Requesting secure OTP via SMTP...");

    try {
      const data = await authService.sendVerificationCode(authEmail);
      setVerificationStep('otp');

      if (data.devCode) {
        setOtpCode(data.devCode);
        notify(`Código de verificación: ${data.devCode}`, 'info');
      } else if (data.emailSuccess === false) {
        setAuthError(`Aviso de entrega SMTP: (${data.emailError || 'Error de autenticación'}). Usa el código de seguridad o verifica tu servidor SMTP.`);
        notify(`Aviso de entrega por correo.`, 'alert');
      } else {
        notify(`Código de verificación enviado a ${authEmail}. Revisa tu bandeja de entrada o SPAM.`, 'success');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsVerifyingCode(true);
    addLog("Validating OTP footprint...");

    try {
      const data = await authService.registerVerify({
        name: authName,
        email: authEmail,
        password: authPassword,
        code: otpCode
      });

      addLog("Registration successful. Key exchanged.");
      notify('Correo verificado y usuario registrado exitosamente', 'success');
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 800);
    } catch (err: any) {
      setAuthError(err.message);
      setIsVerifyingCode(false);
    }
  };

  const handleForgotCodeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.includes('@')) {
      setForgotError('Ingresa un correo de Gmail válido.');
      return;
    }

    setIsSendingForgotCode(true);
    addLog("Initiating account recovery protocol...");

    try {
      const data = await authService.forgotPassword(forgotEmail);
      setForgotSuccess(data.message);
      setForgotStep('verify');

      if (data.devCode) {
        setForgotCode(data.devCode);
        notify(`Código de recuperación generado: ${data.devCode}`, 'info');
      } else {
        notify(`Código enviado a ${forgotEmail}. Revisa tu bandeja de entrada o SPAM.`, 'success');
      }
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setIsSendingForgotCode(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Las contraseñas no coinciden.');
      return;
    }

    setIsResettingPassword(true);
    addLog("Committing new encrypted password...");

    try {
      const data = await authService.resetPassword(forgotEmail, forgotCode, forgotNewPassword);
      setForgotSuccess(data.message);
      notify('Contraseña restablecida con éxito', 'success');
      
      setTimeout(() => {
        setAuthMode('login');
        setForgotStep('request');
        setForgotEmail('');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Helper function to render modern inputs with glowing icons
  const renderInput = (
    icon: React.ReactNode, 
    type: string, 
    placeholder: string, 
    value: string, 
    onChange: (val: string) => void,
    extraIcon?: React.ReactNode,
    maxLength?: number
  ) => {
    return (
      <div className="relative group">
        <div 
          className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-slate-800 transition-colors group-focus-within:border-[var(--accent)]"
          style={{ '--accent': preferences.accent } as React.CSSProperties}
        >
          <div 
            className="w-full h-full absolute inset-0 opacity-0 group-focus-within:opacity-10 transition-opacity"
            style={{ backgroundColor: preferences.accent }}
          />
          <div className="relative z-10 transition-colors text-slate-500 group-focus-within:text-[var(--accent)]" style={{ '--accent': preferences.accent } as React.CSSProperties}>
            {icon}
          </div>
        </div>
        <input
          type={type}
          required
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-16 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:bg-slate-900 transition-all font-medium text-sm shadow-inner"
          style={{ '--accent': preferences.accent } as React.CSSProperties}
        />
        {extraIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {extraIcon}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-[#030712] flex flex-col lg:flex-row items-center justify-center min-h-0">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] mix-blend-screen animate-pulse opacity-20"
          style={{ backgroundColor: preferences.accent }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[150px] mix-blend-screen animate-pulse opacity-10"
          style={{ backgroundColor: preferences.accent }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 p-6 sm:p-12 z-10 relative">
        
        {/* Left Side: Branding & Security Terminal */}
        <div className="hidden lg:flex flex-col max-w-md w-full space-y-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-5">
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group"
              >
                <div 
                  className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: preferences.accent }}
                />
                <div className="absolute inset-0 rounded-3xl ring-2 ring-white/10"></div>
                <div 
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent opacity-40"
                  style={{ fromColor: preferences.accent } as any} // pseudo gradient
                />
                <Fingerprint 
                  className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-colors" 
                  style={{ color: preferences.accent }}
                />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tight flex items-center gap-1">
                  Aether<span style={{ color: preferences.accent }}>OS</span>
                </h1>
                <p className="text-slate-400 text-sm tracking-[0.2em] uppercase font-bold mt-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: preferences.accent }} /> Quantum Sec Layer
                </p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-base font-medium">
              Accediendo a una infraestructura de grado militar Zero-Trust. El tráfico y las comunicaciones son cifradas punto a punto en tiempo real.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-2xl font-mono text-xs overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-0 pointer-events-none"></div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <span className="text-slate-500 uppercase flex items-center gap-2 font-bold tracking-widest text-[10px]">
                  <Cpu className="w-4 h-4" style={{ color: preferences.accent }} /> Engine Logs
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                  <Activity className="w-3 h-3 animate-pulse" /> Active
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {securityLogs.map((log, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-slate-400 flex gap-2 font-medium"
                    >
                      <span className="text-slate-600 shrink-0">{log.split('] ')[0]}]</span>
                      <span style={{ color: log.includes('ERR') ? '#fb7185' : preferences.accent }}>
                        {log.split('] ')[1]}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Forms */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-950/80 backdrop-blur-3xl border border-slate-800/60 p-8 sm:p-10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Accent Top Border */}
            <div 
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: preferences.accent }}
            />

            {/* Authenticating Overlay */}
            <AnimatePresence>
              {(isAuthenticating || isVerifyingCode || isResettingPassword) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-2 border-slate-800 rounded-full flex items-center justify-center">
                      <div 
                        className="w-20 h-20 border-2 rounded-full absolute top-2 left-2 border-t-transparent animate-spin"
                        style={{ borderColor: preferences.accent, borderTopColor: 'transparent' }}
                      ></div>
                      <ScanFace className="w-10 h-10 animate-pulse" style={{ color: preferences.accent }} />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-sm tracking-widest uppercase animate-pulse">
                    Estableciendo túnel seguro...
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8 text-center space-y-3">
              <h2 className="text-2xl font-black text-white tracking-wide">
                {authMode === 'login' ? 'Identidad Aether' : authMode === 'forgot' ? 'Recuperar Identidad' : 'Nueva Identidad'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {authMode === 'login' ? 'Inserta tus credenciales para acceder al panel' : authMode === 'forgot' ? 'Verificación OTP requerida para restablecer acceso' : 'Registra tu huella digital en el sistema'}
              </p>
            </div>

            {/* Error Messages */}
            <AnimatePresence>
              {(authError || forgotError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 backdrop-blur-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <p className="text-xs font-bold text-rose-300 leading-relaxed">{authError || forgotError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {renderInput(<Mail className="w-5 h-5" />, "email", "usuario@gmail.com", authEmail, setAuthEmail)}
                
                <div className="space-y-2">
                  {renderInput(
                    <Key className="w-5 h-5" />, 
                    showPassword ? "text" : "password", 
                    "Contraseña", 
                    authPassword, 
                    setAuthPassword,
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] font-bold transition-colors hover:brightness-125"
                      style={{ color: preferences.accent }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full mt-2 py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                  style={{ backgroundColor: preferences.accent }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    Iniciar Sesión <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === 'register' && (
              <>
                {verificationStep === 'form' && (
                  <form onSubmit={handleRequestVerificationCode} className="space-y-5">
                    {renderInput(<User className="w-5 h-5" />, "text", "Nombre Completo", authName, setAuthName)}
                    {renderInput(<Mail className="w-5 h-5" />, "email", "usuario@gmail.com", authEmail, setAuthEmail)}
                    {renderInput(<Key className="w-5 h-5" />, "password", "Contraseña (min 6 caracteres)", authPassword, setAuthPassword)}

                    <button
                      type="submit"
                      disabled={isSendingCode}
                      className="w-full mt-2 py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group relative overflow-hidden"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                      <span className="relative z-10 flex items-center gap-2">
                        {isSendingCode ? 'Transmitiendo...' : 'Verificar Identidad'}
                      </span>
                    </button>
                  </form>
                )}

                {verificationStep === 'otp' && (
                  <form onSubmit={handleVerifyCodeSubmit} className="space-y-6">
                    <div 
                      className="p-5 rounded-2xl border bg-opacity-10 text-center relative overflow-hidden" 
                      style={{ borderColor: `${preferences.accent}40`, backgroundColor: `${preferences.accent}10` }}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full"></div>
                      <Network className="w-8 h-8 mx-auto mb-3" style={{ color: preferences.accent }} />
                      <p className="text-xs font-bold text-slate-300 mb-1">Código de enlace enviado a</p>
                      <p className="text-sm font-mono font-bold tracking-wider" style={{ color: preferences.accent }}>{authEmail}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">
                        OTP de 6 dígitos
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-white placeholder-slate-700 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-mono text-3xl text-center tracking-[0.5em] shadow-inner"
                        style={{ '--accent': preferences.accent } as React.CSSProperties}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingCode || otpCode.length !== 6}
                      className="w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      {isVerifyingCode ? 'Validando...' : 'Confirmar Enlace'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setVerificationStep('form')}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider"
                    >
                      Volver
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Forgot Password Form */}
            {authMode === 'forgot' && (
              <>
                {forgotSuccess && forgotStep === 'request' && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <p className="text-xs font-bold text-emerald-300">{forgotSuccess}</p>
                  </div>
                )}

                {forgotStep === 'request' && (
                  <form onSubmit={handleForgotCodeRequest} className="space-y-5">
                    {renderInput(<Mail className="w-5 h-5" />, "email", "usuario@gmail.com", forgotEmail, setForgotEmail)}
                    
                    <button
                      type="submit"
                      disabled={isSendingForgotCode}
                      className="w-full mt-2 py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      {isSendingForgotCode ? 'Transmitiendo...' : 'Solicitar OTP'}
                    </button>
                  </form>
                )}

                {forgotStep === 'verify' && (
                  <form onSubmit={handleForgotReset} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">
                        OTP de 6 dígitos
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-white placeholder-slate-700 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-mono text-center tracking-[0.5em] text-2xl shadow-inner"
                        style={{ '--accent': preferences.accent } as React.CSSProperties}
                      />
                    </div>

                    {renderInput(<Lock className="w-5 h-5" />, "password", "Nueva Contraseña", forgotNewPassword, setForgotNewPassword)}
                    {renderInput(<CheckCircle2 className="w-5 h-5" />, "password", "Confirmar Contraseña", forgotConfirmPassword, setForgotConfirmPassword)}

                    <button
                      type="submit"
                      disabled={isResettingPassword || forgotCode.length !== 6 || !forgotNewPassword}
                      className="w-full mt-2 py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      {isResettingPassword ? 'Actualizando...' : 'Restablecer Acceso'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Form Footer / Toggles */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setVerificationStep('form');
                  setAuthError(null);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setForgotStep('request');
                }}
                className="text-[11px] font-black text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
              >
                {authMode === 'login' || authMode === 'forgot' ? (
                  <><UserPlus className="w-4 h-4" style={{ color: preferences.accent }} /> Crear nueva cuenta</>
                ) : (
                  <><LogIn className="w-4 h-4" style={{ color: preferences.accent }} /> Acceder a mi cuenta</>
                )}
              </button>
              
              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-[11px] font-black text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
                >
                  <ArrowRight className="w-4 h-4" style={{ color: preferences.accent }} /> Volver al Inicio
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
