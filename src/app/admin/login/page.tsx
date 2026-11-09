'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Login gagal.');
      router.replace('/admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login gagal. Coba kembali.');
    } finally { setLoading(false); }
  }

  return <main className="admin-login-page"><Link href="/" className="admin-back">← Kembali ke website tamu</Link><section className="admin-login-card"><div className="admin-brand-mark">K</div><span className="admin-eyebrow">KAMARKU · PENGELOLA</span><h1>Masuk ke<br/><em>dashboard admin.</em></h1><p>Gunakan akun staf hotel untuk mengelola operasional KamarKu.</p><form onSubmit={signIn}><label>Email<input autoComplete="username" name="email" type="email" required/></label><label>Password<input autoComplete="current-password" name="password" type="password" required/></label>{error && <p className="admin-login-error" role="alert">{error}</p>}<button className="admin-submit" disabled={loading}>{loading ? 'Memeriksa…' : 'Masuk ke dashboard'} <span>↗</span></button></form><small>Akses ini hanya untuk personel hotel yang berwenang.</small></section></main>;
}
