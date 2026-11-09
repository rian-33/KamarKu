'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { hotelToday } from '@/lib/date';
import { HotelIcon, type HotelIconName } from '@/components/hotel-icon';

type Tab = 'beranda' | 'kamar' | 'fasilitas' | 'makan' | 'tentang' | 'kontak';
type Room = { id: string; name: string; description: string; price: number; capacity: number; stock: number; image: string; amenities: string[] };
type Facility = { id?: string; name: string; category: string; description: string; image: string };
type Schedule = { id: number; mealType: 'BREAKFAST'|'LUNCH'|'DINNER'; startTime: string; endTime: string };
type Booking = { code: string; name: string; email: string; roomId: string; checkIn: string; checkOut: string; guests: number; total: number; status: 'pending' | 'confirmed' | 'cancelled' | 'completed' };
const initialRooms: Room[] = [
  { id: 'garden', name: 'Garden Room', description: 'Kamar nyaman dengan balkon pribadi menghadap taman tropis.', price: 780000, capacity: 2, stock: 5, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85', amenities: ['King bed', 'Balkon', 'Wi-Fi', 'Sarapan'] },
  { id: 'deluxe', name: 'Deluxe Retreat', description: 'Ruang lega dengan interior kayu hangat dan area duduk santai.', price: 1120000, capacity: 2, stock: 4, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85', amenities: ['King bed', 'Bathtub', 'Wi-Fi', 'Sarapan'] },
  { id: 'family', name: 'Family Suite', description: 'Ruang luas untuk keluarga, lengkap dengan ruang keluarga terpisah.', price: 1680000, capacity: 4, stock: 3, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85', amenities: ['2 kamar', 'Ruang keluarga', 'Wi-Fi', 'Sarapan'] },
];
const initialFacilities: Facility[] = [
  { id: 'facility-1', name: 'Kolam Renang Tropis', category: 'Relaksasi', description: 'Kolam renang outdoor dikelilingi taman rimbun, buka setiap hari pukul 07.00–20.00.', image: 'photo-1576013551627-0cc20b96c2a7' },
  { id: 'facility-2', name: 'Restoran Senja', category: 'Kuliner', description: 'Sajian Nusantara dan hidangan musiman dengan bahan segar dari petani lokal.', image: 'photo-1414235077428-338989a2e8c0' },
  { id: 'facility-3', name: 'Ruang Kebugaran', category: 'Kebugaran', description: 'Peralatan kardio dan beban untuk menjaga rutinitas Anda selama menginap.', image: 'photo-1534438327276-14e5300c3a48' },
  { id: 'facility-4', name: 'Spa Purnama', category: 'Relaksasi', description: 'Perawatan tradisional yang menenangkan dengan bahan alami pilihan.', image: 'photo-1540555700478-4be289fbecef' },
  { id: 'facility-5', name: 'Ruang Pertemuan', category: 'Bisnis', description: 'Ruang fleksibel dengan fasilitas presentasi dan dukungan tim kami.', image: 'photo-1497366754035-f200968a6e72' },
  { id: 'facility-6', name: 'Taman Rasa', category: 'Aktivitas', description: 'Kebun herbal kecil yang dapat dijelajahi bersama keluarga.', image: 'photo-1416879595882-3373a0480b5b' },
];
const initialMeals = [
  { type: 'Sarapan', time: '06.30 – 10.00', icon: '☀', dishes: ['Nasi goreng kampung', 'Telur pilihan', 'Buah potong', 'Kopi & teh'] },
  { type: 'Makan siang', time: '12.00 – 14.30', icon: '◉', dishes: ['Ikan bakar sambal matah', 'Sayur urap', 'Sup bening', 'Es teh serai'] },
  { type: 'Makan malam', time: '18.00 – 21.30', icon: '☾', dishes: ['Ayam panggang madu', 'Tumis sayuran', 'Nasi pandan', 'Puding kelapa'] },
];
const tabs: { id: Tab; label: string; icon: HotelIconName }[] = [
  { id: 'beranda', label: 'Beranda', icon: 'home' }, { id: 'kamar', label: 'Kamar', icon: 'bed' }, { id: 'fasilitas', label: 'Fasilitas', icon: 'sparkles' }, { id: 'makan', label: 'Jam Makan', icon: 'utensils' }, { id: 'tentang', label: 'Tentang', icon: 'info' }, { id: 'kontak', label: 'Kontak & Lokasi', icon: 'map-pin' },
];
const today = hotelToday;
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('beranda');
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [guests, setGuests] = useState(2);
  const [mealDate, setMealDate] = useState(today());
  const [mealItems, setMealItems] = useState(initialMeals);
  const [category, setCategory] = useState('Semua');
  const [rooms, setRooms] = useState(initialRooms);
  const [facilityItems, setFacilityItems] = useState<Facility[]>(initialFacilities);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serverAvailability, setServerAvailability] = useState<Record<string, number>>({});
  const [availabilityPending, setAvailabilityPending] = useState(true);
  const [notice, setNotice] = useState('');
  const [lookup, setLookup] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [identityPhoto, setIdentityPhoto] = useState<File | null>(null);
  const [identityConsent, setIdentityConsent] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [adminLogin, setAdminLogin] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityCategory, setNewFacilityCategory] = useState('Relaksasi');
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<'main'|'side'|'dessert'|'drink'>('main');
  const [newMenuSchedule, setNewMenuSchedule] = useState(1);
  const [schedules, setSchedules] = useState<Schedule[]>([{ id: 1, mealType: 'BREAKFAST', startTime: '06:30', endTime: '10:00' }, { id: 2, mealType: 'LUNCH', startTime: '12:00', endTime: '14:30' }, { id: 3, mealType: 'DINNER', startTime: '18:00', endTime: '21:30' }]);
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  useEffect(() => {
    const hash = window.location.hash.slice(1) as Tab;
    if (tabs.some((item) => item.id === hash)) setTab(hash);
  }, []);
  useEffect(() => { window.history.replaceState(null, '', `#${tab}`); }, [tab]);
  useEffect(() => {
    let active = true;
    setAvailabilityPending(true);
    setServerAvailability({});
    fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Ketersediaan kamar gagal dimuat.');
      if (active) {
        const fetched = data.rooms as (Room & { amenities: string[]; available: number })[];
        setRooms(fetched.map((room) => ({ ...room, amenities: room.amenities })));
        setServerAvailability(Object.fromEntries(fetched.map((room) => [room.id, room.available])));
        setAvailabilityPending(false);
      }
    }).catch((error: unknown) => { if (active) { setAvailabilityPending(false); setNotice(error instanceof Error ? error.message : 'Ketersediaan kamar gagal dimuat.'); } });
    return () => { active = false; };
  }, [checkIn, checkOut]);
  useEffect(() => {
    let active = true;
    fetch('/api/facilities', { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (active && Array.isArray(data.facilities)) setFacilityItems(data.facilities as Facility[]);
    }).catch(() => { if (active) setNotice('Data fasilitas sementara belum dapat dimuat.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    fetch(`/api/meals?date=${mealDate}`, { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (!active || !Array.isArray(data.meals)) return;
      setMealItems(data.meals.map((meal: { label: string; time: string; icon: string; menus: { name: string }[] }) => ({ type: meal.label, time: meal.time, icon: meal.icon, dishes: meal.menus.length ? meal.menus.map((menu) => menu.name) : ['Menu akan diumumkan'] })));
    }).catch(() => { if (active) setNotice('Menu pada tanggal ini belum dapat dimuat.'); });
    return () => { active = false; };
  }, [mealDate]);
  useEffect(() => {
    if (!admin) return;
    fetch('/api/admin/bookings', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Data booking gagal dimuat.');
      setBookings(data.bookings);
    }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'Data admin gagal dimuat.'));
  }, [admin]);
  useEffect(() => {
    if (!admin) return;
    fetch(`/api/admin/meals?date=${mealDate}`, { cache: 'no-store' }).then((response) => response.json()).then((data) => { if (Array.isArray(data.schedules)) setSchedules(data.schedules); }).catch(() => undefined);
  }, [admin, mealDate]);
  useEffect(() => {
    if (!admin) return;
    fetch('/api/admin/facilities', { cache: 'no-store' }).then((response) => response.json()).then((data) => { if (Array.isArray(data.facilities)) setFacilityItems(data.facilities); }).catch(() => undefined);
  }, [admin]);

  const available = useMemo(() => rooms.map((room) => ({ ...room, available: serverAvailability[room.id] ?? 0 })), [rooms, serverAvailability]);
  const visibleFacilities = facilityItems.filter((item) => category === 'Semua' || item.category === category);

  function showRooms() { setTab('kamar'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function fileAsDataUrl(file: File) {
    return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Foto KTP tidak dapat dibaca.'));reader.onerror=()=>reject(new Error('Foto KTP tidak dapat dibaca.'));reader.readAsDataURL(file);});
  }
  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRoom || !guestName.trim() || !guestEmail.includes('@')) return setNotice('Lengkapi nama dan alamat email yang valid.');
    if (!/^\d{16}$/.test(identityNumber) || !identityPhoto || !identityConsent) return setNotice('Masukkan 16 digit nomor KTP, unggah foto KTP, dan setujui penggunaan data.');
    if (identityPhoto.size > 5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(identityPhoto.type)) return setNotice('Foto KTP harus JPG, PNG, atau WebP maksimal 5 MB.');
    if (checkIn < today() || checkOut <= checkIn) return setNotice('Pilih tanggal check-in hari ini atau setelahnya, dan check-out setelah check-in.');
    const room = available.find((item) => item.id === selectedRoom.id);
    if (!room || room.available < 1) return setNotice('Maaf, kamar ini baru saja habis dipesan. Silakan pilih kamar lain.');
    try {
      const photoData = await fileAsDataUrl(identityPhoto);
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: guestName.trim(), email: guestEmail.trim(), roomId: room.id, checkIn, checkOut, guests, identityNumber, identityPhoto: photoData, identityConsent }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Pemesanan gagal disimpan.');
      setSelectedRoom(null); window.location.assign(data.booking.paymentUrl);
      const refreshed = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { cache: 'no-store' }).then((result) => result.json());
      setServerAvailability(Object.fromEntries(refreshed.rooms.map((item: { id: string; available: number }) => [item.id, item.available])));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Pemesanan gagal. Silakan coba kembali.'); }
  }
  async function updateStatus(code: string, status: Booking['status']) {
    const response = await fetch(`/api/admin/bookings?code=${encodeURIComponent(code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Status booking gagal diperbarui.');
    const refreshed = await fetch('/api/admin/bookings', { cache: 'no-store' }).then((result) => result.json());
    setBookings(refreshed.bookings);
    const availabilityResult = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { cache: 'no-store' }).then((result) => result.json());
    setServerAvailability(Object.fromEntries(availabilityResult.rooms.map((item: { id: string; available: number }) => [item.id, item.available])));
  }
  async function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!newRoomName.trim()) return;
    const response = await fetch('/api/admin/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newRoomName.trim(), description: 'Kamar nyaman untuk perjalanan Anda.', price: 780000, capacity: 2, stock: 5, amenities: ['King bed', 'Wi-Fi', 'Sarapan'] }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Tipe kamar gagal ditambahkan.');
    setRooms((all) => [...all, data.room]); setNewRoomName('');
    const refreshed = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { cache: 'no-store' }).then((result) => result.json());
    setServerAvailability(Object.fromEntries(refreshed.rooms.map((item: { id: string; available: number }) => [item.id, item.available])));
    setNotice('Tipe kamar berhasil ditambahkan.');
  }
  async function saveRoom(event: FormEvent<HTMLFormElement>, room: Room) {
    event.preventDefault();
    const response = await fetch(`/api/admin/rooms/${room.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Perubahan kamar gagal disimpan.');
    const refreshed = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { cache: 'no-store' }).then((result) => result.json());
    setServerAvailability(Object.fromEntries(refreshed.rooms.map((item: { id: string; available: number }) => [item.id, item.available])));
    setNotice(`Detail ${room.name} berhasil diperbarui.`);
  }
  async function deleteRoom(id: string) {
    const response = await fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Tipe kamar gagal dihapus.');
    setRooms((all) => all.filter((room) => room.id !== id));
    setNotice('Tipe kamar berhasil dihapus.');
  }
  async function addFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/admin/facilities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFacilityName, category: newFacilityCategory, description: 'Fasilitas KamarKu untuk kenyamanan selama menginap.', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=900&q=80' }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Fasilitas gagal ditambahkan.');
    setFacilityItems((all) => [...all, data.facility]); setNewFacilityName(''); setNotice('Fasilitas berhasil ditambahkan.');
  }
  async function deleteFacility(id: string) {
    const response = await fetch(`/api/admin/facilities/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Fasilitas gagal dihapus.');
    setFacilityItems((all) => all.filter((item) => item.id !== id));
  }
  async function saveFacility(event: FormEvent<HTMLFormElement>, facility: Facility) {
    event.preventDefault();
    if (!facility.id) return;
    const response = await fetch(`/api/admin/facilities/${facility.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(facility) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Perubahan fasilitas gagal disimpan.');
    setNotice(`Fasilitas ${facility.name} berhasil diperbarui.`);
  }
  async function addMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/admin/meals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduleId: newMenuSchedule, date: mealDate, dishName: newMenuName, category: newMenuCategory }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Menu gagal ditambahkan.');
    setNewMenuName('');
    const updated = await fetch(`/api/meals?date=${mealDate}`, { cache: 'no-store' }).then((result) => result.json());
    setMealItems(updated.meals.map((meal: { label: string; time: string; icon: string; menus: { name: string }[] }) => ({ type: meal.label, time: meal.time, icon: meal.icon, dishes: meal.menus.length ? meal.menus.map((menu) => menu.name) : ['Menu akan diumumkan'] })));
    setNotice('Menu berhasil ditambahkan.');
  }
  async function deleteMenu(name: string, schedule: number) {
    const result = await fetch(`/api/admin/meals?date=${mealDate}`, { cache: 'no-store' }).then((response) => response.json());
    const menu = result.menus?.find((item: { dishName: string; scheduleId: number; id: string }) => item.dishName === name && item.scheduleId === schedule);
    if (!menu) return;
    const response = await fetch(`/api/admin/meals?id=${menu.id}`, { method: 'DELETE' });
    if (!response.ok) return setNotice('Menu gagal dihapus.');
    const updated = await fetch(`/api/meals?date=${mealDate}`, { cache: 'no-store' }).then((res) => res.json());
    setMealItems(updated.meals.map((meal: { label: string; time: string; icon: string; menus: { name: string }[] }) => ({ type: meal.label, time: meal.time, icon: meal.icon, dishes: meal.menus.length ? meal.menus.map((item) => item.name) : ['Menu akan diumumkan'] })));
  }
  async function updateSchedule(event: FormEvent<HTMLFormElement>, schedule: Schedule) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/meals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mealType: schedule.mealType, startTime: form.get('startTime'), endTime: form.get('endTime') }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Jadwal makan gagal diperbarui.');
    const refreshed = await fetch(`/api/meals?date=${mealDate}`, { cache: 'no-store' }).then((result) => result.json());
    setMealItems(refreshed.meals.map((meal: { label: string; time: string; icon: string; menus: { name: string }[] }) => ({ type: meal.label, time: meal.time, icon: meal.icon, dishes: meal.menus.length ? meal.menus.map((item) => item.name) : ['Menu akan diumumkan'] })));
    setNotice('Jam makan berhasil diperbarui.');
  }
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? 'Login admin gagal.');
    setAdminLogin(false); setAdmin(true); setNotice('Anda berhasil masuk ke dashboard admin.');
  }
  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAdmin(false); setBookings([]); setNotice('Anda telah keluar dari dashboard admin.');
  }

  const statusLabel: Record<Booking['status'], string> = { pending: 'Menunggu konfirmasi', confirmed: 'Terkonfirmasi', cancelled: 'Dibatalkan', completed: 'Selesai' };
  return <>
    <header className="topbar"><a className="brand" href="#beranda" onClick={() => setTab('beranda')}><span className="brand-mark">K</span><span>Kamar<span className="brand-light">Ku</span><small>HOTEL & RETREAT</small></span></a><div className="top-actions"><button className="text-button" onClick={() => { setTab('kontak'); window.setTimeout(() => document.getElementById('booking-lookup')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Cek booking</button><a className="button button-small" href="/admin/login">Admin</a></div></header>
    <nav className="tabbar" aria-label="Navigasi utama">{tabs.map((item) => <button key={item.id} className={`tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined}><HotelIcon className="tab-icon" name={item.icon}/><span className="tab-label">{item.label}</span></button>)}</nav>
    <main>
      {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Tutup" onClick={() => setNotice('')}>×</button></div>}
      {tab === 'beranda' && <>
        <section className="hero"><div className="hero-image"/><div className="hero-content"><span className="eyebrow eyebrow-light">SEBUAH JEDA YANG BERARTI</span><h1>Temukan tenang,<br/><em>rasakan rumah.</em></h1><p>Ruang hangat di tengah alam, dirancang untuk membuat setiap momen terasa lebih dekat.</p><button className="button button-gold" onClick={showRooms}>Temukan kamar <span>↗</span></button><div className="hero-note"><span className="rating">★★★★★</span><span>4.9 dari 320+ ulasan tamu</span></div></div><div className="hero-caption">UBUD, BALI <span>·</span> 08°30′S 115°15′E</div></section>
        <section className="intro container"><div><span className="eyebrow">SELAMAT DATANG DI KAMARKU</span><h2>Lebih dari sekadar<br/><em>tempat menginap.</em></h2></div><p>Di sini, hari dimulai dengan udara segar dan berakhir dengan cerita yang ingin dikenang. Nikmati keramahan tulus, ruang yang menenangkan, dan cita rasa lokal.</p></section>
        <section className="quick-grid container">{[{ title: 'Kamar & Suite', text: 'Ruang istirahat pilihan untuk setiap perjalanan.', image: initialRooms[1].image, to: 'kamar' as Tab, number: '01' }, { title: 'Fasilitas', text: 'Temukan cara baru untuk bersantai dan beraktivitas.', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=900&q=80', to: 'fasilitas' as Tab, number: '02' }, { title: 'Rasa & Cerita', text: 'Menu musiman yang diracik dari bahan setempat.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80', to: 'makan' as Tab, number: '03' }].map((card) => <button className="quick-card" key={card.title} onClick={() => setTab(card.to)}><div className="quick-photo" style={{ backgroundImage: `url(${card.image})` }}><span>{card.number}</span><b><HotelIcon name="arrow-up-right" size={18}/></b></div><h3>{card.title}</h3><p>{card.text}</p></button>)}</section>
        <section className="quote-band"><div className="quote-inner"><span className="eyebrow eyebrow-light">MENGAPA KAMARKU</span><h2>“Keramahan yang terasa,<br/><em>kenangan yang tinggal.”</em></h2><div className="benefit-row"><span>01 <b>Ruang yang menenangkan</b></span><span>02 <b>Rasa lokal yang autentik</b></span><span>03 <b>Pelayanan penuh perhatian</b></span></div></div></section>
        <section className="testimonial container"><span className="eyebrow">CERITA DARI TAMU</span><div className="testimonial-copy"><span className="rating">★★★★★</span><blockquote>“Tempatnya terasa personal dan tenang. Sarapannya luar biasa, dan seluruh tim membuat kami merasa seperti keluarga.”</blockquote><p>— Nadia & Arif · Menginap 3 malam</p></div></section>
      </>}
      {tab === 'kamar' && <section className="page-section container"><PageHead eyebrow="ISTIRAHAT DENGAN CARA ANDA" title={<>Kamar & <em>Suite</em></>} text="Pilih ruang yang paling pas untuk perjalanan Anda. Ketersediaan diperbarui berdasarkan tanggal menginap."/><div className="search-panel"><label>Check-in<input type="date" min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)}/></label><label>Check-out<input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)}/></label><label>Tamu<select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{[1,2,3,4,5,6].map((n)=><option key={n} value={n}>{n} tamu</option>)}</select></label><button className="button" onClick={() => { if (checkOut <= checkIn) setNotice('Tanggal check-out harus setelah check-in.'); else setNotice(`Ketersediaan diperbarui untuk ${nights} malam.`); }}>Cari kamar <span>↗</span></button></div><div className="results-caption"><span>{availabilityPending ? 'Memeriksa ketersediaan…' : `${available.filter((r) => r.available > 0 && r.capacity >= guests).length} tipe kamar tersedia`}</span><span>Harga per malam · termasuk sarapan</span></div>{!availabilityPending && <><div className="room-grid">{available.filter((r) => r.capacity >= guests).map((room) => <article className="room-card" key={room.id}><div className="room-image" style={{ backgroundImage: `url(${room.image})` }}><span className={`availability ${room.available <= 2 ? 'few' : ''}`}>{room.available ? `${room.available} kamar tersedia` : 'Penuh'}</span></div><div className="room-info"><div className="room-title"><h3>{room.name}</h3><span>{rupiah(room.price)}<small> / malam</small></span></div><p>{room.description}</p><div className="room-meta"><span className="room-capacity"><HotelIcon name="user" size={14}/> Hingga {room.capacity} tamu</span><span>·</span><span>32 m²</span></div><div className="amenities">{room.amenities.map((a)=><span key={a}>{a}</span>)}</div><button className="button room-book" disabled={!room.available} onClick={() => { setSelectedRoom(room); setGuestName(''); setGuestEmail(''); setNotice(''); }}><span>{room.available ? 'Pesan kamar' : 'Tidak tersedia'}</span><span>↗</span></button></div></article>)}</div>{available.every((r) => !r.available || r.capacity < guests) && <div className="empty-state"><span>⌂</span><h3>Belum ada kamar untuk pilihan ini</h3><p>Coba ubah tanggal atau jumlah tamu untuk melihat pilihan lainnya.</p><button className="button button-outline" onClick={() => { setCheckIn(today()); setCheckOut(tomorrow()); setGuests(2); }}>Ubah pencarian</button></div>}</>}</section>}
      {tab === 'fasilitas' && <section className="page-section container"><PageHead eyebrow="RUANG UNTUK MENIKMATI WAKTU" title={<>Fasilitas <em>kami</em></>} text="Setiap sudut dirancang agar Anda dapat beristirahat, menjelajah, dan merasa lebih baik."/><div className="filters">{['Semua', ...Array.from(new Set(facilityItems.map((f)=>f.category)))].map((name)=><button key={name} className={category===name?'selected':''} onClick={()=>setCategory(name)}>{name}</button>)}</div><div className="facility-grid">{visibleFacilities.map((item)=><article className="facility-card" key={item.name}><div className="facility-image" style={{ backgroundImage: `url(${item.image.startsWith('http') ? item.image : `https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=900&q=80`})` }}/><span className="category-chip">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p></article>)}</div></section>}
      {tab === 'makan' && <section className="page-section container"><PageHead eyebrow="DARI DAPUR KAMARKU" title={<>Rasa yang <em>dirayakan.</em></>} text="Menu berganti mengikuti musim dan hasil terbaik dari kebun sekitar. Selalu ada sesuatu yang baru di meja."/><div className="meal-date"><label>Pilih tanggal menu <input type="date" value={mealDate} onChange={(e)=>setMealDate(e.target.value)}/></label><span>Menu untuk {new Intl.DateTimeFormat('id-ID',{dateStyle:'full'}).format(new Date(`${mealDate}T12:00:00`))}</span></div><div className="meal-grid">{mealItems.map((meal)=><article className="meal-card" key={meal.type}><div className="meal-head"><span className="meal-icon"><HotelIcon name={meal.type.toLowerCase().includes("malam") ? "moon" : "sun"} size={21}/></span><div><span className="eyebrow">{meal.type.toUpperCase()}</span><h3>{meal.time || 'Waktu akan diumumkan'}</h3></div></div><div className="meal-rule"/><p className="eyebrow">MENU PILIHAN HARI INI</p><ul>{meal.dishes.map((dish)=><li key={dish}>{dish}</li>)}</ul></article>)}</div><div className="info-note"><span><HotelIcon name="sparkles" size={18}/></span><p>Memiliki alergi atau kebutuhan khusus? Hubungi tim kami sebelum kedatangan, kami senang membantu.</p></div></section>}
      {tab === 'tentang' && <section className="page-section container"><PageHead eyebrow="CERITA KAMARKU" title={<>Tempat untuk <em>kembali.</em></>} text="Berawal dari rumah keluarga di tepi sawah Ubud, KamarKu tumbuh dengan satu keyakinan: perjalanan terbaik membuat kita merasa lebih dekat dengan diri sendiri."/><div className="about-image"/><div className="about-columns"><div><span className="eyebrow">AKAR KAMI</span><h2>Hospitalitas yang<br/><em>datang dari hati.</em></h2></div><div><p>Sejak 2012, kami menyambut para pelancong dengan cara hidup Bali yang sederhana. Arsitektur kami menghormati alam sekitar; hidangan kami bercerita tentang petani dan perajin setempat.</p><p>Hari ini, kami tetap menjaga hal yang sama: perhatian kecil, senyum tulus, dan ruang untuk melambat.</p></div></div><div className="stats-row"><div><strong>28</strong><span>Kamar & suite</span></div><div><strong>2012</strong><span>Tahun kami memulai</span></div><div><strong>4.9<small>/5</small></strong><span>Rata-rata ulasan tamu</span></div><div><strong>12</strong><span>Tahun keramahan</span></div></div><details className="policy"><summary>Kebijakan menginap</summary><p>Check-in mulai pukul 14.00 dan check-out pukul 12.00. Anak-anak disambut dengan hangat. Demi kenyamanan semua tamu, hewan peliharaan belum dapat kami terima.</p></details></section>}
      {tab === 'kontak' && <section className="page-section container"><PageHead eyebrow="KAMI SIAP MENYAMBUT ANDA" title={<>Sampai jumpa <em>di sini.</em></>} text="Butuh bantuan merencanakan perjalanan? Tim kami dengan senang hati membantu."/><div className="contact-layout"><div className="map-card"><iframe title="Peta lokasi KamarKu Ubud" src="https://maps.google.com/maps?q=Ubud%2C%20Bali&t=&z=13&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><a className="map-link" href="https://maps.google.com/?q=Ubud+Bali" target="_blank" rel="noreferrer">Buka di Google Maps ↗</a></div><div className="contact-info"><span className="eyebrow">KUNJUNGI KAMI</span><h3>KamarKu Hotel & Retreat</h3><p>Jl. Raya Sanggingan, Ubud<br/>Gianyar, Bali 80571, Indonesia</p><a href="tel:+623619751234">+62 361 975 1234</a><a href="mailto:hello@kamarku.id">hello@kamarku.id</a><div className="contact-hours"><span>Front office</span><b>Setiap hari · 07.00–22.00</b></div></div></div><div className="lookup" id="booking-lookup"><div><span className="eyebrow">SUDAH MEMESAN?</span><h2>Cek status <em>booking.</em></h2><p>Masukkan kode booking untuk melihat status dan mengajukan pembatalan.</p></div><form onSubmit={async (e)=>{e.preventDefault();try{const response=await fetch(`/api/bookings/${encodeURIComponent(lookup.trim())}`);const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(`/booking/result?code=${encodeURIComponent(data.booking.code)}`);}catch(error){setNotice(error instanceof Error?error.message:'Status booking gagal dimuat.');}}}><label htmlFor="lookup-code">Kode booking</label><div className="lookup-control"><input id="lookup-code" value={lookup} onChange={(e)=>setLookup(e.target.value)} placeholder="Contoh: KK12345678"/><button className="button">Cek status ↗</button></div></form></div></section>}
      {admin && <section className="admin-panel container"><div className="admin-head"><div><span className="eyebrow">AREA PENGELOLA</span><h2>Dashboard <em>KamarKu</em></h2></div><button className="button button-outline" onClick={signOut}>Keluar admin</button></div><div className="stats-row"><div><strong>{rooms.length}</strong><span>Tipe kamar</span></div><div><strong>{rooms.reduce((sum,r)=>sum+r.stock,0)}</strong><span>Total kamar</span></div><div><strong>{bookings.filter((b)=>b.checkIn===today()&&b.status!=='cancelled').length}</strong><span>Check-in hari ini</span></div><div><strong>{bookings.filter((b)=>b.status==='pending').length}</strong><span>Perlu konfirmasi</span></div></div><form className="admin-add" onSubmit={addRoom}><label htmlFor="new-room">Tambah tipe kamar</label><input id="new-room" value={newRoomName} onChange={(e)=>setNewRoomName(e.target.value)} placeholder="Nama tipe kamar"/><button className="button">Tambah</button></form><section className="admin-manage"><h3>Kelola fasilitas</h3><form className="admin-add" onSubmit={addFacility}><label>Nama fasilitas<input required value={newFacilityName} onChange={(e)=>setNewFacilityName(e.target.value)} placeholder="Contoh: Spa Purnama"/></label><label>Kategori<select value={newFacilityCategory} onChange={(e)=>setNewFacilityCategory(e.target.value)}>{['Relaksasi','Kuliner','Kebugaran','Bisnis','Aktivitas','Lainnya'].map((item)=><option key={item}>{item}</option>)}</select></label><button className="button">Tambah</button></form>{facilityItems.map((item)=><div className="admin-simple-row" key={item.id ?? item.name}><span>{item.name} · {item.category}</span><button disabled={!item.id} onClick={()=>item.id && deleteFacility(item.id)}>Hapus</button></div>)}</section><section className="admin-manage"><h3>Kelola menu untuk {mealDate}</h3><form className="admin-add" onSubmit={addMenu}><label>Jadwal<select value={newMenuSchedule} onChange={(e)=>setNewMenuSchedule(Number(e.target.value))}><option value={1}>Sarapan</option><option value={2}>Makan siang</option><option value={3}>Makan malam</option></select></label><label>Nama hidangan<input required value={newMenuName} onChange={(e)=>setNewMenuName(e.target.value)} placeholder="Nama menu"/></label><label>Kategori<select value={newMenuCategory} onChange={(e)=>setNewMenuCategory(e.target.value as typeof newMenuCategory)}><option value="main">Utama</option><option value="side">Pendamping</option><option value="dessert">Penutup</option><option value="drink">Minuman</option></select></label><button className="button">Tambah</button></form>{mealItems.map((meal,index)=><div className="admin-simple-row" key={meal.type}><span>{meal.type} · {meal.dishes.join(', ')}</span><div className="booking-actions">{meal.dishes.filter((dish)=>dish!=='Menu akan diumumkan').map((dish)=><button key={dish} onClick={()=>deleteMenu(dish,index+1)}>Hapus {dish}</button>)}</div></div>)}</section><div className="admin-table"><h3>Daftar booking</h3>{bookings.length===0?<p>Belum ada booking.</p>:bookings.map((booking)=><div className="booking-row" key={booking.code}><div><b>{booking.name}</b><span>{booking.code} · {rooms.find((r)=>r.id===booking.roomId)?.name ?? 'Kamar'} · {booking.checkIn} — {booking.checkOut}</span></div><span className={`status-pill status-${booking.status}`}>{statusLabel[booking.status]}</span><div className="booking-actions">{booking.status==='pending'&&<button onClick={()=>updateStatus(booking.code,'confirmed')}>Konfirmasi</button>}{booking.status!=='cancelled'&&booking.status!=='completed'&&<button onClick={()=>updateStatus(booking.code,'cancelled')}>Batalkan</button>}{booking.status==='confirmed'&&<button onClick={()=>updateStatus(booking.code,'completed')}>Selesaikan</button>}</div></div>)}</div></section>}
      {admin && <section className="admin-schedules container"><h3>Atur jam makan</h3>{schedules.map((schedule) => <form className="schedule-row" key={schedule.id} onSubmit={(event) => updateSchedule(event, schedule)}><b>{schedule.mealType === 'BREAKFAST' ? 'Sarapan' : schedule.mealType === 'LUNCH' ? 'Makan siang' : 'Makan malam'}</b><label>Mulai<input name="startTime" type="time" value={schedule.startTime} onChange={(event) => setSchedules((all) => all.map((item) => item.id === schedule.id ? { ...item, startTime: event.target.value } : item))}/></label><label>Selesai<input name="endTime" type="time" value={schedule.endTime} onChange={(event) => setSchedules((all) => all.map((item) => item.id === schedule.id ? { ...item, endTime: event.target.value } : item))}/></label><button className="button">Simpan</button></form>)}</section>}
      {admin && <section className="room-editor container"><h3>Kelola tipe kamar</h3>{rooms.map((room) => <form className="room-editor-row" key={room.id} onSubmit={(event) => saveRoom(event, room)}><label>Nama<input value={room.name} onChange={(event) => setRooms((all) => all.map((item) => item.id === room.id ? { ...item, name: event.target.value } : item))}/></label><label>Harga / malam<input type="number" min="0" step="10000" value={room.price} onChange={(event) => setRooms((all) => all.map((item) => item.id === room.id ? { ...item, price: Number(event.target.value) } : item))}/></label><label>Kapasitas<input type="number" min="1" max="12" value={room.capacity} onChange={(event) => setRooms((all) => all.map((item) => item.id === room.id ? { ...item, capacity: Number(event.target.value) } : item))}/></label><label>Stok kamar<input type="number" min="0" value={room.stock} onChange={(event) => setRooms((all) => all.map((item) => item.id === room.id ? { ...item, stock: Number(event.target.value) } : item))}/></label><label className="room-description">Deskripsi<input value={room.description} onChange={(event) => setRooms((all) => all.map((item) => item.id === room.id ? { ...item, description: event.target.value } : item))}/></label><div className="booking-actions"><button className="button">Simpan</button><button type="button" onClick={() => deleteRoom(room.id)}>Hapus</button></div></form>)}</section>}
      {admin && <section className="facility-editor container"><h3>Edit detail fasilitas</h3>{facilityItems.map((facility) => <form className="facility-editor-row" key={facility.id ?? facility.name} onSubmit={(event) => saveFacility(event, facility)}><label>Nama<input value={facility.name} onChange={(event) => setFacilityItems((all) => all.map((item) => item.id === facility.id ? { ...item, name: event.target.value } : item))}/></label><label>Kategori<input value={facility.category} onChange={(event) => setFacilityItems((all) => all.map((item) => item.id === facility.id ? { ...item, category: event.target.value } : item))}/></label><label>Deskripsi<input value={facility.description} onChange={(event) => setFacilityItems((all) => all.map((item) => item.id === facility.id ? { ...item, description: event.target.value } : item))}/></label><label>URL foto<input type="url" value={facility.image} onChange={(event) => setFacilityItems((all) => all.map((item) => item.id === facility.id ? { ...item, image: event.target.value } : item))}/></label><button className="button" disabled={!facility.id}>Simpan fasilitas</button></form>)}</section>}
    </main>
    <footer className="footer"><div className="footer-main container"><div><a className="brand brand-footer" href="#beranda" onClick={()=>setTab('beranda')}><span className="brand-mark">K</span><span>Kamar<span className="brand-light">Ku</span><small>HOTEL & RETREAT</small></span></a><p>Sebuah jeda yang berarti,<br/>di tengah hangatnya alam Ubud.</p></div><div><span className="eyebrow eyebrow-light">JELAJAHI</span>{tabs.slice(1).map((item)=><button key={item.id} onClick={()=>setTab(item.id)}>{item.label}</button>)}</div><div><span className="eyebrow eyebrow-light">HUBUNGI KAMI</span><p>Ubud, Bali, Indonesia</p><a href="tel:+623619751234">+62 361 975 1234</a><a href="mailto:hello@kamarku.id">hello@kamarku.id</a></div></div><div className="footer-bottom container"><span>© {new Date().getFullYear()} KamarKu Hotel & Retreat</span><span>Dibuat dengan keramahan di Ubud, Bali</span><a href="/admin/login">Masuk admin</a></div></footer>
    {selectedRoom && <div className="modal-backdrop" role="presentation" onClick={(e)=>{if(e.target===e.currentTarget)setSelectedRoom(null);}}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="book-title"><button className="modal-close" aria-label="Tutup" onClick={()=>setSelectedRoom(null)}>×</button><span className="eyebrow">PEMESANAN & PEMBAYARAN</span><h2 id="book-title">Satu langkah menuju <em>istirahat.</em></h2><div className="booking-summary"><b>{selectedRoom.name}</b><span>{checkIn} — {checkOut} · {nights} malam</span><strong>{rupiah(selectedRoom.price * nights)}</strong><small>Bayar penuh melalui Midtrans untuk mengonfirmasi booking. Pembatalan tersedia sampai 2 jam sebelum check-in pukul 14.00 WITA.</small></div><form onSubmit={submitBooking} className="booking-form"><label>Nama lengkap<input required autoComplete="name" value={guestName} onChange={(e)=>setGuestName(e.target.value)} placeholder="Nama sesuai identitas"/></label><label>Email<input required type="email" autoComplete="email" value={guestEmail} onChange={(e)=>setGuestEmail(e.target.value)} placeholder="nama@email.com"/></label><label>Jumlah tamu<select value={guests} onChange={(e)=>setGuests(Number(e.target.value))}>{Array.from({length:selectedRoom.capacity},(_,i)=>i+1).map((n)=><option key={n} value={n}>{n} tamu</option>)}</select></label><label>Nomor KTP<input required inputMode="numeric" pattern="[0-9]{16}" maxLength={16} value={identityNumber} onChange={(e)=>setIdentityNumber(e.target.value.replace(/\D/g,''))} placeholder="16 digit nomor KTP"/></label><label>Foto KTP<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>setIdentityPhoto(e.target.files?.[0]??null)}/><small>JPG, PNG, atau WebP · maksimal 5 MB</small></label><label className="privacy-consent"><input type="checkbox" checked={identityConsent} onChange={(e)=>setIdentityConsent(e.target.checked)}/>Saya setuju data KTP digunakan untuk verifikasi identitas dan administrasi booking. Nomor dan foto dienkripsi dan dihapus 30 hari setelah check-out atau pembatalan.</label><button className="button">Bayar dengan Midtrans ↗</button><small>Booking baru dikonfirmasi setelah pembayaran terverifikasi.</small></form></section></div>}
    {adminLogin && <div className="modal-backdrop" role="presentation" onClick={(e)=>{if(e.target===e.currentTarget)setAdminLogin(false);}}><section className="booking-modal login-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title"><button className="modal-close" aria-label="Tutup" onClick={()=>setAdminLogin(false)}>×</button><span className="eyebrow">PENGELOLA HOTEL</span><h2 id="admin-title">Masuk ke <em>dashboard.</em></h2><form onSubmit={signIn} className="booking-form"><label>Email<input required name="email" type="email" placeholder="admin@kamarku.id"/></label><label>Password<input required name="password" type="password" placeholder="••••••••"/></label><button className="button">Masuk</button></form></section></div>}
  </>;
}

function PageHead({ eyebrow, title, text }: { eyebrow: string; title: React.ReactNode; text: string }) { return <div className="page-head"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p><div className="heading-rule"/></div>; }
