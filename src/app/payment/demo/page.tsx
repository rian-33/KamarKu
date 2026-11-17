'use client';

import { useEffect, useState } from 'react';

type Booking = { code: string; roomName: string; checkIn: string; checkOut: string; guests: number; total: number };
type Outcome = 'paid' | 'failed' | 'cancelled';
const money = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function DemoPaymentPage() {
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('Memuat detail pembayaran…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const bookingCode = new URLSearchParams(window.location.search).get('code')?.trim() ?? '';
    setCode(bookingCode);
    if (!bookingCode) { setMessage('Kode booking tidak ditemukan.'); return; }
    fetch(`/api/bookings/${encodeURIComponent(bookingCode)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Detail booking gagal dimuat.');
        setBooking(data.booking);
        setMessage('');
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Detail booking gagal dimuat.'));
  }, []);

  async function chooseOutcome(outcome: Outcome) {
    if (!booking || busy) return;
    setBusy(true);
    setMessage('Memproses simulasi…');
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(code)}/demo-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Simulasi pembayaran gagal diproses.');
      window.location.assign(`/booking/result?code=${encodeURIComponent(code)}&demo=true`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Simulasi pembayaran gagal diproses.');
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f4f6f3', color: '#17392f' }}>
      <section style={{ width: 'min(560px, 100%)', padding: 'clamp(24px, 6vw, 44px)', background: '#fff', border: '1px solid #e4e9e4', borderRadius: 14, boxShadow: '0 18px 50px #17392f12' }}>
        <a href="/" style={{ color: '#35694f' }}>← Kembali ke KamarKu</a>
        <p style={{ margin: '32px 0 8px', color: '#9a781d', fontSize: 12, fontWeight: 700, letterSpacing: '.14em' }}>MODE UJI COBA · TANPA TRANSAKSI UANG</p>
        <h1 style={{ margin: '0 0 14px', fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 400 }}>Simulasi pembayaran</h1>
        <p style={{ color: '#5f6f66', lineHeight: 1.6 }}>Pilih hasil simulasi untuk melihat alur status booking. Tidak ada pembayaran nyata yang diproses.</p>
        {booking && <div style={{ display: 'grid', gap: 8, margin: '24px 0', padding: 18, borderRadius: 8, background: '#f2f5f1' }}>
          <strong>{booking.roomName}</strong>
          <span>{booking.checkIn} – {booking.checkOut} · {booking.guests} tamu</span>
          <strong style={{ color: '#b18a20', fontSize: 20 }}>{money(booking.total)}</strong>
          <small>Kode booking: {booking.code}</small>
        </div>}
        {message && <p role="status">{message}</p>}
        {booking && <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          <button disabled={busy} onClick={() => void chooseOutcome('paid')} style={{ minHeight: 48, border: 0, borderRadius: 7, background: '#24543f', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Simulasikan pembayaran berhasil</button>
          <button disabled={busy} onClick={() => void chooseOutcome('failed')} style={{ minHeight: 46, border: '1px solid #e2c8c4', borderRadius: 7, background: '#fff', color: '#a43e33', fontWeight: 600, cursor: 'pointer' }}>Simulasikan pembayaran gagal</button>
          <button disabled={busy} onClick={() => void chooseOutcome('cancelled')} style={{ minHeight: 42, border: 0, background: 'transparent', color: '#5f6f66', cursor: 'pointer' }}>Batalkan checkout</button>
        </div>}
      </section>
    </main>
  );
}
