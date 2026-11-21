import React from 'react';

interface ToastNoticeProps {
  notice: string;
}

/**
 * Floating toast notification alert for user feedback
 */
export const ToastNotice: React.FC<ToastNoticeProps> = ({ notice }) => {
  if (!notice) return null;

  return (
    <div
      role="status"
      className="fixed z-[100] top-24 right-5 max-w-sm bg-[#171717] text-white text-sm p-4 shadow-xl"
    >
      {notice}
    </div>
  );
};
