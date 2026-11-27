import React from 'react';

// Inline line icons, ported from the prototype's atoms.jsx Icon map.
export const Icon = {
  search: (
    <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  plus: (size = 16) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  back: (
    <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  ),
  bolt: (size = 14) => (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
    </svg>
  ),
  check: (size = 14) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  send: (
    <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  ),
  navMarket: (
    <svg className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M5 9v11h14V9" />
      <path d="M3 9h18" />
      <path d="M9 13h6" />
    </svg>
  ),
  navOffers: (
    <svg className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 7h18l-2 13H5L3 7Z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  ),
  navMessages: (
    <svg className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 12c0 4.4-4 8-9 8a9.9 9.9 0 0 1-4.3-1L3 20l1.4-3.7A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  ),
  navProfile: (
    <svg className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  navMarketFilled: (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 3.5h15a1 1 0 0 1 .96.73L22 9.5H2l1.54-5.27A1 1 0 0 1 4.5 3.5Z" />
      <path d="M3.5 10.5h17V20a1 1 0 0 1-1 1H14v-5.5h-4V21H4.5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  ),
  navOffersFilled: (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 7h18l-2 13H5L3 7Z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  navMessagesFilled: (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12c0 4.4-4 8-9 8a9.9 9.9 0 0 1-4.3-1L3 20l1.4-3.7A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  ),
  navProfileFilled: (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M3.5 21a8.5 8.5 0 0 1 17 0Z" />
    </svg>
  ),
  message: (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12c0 4.4-4 8-9 8a9.9 9.9 0 0 1-4.3-1L3 20l1.4-3.7A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  ),
  users: (size = 14) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 20h5v-2a3 3 0 0 0-5.4-1.8M17 20H7m10 0v-2c0-.7-.1-1.3-.4-1.9M7 20H2v-2a3 3 0 0 1 5.4-1.8M7 20v-2c0-.7.1-1.3.4-1.9m0 0a5 5 0 0 1 9.3 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  grid: (size = 16) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  list: (size = 16) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Sprouting leaf — used as the neutral placeholder when a photo is missing.
  leaf: (size = 28) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 9-9 1 6-2 11-6 12" />
      <path d="M11 20c0-4 2-8 6-10" />
    </svg>
  ),
};
