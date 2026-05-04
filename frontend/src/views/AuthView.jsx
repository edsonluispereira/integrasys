import React, { useState } from 'react';
import { LogIn, User, ShieldCheck } from 'lucide-react';

function AuthView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Usuário ou senha incorretos.');
        setLoading(false);
        return;
      }

      onLogin(data);
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" style={{ marginBottom: '2rem', justifyContent: 'center', display: 'flex' }}>
            <img src="/logo.png" alt="Integrasys" style={{ width: '428px', height: '148px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', objectFit: 'contain' }} />
          </div>
          <p className="auth-subtitle">Gestão Inteligente para sua Empresa</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={14} /> USUÁRIO
            </label>
            <input 
              type="text" 
              placeholder="Digite seu usuário" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
              autoFocus
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogIn size={14} /> SENHA
            </label>
            <input 
              type="password" 
              placeholder="Digite sua senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="auth-footer">
          Integrasys · Soluções em Gestão ERP<br/>
          © 2026 Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}

export default AuthView;
