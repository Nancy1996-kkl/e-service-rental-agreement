import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// "/#templates" maadhiri link click pannaa, andha section-ku scroll aaga.
// Hash illana page top-ku pogum.
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
