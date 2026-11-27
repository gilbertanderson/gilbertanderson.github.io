import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { TomatoMark } from '@/components/atoms/TomatoMark';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';

function TabButton({
  label,
  active,
  onClick,
  icon,
  filledIcon,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  filledIcon: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {/* Outline + filled glyphs are stacked so the active/hover crossfade never shifts layout. */}
      <span className="nav-ico">
        <span className="ico-line">{icon}</span>
        <span className="ico-fill">{filledIcon}</span>
        {badge ? <TomatoMark size={15} className="nav-badge" /> : null}
      </span>
      <span className="label">{label}</span>
    </button>
  );
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Tomato badges: appear for a new offer / chat message, clear on tab visit.
  const { hasNewOffers, hasNewMessages } = useNotificationBadges();

  return (
    <nav className="bottom-nav">
      <TabButton label="Market" icon={Icon.navMarket} filledIcon={Icon.navMarketFilled} active={path.startsWith('/marketplace')} onClick={() => navigate('/marketplace')} />
      <TabButton label="Offers" icon={Icon.navOffers} filledIcon={Icon.navOffersFilled} active={path.startsWith('/offers')} onClick={() => navigate('/offers')} badge={hasNewOffers} />
      <TabButton label="Messages" icon={Icon.navMessages} filledIcon={Icon.navMessagesFilled} active={path.startsWith('/messages')} onClick={() => navigate('/messages')} badge={hasNewMessages} />
      <TabButton label="Profile" icon={Icon.navProfile} filledIcon={Icon.navProfileFilled} active={path.startsWith('/profile')} onClick={() => navigate('/profile')} />
    </nav>
  );
}
