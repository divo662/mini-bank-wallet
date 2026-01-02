import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';

interface HeaderProps {
  onSearchChange: (value: string) => void;
}

const Header = ({ onSearchChange }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const setFilters = useWalletStore((state) => state.setFilters);
  const user = useWalletStore((state) => state.user);
  const navigate = useNavigate();

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0).toUpperCase() || '';
    const last = user.lastName?.charAt(0).toUpperCase() || '';
    return first + (last || '');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setFilters({ merchant: value });
    onSearchChange(value);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleThemeClick = () => {
    window.dispatchEvent(
      new CustomEvent('show-feature-not-available', {
        detail: { message: 'Theme feature does not exist yet' },
      })
    );
  };

  const handleNotificationClick = () => {
    window.dispatchEvent(
      new CustomEvent('show-feature-not-available', {
        detail: { message: 'Notifications feature does not exist yet' },
      })
    );
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Side - Search */}
          <div className="flex items-center gap-3 flex-1">
            {isSearchOpen ? (
              <div className="flex-1 max-w-md relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onBlur={() => {
                    if (!searchValue) setIsSearchOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      setSearchValue('');
                    }
                  }}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:bg-white text-gray-700"
                  aria-label="Search transactions"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            ) : (
              <button
                onClick={handleSearchClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                aria-label="Open search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-sm">Search</span>
              </button>
            )}

            {/* Theme Icon */}
            <button
              onClick={handleThemeClick}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              aria-label="Theme"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>

            {/* Notification Icon */}
            <button
              onClick={handleNotificationClick}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 relative"
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#172030]"
              aria-label="View profile"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: user?.avatarColor || '#172030' }}
                >
                  {getInitials()}
                </div>
              )}
            </button>
          </div>

          {/* Right Side - Transfer Button */}
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            <span>Transfer</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Search Container Overlay */}
      {isSearchOpen && searchValue && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden" onClick={() => setIsSearchOpen(false)}></div>
      )}
    </>
  );
};

export default Header;
