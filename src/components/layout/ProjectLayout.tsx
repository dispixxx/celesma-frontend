import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface ProjectLayoutProps {
  children: React.ReactNode;
  isMember?: boolean;
}

export default function ProjectLayout({ children, isMember = true }: ProjectLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="project-layout">
        <Sidebar isMember={isMember} />
        <main className="project-content">
          {children}
        </main>
      </div>
      <BottomNav isMember={isMember} />
    </>
  );
}
