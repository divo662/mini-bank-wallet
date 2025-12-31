import { type ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
// import Header from './Header';
import MobileMenu from './MobileMenu';
import FeatureNotAvailable from '../Common/FeatureNotAvailable';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [notification, setNotification] = useState<{ message: string } | null>(null);

  useEffect(() => {
    const handleFeatureNotAvailable = (event: CustomEvent) => {
      setNotification({ message: event.detail.message || "This feature does not exist yet" });
      setTimeout(() => setNotification(null), 3000);
    };

    window.addEventListener('show-feature-not-available', handleFeatureNotAvailable as EventListener);

    return () => {
      window.removeEventListener('show-feature-not-available', handleFeatureNotAvailable as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && <FeatureNotAvailable message={notification.message} />}
      <MobileMenu>
        <Sidebar />
      </MobileMenu>
      <div className="ml-0 md:ml-56">
        {/* <Header onSearchChange={handleSearchChange} /> */}
        <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

