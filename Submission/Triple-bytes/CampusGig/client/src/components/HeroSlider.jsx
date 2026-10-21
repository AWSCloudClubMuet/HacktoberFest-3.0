import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HERO_IMAGES } from '../utils/constants.js';

export default function HeroSlider() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % HERO_IMAGES.length), 3000);
    return () => clearInterval(timer);
  }, [tick]);

  const go = (i) => {
    setCurrent(i);
    setTick((n) => n + 1);
  };

  return (
    <div className="hero-slider" aria-label={t('slider.label')}>
      {HERO_IMAGES.map((src, i) => (
        <div key={src} className={`slide${i === current ? ' active' : ''}`}>
          <img src={src} alt={t(`slider.alt${i + 1}`)} />
        </div>
      ))}
      <div className="slider-caption">
        <span>{String(current + 1).padStart(2, '0')}</span>
        <span className="slider-line" />
        <span>{t('slider.caption')}</span>
        <div className="slider-dots">
          {HERO_IMAGES.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`sl-dot${i === current ? ' active' : ''}`}
              aria-label={t('slider.show', { n: i + 1 })}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
