import { useEffect } from 'react';

export default function useReveal(dep) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.reveal:not(.visible)')];
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [dep]);
}
