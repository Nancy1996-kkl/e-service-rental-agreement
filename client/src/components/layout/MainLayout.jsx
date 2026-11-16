import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ScrollToHash from './ScrollToHash.jsx';

// Ellaa public pages-kum common layout: mela Navbar, naduvula page, keezha Footer.
// <Outlet /> = andha nerathula open aagura page inga varum.
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToHash />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
