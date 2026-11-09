import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hotelToday } from '@/lib/date';

declare global {
  // eslint-disable-next-line no-var
  var kamarkuDatabase: DatabaseSync | undefined;
}

const starterRooms = [
  ['garden', 'Garden Room', 'Kamar nyaman dengan balkon pribadi menghadap taman tropis.', 780000, 2, 5, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85', 'King bed,Balkon,Wi-Fi,Sarapan'],
  ['deluxe', 'Deluxe Retreat', 'Ruang lega dengan interior kayu hangat dan area duduk santai.', 1120000, 2, 4, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85', 'King bed,Bathtub,Wi-Fi,Sarapan'],
  ['family', 'Family Suite', 'Ruang luas untuk keluarga, lengkap dengan ruang keluarga terpisah.', 1680000, 4, 3, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85', '2 kamar,Ruang keluarga,Wi-Fi,Sarapan'],
] as const;
const starterFacilities = [
  ['Kolam Renang Tropis', 'Relaksasi', 'Kolam renang outdoor dikelilingi taman rimbun, buka setiap hari pukul 07.00–20.00.', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=900&q=80'],
  ['Restoran Senja', 'Kuliner', 'Sajian Nusantara dan hidangan musiman dengan bahan segar dari petani lokal.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80'],
  ['Ruang Kebugaran', 'Kebugaran', 'Peralatan kardio dan beban untuk menjaga rutinitas Anda selama menginap.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80'],
  ['Spa Purnama', 'Relaksasi', 'Perawatan tradisional yang menenangkan dengan bahan alami pilihan.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'],
  ['Ruang Pertemuan', 'Bisnis', 'Ruang fleksibel dengan fasilitas presentasi dan dukungan tim kami.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'],
  ['Taman Rasa', 'Aktivitas', 'Kebun herbal kecil yang dapat dijelajahi bersama keluarga.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80'],
] as const;
const starterMenus = [
  ['BREAKFAST', 'Nasi goreng kampung', 'main'], ['BREAKFAST', 'Telur pilihan', 'side'], ['BREAKFAST', 'Buah potong', 'dessert'], ['BREAKFAST', 'Kopi & teh', 'drink'],
  ['LUNCH', 'Ikan bakar sambal matah', 'main'], ['LUNCH', 'Sayur urap', 'side'], ['LUNCH', 'Sup bening', 'side'], ['LUNCH', 'Es teh serai', 'drink'],
  ['DINNER', 'Ayam panggang madu', 'main'], ['DINNER', 'Tumis sayuran', 'side'], ['DINNER', 'Nasi pandan', 'side'], ['DINNER', 'Puding kelapa', 'dessert'],
] as const;

export function getDb() {
  if (globalThis.kamarkuDatabase) return globalThis.kamarkuDatabase;
  const filename = process.env.DATABASE_PATH || path.join(process.cwd(), 'prisma', 'dev.db');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK(price >= 0), capacity INTEGER NOT NULL CHECK(capacity > 0),
      stock INTEGER NOT NULL CHECK(stock >= 0), image TEXT NOT NULL, amenities TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      code TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
      room_id TEXT NOT NULL REFERENCES rooms(id), check_in TEXT NOT NULL, check_out TEXT NOT NULL,
      guests INTEGER NOT NULL CHECK(guests > 0), total INTEGER NOT NULL CHECK(total >= 0),
      status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled','completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      identity_number_encrypted TEXT,
      identity_photo_encrypted TEXT,
      identity_photo_mime TEXT,
      identity_consent_at TEXT,
      identity_delete_at TEXT,
      payment_status TEXT NOT NULL DEFAULT 'not_started',
      payment_order_id TEXT,
      payment_token TEXT,
      payment_url TEXT,
      payment_expires_at TEXT,
      paid_at TEXT,
      cancelled_at TEXT,
      refund_status TEXT,
      CHECK(check_out > check_in)
    );
    CREATE INDEX IF NOT EXISTS bookings_room_dates ON bookings(room_id, check_in, check_out, status);
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, image TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meal_schedules (
      id INTEGER PRIMARY KEY, meal_type TEXT NOT NULL UNIQUE CHECK(meal_type IN ('BREAKFAST','LUNCH','DINNER')),
      start_time TEXT NOT NULL, end_time TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meal_menus (
      id TEXT PRIMARY KEY, schedule_id INTEGER NOT NULL REFERENCES meal_schedules(id),
      menu_date TEXT NOT NULL, dish_name TEXT NOT NULL, category TEXT NOT NULL,
      UNIQUE(schedule_id, menu_date, dish_name)
    );
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  const bookingColumns = new Set((db.prepare('PRAGMA table_info(bookings)').all() as { name: string }[]).map((column) => column.name));
  const migrations: [string, string][] = [
    ['identity_number_encrypted', 'TEXT'], ['identity_photo_encrypted', 'TEXT'], ['identity_photo_mime', 'TEXT'],
    ['identity_consent_at', 'TEXT'], ['identity_delete_at', 'TEXT'], ['payment_status', "TEXT NOT NULL DEFAULT 'not_started'"],
    ['payment_order_id', 'TEXT'], ['payment_token', 'TEXT'], ['payment_url', 'TEXT'], ['payment_expires_at', 'TEXT'],
    ['paid_at', 'TEXT'], ['cancelled_at', 'TEXT'], ['refund_status', 'TEXT'],
  ];
  for (const [column, type] of migrations) if (!bookingColumns.has(column)) db.exec(`ALTER TABLE bookings ADD COLUMN ${column} ${type}`);
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_order ON bookings(payment_order_id) WHERE payment_order_id IS NOT NULL');
  const expiredIdentityDeleteAt = new Date(Date.parse(`${hotelToday()}T00:00:00Z`) + 30 * 86400000).toISOString().slice(0, 10);
  db.prepare("UPDATE bookings SET status='cancelled',payment_status='expired',cancelled_at=?,identity_delete_at=COALESCE(identity_delete_at,?) WHERE status='pending' AND payment_status='pending' AND payment_expires_at IS NOT NULL AND payment_expires_at<=?").run(new Date().toISOString(), expiredIdentityDeleteAt, new Date().toISOString());
  db.prepare('UPDATE bookings SET identity_number_encrypted=NULL,identity_photo_encrypted=NULL,identity_photo_mime=NULL,identity_consent_at=NULL WHERE identity_delete_at IS NOT NULL AND identity_delete_at<=?').run(hotelToday());
  const hasSeed = (key: string) => !!db.prepare('SELECT 1 FROM app_meta WHERE key=?').get(key);
  const markSeed = db.prepare('INSERT OR IGNORE INTO app_meta (key,value) VALUES (?,?)');
  if (!hasSeed('starter-rooms-v1')) {
    const roomCount = db.prepare('SELECT COUNT(*) AS count FROM rooms').get() as { count: number };
    if (roomCount.count === 0) {
    const insert = db.prepare('INSERT INTO rooms (id,name,description,price,capacity,stock,image,amenities) VALUES (?,?,?,?,?,?,?,?)');
    for (const room of starterRooms) insert.run(...room);
    }
    markSeed.run('starter-rooms-v1', 'done');
  }
  if (!hasSeed('starter-facilities-v1')) {
    const facilityCount = db.prepare('SELECT COUNT(*) AS count FROM facilities').get() as { count: number };
    if (facilityCount.count === 0) {
    const insert = db.prepare('INSERT INTO facilities (id,name,category,description,image) VALUES (?,?,?,?,?)');
    for (const [index, facility] of starterFacilities.entries()) insert.run(`facility-${index + 1}`, ...facility);
    }
    markSeed.run('starter-facilities-v1', 'done');
  }
  if (!hasSeed('starter-meals-v1')) {
    const scheduleCount = db.prepare('SELECT COUNT(*) AS count FROM meal_schedules').get() as { count: number };
    if (scheduleCount.count === 0) {
    const insert = db.prepare('INSERT INTO meal_schedules (id,meal_type,start_time,end_time) VALUES (?,?,?,?)');
    insert.run(1, 'BREAKFAST', '06:30', '10:00');
    insert.run(2, 'LUNCH', '12:00', '14:30');
    insert.run(3, 'DINNER', '18:00', '21:30');
    const menuInsert = db.prepare('INSERT INTO meal_menus (id,schedule_id,menu_date,dish_name,category) VALUES (?,?,?,?,?)');
    const date = hotelToday();
    for (const [index, [meal, dish, category]] of starterMenus.entries()) {
      const scheduleId = meal === 'BREAKFAST' ? 1 : meal === 'LUNCH' ? 2 : 3;
      menuInsert.run(`menu-${date}-${index + 1}`, scheduleId, date, dish, category);
    }
    }
    markSeed.run('starter-meals-v1', 'done');
  }
  globalThis.kamarkuDatabase = db;
  return db;
}

export type RoomRecord = { id: string; name: string; description: string; price: number; capacity: number; stock: number; image: string; amenities: string };
export type BookingRecord = { code: string; name: string; email: string; roomId: string; checkIn: string; checkOut: string; guests: number; total: number; status: 'pending'|'confirmed'|'cancelled'|'completed' };

export function listRooms() {
  return getDb().prepare('SELECT id,name,description,price,capacity,stock,image,amenities FROM rooms ORDER BY price').all() as RoomRecord[];
}

export function availability(checkIn: string, checkOut: string) {
  const db = getDb();
  return listRooms().map((room) => {
    const row = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE room_id = ? AND status IN ('pending','confirmed') AND check_in < ? AND check_out > ?").get(room.id, checkOut, checkIn) as { count: number };
    return { ...room, amenities: room.amenities.split(','), available: Math.max(0, room.stock - row.count) };
  });
}
