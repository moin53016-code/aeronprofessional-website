import React from 'react';
import { SiteSettings } from '@/types';

interface AnnouncementBarProps {
  settings?: SiteSettings;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings }) => {
  if (settings && !settings.announcementBarVisible) return null;
  
  const text = settings?.announcementBarText || 'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE';
  
  return (
    <div className="bg-[#141414] text-white text-center text-[10px] tracking-[.18em] py-2.5 px-4">
      {text}
    </div>
  );
};
