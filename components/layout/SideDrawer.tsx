import React from 'react';
import { X } from 'lucide-react';
import { Category } from '@/types';

interface SideDrawerProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onNavigate: (view: string) => void;
}

/**
 * Slide-out navigation drawer for mobile screens
 */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  categories,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    'Home',
    'Shop All',
    ...categories.map((c) => c.name),
    'Professional Collection',
    'About Us',
  ];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        {/* Drawer Header */}
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="serif text-2xl">Explore AERON</h2>
          <button aria-label="Close panel" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-6">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className="block py-4 border-b border-[#eee] w-full text-left font-semibold text-sm hover:text-[#9e7b50] transition"
            >
              {item}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};