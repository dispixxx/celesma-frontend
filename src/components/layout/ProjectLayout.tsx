import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import type { ProjectRole } from '../../types';

interface ProjectLayoutProps {
  children: React.ReactNode;
  isMember?: boolean;
  userRole?: ProjectRole;
}

export default function ProjectLayout({ children, isMember = true, userRole }: ProjectLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="project-layout">
        <Sidebar isMember={isMember} userRole={userRole} />
        <main className="project-content">
          {children}
        </main>
      </div>
      <BottomNav isMember={isMember} />
    </>
  );
}
