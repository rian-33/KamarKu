import type { ReactNode } from 'react';

export type HotelIconName =
  | 'home'
  | 'bed'
  | 'sparkles'
  | 'clock'
  | 'info'
  | 'map-pin'
  | 'calendar'
  | 'utensils'
  | 'chart'
  | 'clipboard'
  | 'sun'
  | 'moon'
  | 'arrow-up-right'
  | 'door'
  | 'user';

const drawings: Record<HotelIconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  bed: <><path d="M3 18v-7h18v7M5 11V6h5a4 4 0 0 1 4 4"/><path d="M3 18v3m18-3v3M3 15h18"/></>,
  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.8 1.7L7.5 5.5l-1.7.8L5 8l-.8-1.7-1.7-.8 1.7-.8L5 3Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  'map-pin': <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  utensils: <><path d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3m-3 7v11M17 3v18m0-18c3 2 4 6 0 9"/></>,
  chart: <><path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2m-6 5h6m-6 4h6m-6 4h4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>,
  'arrow-up-right': <><path d="M7 17 17 7M8 7h9v9"/></>,
  door: <><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><path d="M14 12h.01"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/></>,
};

export function HotelIcon({ name, size = 18, strokeWidth = 1.65, className }: { name: HotelIconName; size?: number; strokeWidth?: number; className?: string }) {
  return <svg aria-hidden="true" focusable="false" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{drawings[name]}</svg>;
}
