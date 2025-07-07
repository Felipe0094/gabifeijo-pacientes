import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth({ onLogin }: { onLogin?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onLogin?.();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setMode('login'); // Após cadastro, volta para login
  };

  return (
    <div className="max-w-xs mx-auto mt-10 space-y-4 bg-white p-6 rounded-xl shadow border">
      <h2 className="text-xl font-bold text-center mb-2">
        {mode === 'login' ? 'Login da Nutricionista' : 'Cadastro de Usuário'}
      </h2>
      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? (mode === 'login' ? 'Entrando...' : 'Cadastrando...') : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
        </button>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      </form>
      <div className="text-center mt-2">
        {mode === 'login' ? (
          <button type="button" className="text-green-700 underline text-sm" onClick={() => { setMode('signup'); setError(null); }}>
            Cadastrar novo usuário
          </button>
        ) : (
          <button type="button" className="text-green-700 underline text-sm" onClick={() => { setMode('login'); setError(null); }}>
            Já tem conta? Fazer login
          </button>
        )}
      </div>
    </div>
  );
} 