'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HotelIcon, type HotelIconName } from '@/components/hotel-icon';
type Room = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  stock: number;
  image: string;
  amenities: string[];
};
type Facility = { id: string; name: string; category: string; description: string; image: string };
type Booking = {
  code: string;
  name: string;
  email: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: string;
  refundStatus: string | null;
  identityProvided: boolean;
};
type Schedule = {
  id: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  startTime: string;
  endTime: string;
};
type Menu = { id: string; scheduleId: number; date: string; dishName: string; category: string };
type Section = 'overview' | 'bookings' | 'rooms' | 'facilities' | 'meals';
const currency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
const mealNames: Record<Schedule['mealType'], string> = {
  BREAKFAST: 'Sarapan',
  LUNCH: 'Makan siang',
  DINNER: 'Makan malam',
};
const bookingNames: Record<Booking['status'], string> = {
  pending: 'Menunggu',
  confirmed: 'Terkonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};
export default function AdminConsole() {
  const [section, setSection] = useState<Section>('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [identities, setIdentities] = useState<
    Record<string, { identityNumber: string; photoDataUrl: string }>
  >({});
  const [menuDate, setMenuDate] = useState(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }),
  );
  const [message, setMessage] = useState('');
  const [newRoom, setNewRoom] = useState({ name: '', price: 780000, capacity: 2, stock: 5 });
  const [newFacility, setNewFacility] = useState({
    name: '',
    category: 'Relaksasi',
    description: '',
    image: '',
  });
  const [newMenu, setNewMenu] = useState({ scheduleId: 1, dishName: '', category: 'main' });
  const router = useRouter();
  async function json(url: string, init?: RequestInit) {
    const response = await fetch(url, { cache: 'no-store', ...init });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Permintaan gagal.');
    return data;
  }
  async function refreshAll() {
    try {
      const [r, f, b, m] = await Promise.all([
        json('/api/admin/rooms'),
        json('/api/admin/facilities'),
        json('/api/admin/bookings'),
        json(`/api/admin/meals?date=${menuDate}`),
      ]);
      setRooms(r.rooms);
      setFacilities(f.facilities);
      setBookings(b.bookings);
      setSchedules(m.schedules);
      setMenus(m.menus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Data dashboard gagal dimuat.');
    }
  }
  useEffect(() => {
    void refreshAll();
  }, [menuDate]);
  async function logout() {
    setIdentities({});
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
  }
  async function loadIdentity(code: string) {
    if (identities[code]) {
      setIdentities((all) => {
        const next = { ...all };
        delete next[code];
        return next;
      });
      return;
    }
    try {
      const data = await json(`/api/admin/bookings/${encodeURIComponent(code)}/identity`);
      setIdentities((all) => ({ ...all, [code]: data }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Data identitas gagal dimuat.');
    }
  }
  async function setBookingStatus(
    booking: Booking,
    status: 'confirmed' | 'cancelled' | 'completed',
  ) {
    try {
      await json(`/api/admin/bookings?code=${encodeURIComponent(booking.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await refreshAll();
      setMessage(`Status ${booking.code} diperbarui.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Status booking gagal diubah.');
    }
  }
  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await json('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      setNewRoom({ name: '', price: 780000, capacity: 2, stock: 5 });
      await refreshAll();
      setMessage('Tipe kamar ditambahkan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kamar gagal ditambahkan.');
    }
  }
  async function saveRoom(event: FormEvent<HTMLFormElement>, room: Room) {
    event.preventDefault();
    try {
      await json(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      });
      setMessage(`Perubahan ${room.name} disimpan.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Perubahan kamar gagal disimpan.');
    }
  }
  async function deleteRoom(id: string) {
    try {
      await json(`/api/admin/rooms/${id}`, { method: 'DELETE' });
      await refreshAll();
      setMessage('Tipe kamar dihapus.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kamar gagal dihapus.');
    }
  }
  async function createFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await json('/api/admin/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFacility),
      });
      setNewFacility({ name: '', category: 'Relaksasi', description: '', image: '' });
      await refreshAll();
      setMessage('Fasilitas ditambahkan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fasilitas gagal ditambahkan.');
    }
  }
  async function saveFacility(event: FormEvent<HTMLFormElement>, facility: Facility) {
    event.preventDefault();
    try {
      await json(`/api/admin/facilities/${facility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facility),
      });
      setMessage(`Perubahan ${facility.name} disimpan.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fasilitas gagal diperbarui.');
    }
  }
  async function deleteFacility(id: string) {
    try {
      await json(`/api/admin/facilities/${id}`, { method: 'DELETE' });
      await refreshAll();
      setMessage('Fasilitas dihapus.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fasilitas gagal dihapus.');
    }
  }
  async function createMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await json('/api/admin/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMenu, date: menuDate }),
      });
      setNewMenu({ ...newMenu, dishName: '' });
      await refreshAll();
      setMessage('Menu ditambahkan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Menu gagal ditambahkan.');
    }
  }
  async function deleteMenu(id: string) {
    try {
      await json(`/api/admin/meals?id=${id}`, { method: 'DELETE' });
      await refreshAll();
      setMessage('Menu dihapus.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Menu gagal dihapus.');
    }
  }
  async function saveSchedule(event: FormEvent<HTMLFormElement>, schedule: Schedule) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      await json('/api/admin/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: schedule.mealType,
          startTime: values.get('startTime'),
          endTime: values.get('endTime'),
        }),
      });
      await refreshAll();
      setMessage('Jam makan diperbarui.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Jadwal gagal diperbarui.');
    }
  }
  const nav: { id: Section; label: string; icon: HotelIconName }[] = [
    { id: 'overview', label: 'Ringkasan', icon: 'chart' },
    { id: 'bookings', label: 'Pemesanan', icon: 'clipboard' },
    { id: 'rooms', label: 'Tipe kamar', icon: 'bed' },
    { id: 'facilities', label: 'Fasilitas', icon: 'sparkles' },
    { id: 'meals', label: 'Jam makan & menu', icon: 'utensils' },
  ];
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-sidebar-brand">
          <span>K</span>
          <div>
            KamarKu<small>ADMIN CONSOLE</small>
          </div>
        </a>
        <div className="admin-sidebar-label">MENU PENGELOLA</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? 'selected' : ''}
              onClick={() => setSection(item.id)}
            >
              <HotelIcon className="admin-nav-icon" name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <HotelIcon name="arrow-up-right" size={15} /> Lihat website tamu
          </a>
          <button onClick={logout}><HotelIcon name="door" size={15} /> Keluar</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>OPERASIONAL /</span> {nav.find((item) => item.id === section)?.label}
          </div>
          <span className="admin-user">
            <i /> Admin KamarKu
          </span>
        </header>
        <div className="admin-content">
          {message && (
            <div className="admin-message" role="status">
              <span>{message}</span>
              <button onClick={() => setMessage('')}>×</button>
            </div>
          )}{' '}
          {section === 'overview' && (
            <>
              <div className="admin-page-title">
                <div>
                  <span>DASHBOARD</span>
                  <h1>Ringkasan operasional</h1>
                  <p>Pantau aktivitas pemesanan dan properti KamarKu.</p>
                </div>
                <button className="admin-refresh" onClick={() => void refreshAll()}>
                  ↻ Perbarui
                </button>
              </div>
              <div className="admin-stat-grid">
                <article>
                  <span>Booking hari ini</span>
                  <strong>
                    {
                      bookings.filter(
                        (b) =>
                          b.checkIn ===
                          new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }),
                      ).length
                    }
                  </strong>
                  <small>check-in</small>
                </article>
                <article>
                  <span>Menunggu konfirmasi</span>
                  <strong>{bookings.filter((b) => b.status === 'pending').length}</strong>
                  <small>booking</small>
                </article>
                <article>
                  <span>Tipe kamar</span>
                  <strong>{rooms.length}</strong>
                  <small>{rooms.reduce((sum, room) => sum + room.stock, 0)} unit total</small>
                </article>
                <article>
                  <span>Fasilitas</span>
                  <strong>{facilities.length}</strong>
                  <small>terdaftar</small>
                </article>
              </div>
              <section className="admin-panel-card">
                <div className="admin-panel-heading">
                  <div>
                    <span>TERBARU</span>
                    <h2>Pemesanan terkini</h2>
                  </div>
                  <button onClick={() => setSection('bookings')}>Lihat semua →</button>
                </div>
                <BookingTable
                  bookings={bookings.slice(0, 6)}
                  onStatus={setBookingStatus}
                  identities={identities}
                  onIdentity={loadIdentity}
                />
              </section>
            </>
          )}{' '}
          {section === 'bookings' && (
            <>
              <div className="admin-page-title">
                <div>
                  <span>RESERVASI</span>
                  <h1>Kelola pemesanan</h1>
                  <p>Konfirmasi, batalkan, atau selesaikan booking tamu.</p>
                </div>
                <button className="admin-refresh" onClick={() => void refreshAll()}>
                  ↻ Perbarui
                </button>
              </div>
              <section className="admin-panel-card">
                <BookingTable
                  bookings={bookings}
                  onStatus={setBookingStatus}
                  identities={identities}
                  onIdentity={loadIdentity}
                />
              </section>
            </>
          )}{' '}
          {section === 'rooms' && (
            <>
              <div className="admin-page-title">
                <div>
                  <span>INVENTARIS</span>
                  <h1>Tipe kamar</h1>
                  <p>Atur nama, harga, kapasitas, dan ketersediaan kamar.</p>
                </div>
              </div>
              <section className="admin-panel-card">
                <h2>Tambah tipe kamar</h2>
                <form className="admin-form-grid" onSubmit={createRoom}>
                  <label>
                    Nama tipe
                    <input
                      required
                      minLength={2}
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Harga per malam
                    <input
                      type="number"
                      min="0"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom({ ...newRoom, price: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Kapasitas tamu
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Stok unit
                    <input
                      type="number"
                      min="0"
                      value={newRoom.stock}
                      onChange={(e) => setNewRoom({ ...newRoom, stock: Number(e.target.value) })}
                    />
                  </label>
                  <button className="admin-primary">Tambah tipe kamar</button>
                </form>
              </section>
              {rooms.map((room) => (
                <section className="admin-panel-card" key={room.id}>
                  <form className="admin-form-grid" onSubmit={(e) => saveRoom(e, room)}>
                    <label>
                      Nama
                      <input
                        value={room.name}
                        onChange={(e) =>
                          setRooms((all) =>
                            all.map((x) => (x.id === room.id ? { ...x, name: e.target.value } : x)),
                          )
                        }
                      />
                    </label>
                    <label>
                      Harga per malam
                      <input
                        type="number"
                        min="0"
                        value={room.price}
                        onChange={(e) =>
                          setRooms((all) =>
                            all.map((x) =>
                              x.id === room.id ? { ...x, price: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Kapasitas
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={room.capacity}
                        onChange={(e) =>
                          setRooms((all) =>
                            all.map((x) =>
                              x.id === room.id ? { ...x, capacity: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Stok
                      <input
                        type="number"
                        min="0"
                        value={room.stock}
                        onChange={(e) =>
                          setRooms((all) =>
                            all.map((x) =>
                              x.id === room.id ? { ...x, stock: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="admin-wide">
                      Deskripsi
                      <input
                        value={room.description}
                        onChange={(e) =>
                          setRooms((all) =>
                            all.map((x) =>
                              x.id === room.id ? { ...x, description: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button className="admin-primary">Simpan {room.name}</button>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => void deleteRoom(room.id)}
                    >
                      Hapus tipe
                    </button>
                  </form>
                </section>
              ))}
            </>
          )}{' '}
          {section === 'facilities' && (
            <>
              <div className="admin-page-title">
                <div>
                  <span>PROPERTI</span>
                  <h1>Kelola fasilitas</h1>
                  <p>Perbarui informasi yang ditampilkan kepada tamu.</p>
                </div>
              </div>
              <section className="admin-panel-card">
                <h2>Tambah fasilitas</h2>
                <form className="admin-form-grid" onSubmit={createFacility}>
                  <label>
                    Nama
                    <input
                      required
                      value={newFacility.name}
                      onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Kategori
                    <input
                      required
                      value={newFacility.category}
                      onChange={(e) => setNewFacility({ ...newFacility, category: e.target.value })}
                    />
                  </label>
                  <label>
                    Deskripsi
                    <input
                      required
                      value={newFacility.description}
                      onChange={(e) =>
                        setNewFacility({ ...newFacility, description: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    URL gambar
                    <input
                      required
                      type="url"
                      value={newFacility.image}
                      onChange={(e) => setNewFacility({ ...newFacility, image: e.target.value })}
                    />
                  </label>
                  <button className="admin-primary">Tambah fasilitas</button>
                </form>
              </section>
              {facilities.map((facility) => (
                <section className="admin-panel-card" key={facility.id}>
                  <form className="admin-form-grid" onSubmit={(e) => saveFacility(e, facility)}>
                    <label>
                      Nama
                      <input
                        value={facility.name}
                        onChange={(e) =>
                          setFacilities((all) =>
                            all.map((x) =>
                              x.id === facility.id ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Kategori
                      <input
                        value={facility.category}
                        onChange={(e) =>
                          setFacilities((all) =>
                            all.map((x) =>
                              x.id === facility.id ? { ...x, category: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Deskripsi
                      <input
                        value={facility.description}
                        onChange={(e) =>
                          setFacilities((all) =>
                            all.map((x) =>
                              x.id === facility.id ? { ...x, description: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      URL gambar
                      <input
                        type="url"
                        value={facility.image}
                        onChange={(e) =>
                          setFacilities((all) =>
                            all.map((x) =>
                              x.id === facility.id ? { ...x, image: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button className="admin-primary">Simpan</button>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => void deleteFacility(facility.id)}
                    >
                      Hapus
                    </button>
                  </form>
                </section>
              ))}
            </>
          )}{' '}
          {section === 'meals' && (
            <>
              <div className="admin-page-title">
                <div>
                  <span>LAYANAN TAMU</span>
                  <h1>Jam makan & menu</h1>
                  <p>Atur jadwal dan menu harian yang tersedia untuk tamu.</p>
                </div>
                <label className="admin-date">
                  Tanggal
                  <input
                    type="date"
                    value={menuDate}
                    onChange={(e) => setMenuDate(e.target.value)}
                  />
                </label>
              </div>
              <div className="admin-schedule-grid">
                {schedules.map((schedule) => (
                  <section className="admin-panel-card" key={schedule.id}>
                    <h2>{mealNames[schedule.mealType]}</h2>
                    <form
                      className="admin-time-form"
                      onSubmit={(e) => void saveSchedule(e, schedule)}
                    >
                      <label>
                        Mulai
                        <input name="startTime" type="time" defaultValue={schedule.startTime} />
                      </label>
                      <label>
                        Selesai
                        <input name="endTime" type="time" defaultValue={schedule.endTime} />
                      </label>
                      <button className="admin-secondary">Simpan jam</button>
                    </form>
                  </section>
                ))}
              </div>
              <section className="admin-panel-card">
                <h2>Tambah menu harian</h2>
                <form className="admin-form-grid" onSubmit={createMenu}>
                  <label>
                    Jadwal
                    <select
                      value={newMenu.scheduleId}
                      onChange={(e) =>
                        setNewMenu({ ...newMenu, scheduleId: Number(e.target.value) })
                      }
                    >
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {mealNames[s.mealType]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nama hidangan
                    <input
                      required
                      value={newMenu.dishName}
                      onChange={(e) => setNewMenu({ ...newMenu, dishName: e.target.value })}
                    />
                  </label>
                  <label>
                    Kategori
                    <select
                      value={newMenu.category}
                      onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}
                    >
                      <option value="main">Utama</option>
                      <option value="side">Pendamping</option>
                      <option value="dessert">Penutup</option>
                      <option value="drink">Minuman</option>
                    </select>
                  </label>
                  <button className="admin-primary">Tambah menu</button>
                </form>
                {menus.map((menu) => (
                  <div className="admin-list-row" key={menu.id}>
                    <span>
                      {
                        mealNames[
                          schedules.find((s) => s.id === menu.scheduleId)?.mealType ?? 'BREAKFAST'
                        ]
                      }{' '}
                      · {menu.dishName}
                    </span>
                    <button className="admin-danger" onClick={() => void deleteMenu(menu.id)}>
                      Hapus
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}{' '}
        </div>
      </main>
    </div>
  );
}
function BookingTable({
  bookings,
  onStatus,
  identities,
  onIdentity,
}: {
  bookings: Booking[];
  onStatus: (booking: Booking, status: 'confirmed' | 'cancelled' | 'completed') => void;
  identities: Record<string, { identityNumber: string; photoDataUrl: string }>;
  onIdentity: (code: string) => void;
}) {
  return (
    <div className="admin-booking-list">
      {bookings.length === 0 ? (
        <p className="admin-empty">Belum ada pemesanan.</p>
      ) : (
        bookings.map((booking) => (
          <article className="admin-booking-row" key={booking.code}>
            <div>
              <strong>{booking.name}</strong>
              <small>
                {booking.code} · {booking.roomName} · {booking.checkIn} – {booking.checkOut}
              </small>
              <small>
                {booking.email} · {booking.guests} tamu · {currency(booking.total)}
              </small>
              <small>
                Pembayaran: {booking.paymentStatus}
                {booking.refundStatus ? ` · Refund: ${booking.refundStatus}` : ''} · KTP{' '}
                {booking.identityProvided ? 'tersimpan terenkripsi' : 'sudah tidak tersedia'}
              </small>
              {booking.identityProvided && (
                <button className="admin-secondary" onClick={() => void onIdentity(booking.code)}>
                  {identities[booking.code] ? 'Sembunyikan KTP' : 'Lihat data KTP'}
                </button>
              )}
              {identities[booking.code] && (
                <div className="admin-identity">
                  <strong>Nomor KTP: {identities[booking.code].identityNumber}</strong>
                  <img
                    src={identities[booking.code].photoDataUrl}
                    alt={`Foto KTP booking ${booking.code}`}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <span className={`admin-status admin-status-${booking.status}`}>
              {bookingNames[booking.status]}
            </span>
            <div className="admin-row-actions">
              {booking.status === 'pending' && booking.paymentStatus === 'paid' && (
                <button onClick={() => onStatus(booking, 'confirmed')}>Konfirmasi</button>
              )}
              {['pending', 'confirmed'].includes(booking.status) && (
                <button onClick={() => onStatus(booking, 'cancelled')}>Batalkan</button>
              )}
              {booking.status === 'confirmed' &&
                booking.checkOut <=
                  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }) && (
                  <button onClick={() => onStatus(booking, 'completed')}>Selesaikan</button>
                )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
