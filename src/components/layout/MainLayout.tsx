import Navbar from './Navbar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
