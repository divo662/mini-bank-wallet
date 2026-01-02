import { useState, createContext, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';

interface MobileMenuContextType {
  closeMenu: () => void;
  isOpen: boolean;
}

const MobileMenuContext = createContext<MobileMenuContextType | null>(null);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  return context;
};

interface MobileMenuProps {
  children: React.ReactNode;
}

const MobileMenu = ({ children }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useWalletStore((state) => state.user);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0).toUpperCase() || '';
    const last = user.lastName?.charAt(0).toUpperCase() || '';
    return first + (last || '');
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <MobileMenuContext.Provider value={{ closeMenu, isOpen }}>
      {/* Mobile Menu Toggle Button - Better positioned */}
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-3 left-3 z-50 bg-white border border-gray-200 text-gray-700 p-2 rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar - Better positioned, doesn't overflow */}
      <div
        className={`md:hidden fixed left-0 top-0 h-full w-64 max-w-[80vw] bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#172030] text-white flex-shrink-0">
          <Link
            to="/profile"
            onClick={closeMenu}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ backgroundColor: user?.avatarColor || '#172030' }}
              >
                {getInitials()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </p>
              <p className="text-xs text-white/80 truncate">{user?.role || 'Account Holder'}</p>
            </div>
          </Link>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>

      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 z-10">
        {children}
      </div>
    </MobileMenuContext.Provider>
  );
};

export default MobileMenu;
