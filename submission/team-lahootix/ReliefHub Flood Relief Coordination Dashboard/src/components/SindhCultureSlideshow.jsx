import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, MapPin, Sparkles } from 'lucide-react';

const SINDH_SLIDES = [
  {
    id: 1,
    title: 'Sindhi Ajrak & Topi Heritage',
    tag: 'Cultural Pride & Identity',
    district: 'Matiari & Hyderabad',
    desc: 'Centuries-old geometric block-printing and mirror-work embroidery symbolizing Sindhi hospitality, peace, and cultural endurance.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Sindhi_Cap_Ajrak.jpg',
    fallbackBg: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 100%)',
  },
  {
    id: 2,
    title: 'Mohenjo-daro: 5,000 Years of Urban Planning',
    tag: 'Indus Valley Civilization',
    district: 'Larkana',
    desc: 'One of the world’s oldest planned cities with advanced flood engineering, brick architecture, and communal civic systems along the Indus.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Mohenjo-daro-2010.jpg',
    fallbackBg: 'linear-gradient(135deg, #78350f 0%, #1c1917 100%)',
  },
  {
    id: 3,
    title: 'Sukkur Barrage on the Mighty Indus River',
    tag: 'Lifeline of Sindh',
    district: 'Sukkur',
    desc: 'The historic 66-arch engineering marvel on the Indus River regulating irrigation channels and critical flood passages across Upper Sindh.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Indus_river_Sukkur_barrage_sunset.jpg',
    fallbackBg: 'linear-gradient(135deg, #0c4a6e 0%, #064e3b 100%)',
  },
  {
    id: 4,
    title: 'Ranikot Fort: The Great Wall of Sindh',
    tag: 'Heritage of Endurance',
    district: 'Jamshoro',
    desc: 'Spanning 32 kilometers across rugged Kirthar hills, standing as a monumental testament to Sindh’s ancient fortitude and defense.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Ranikot_Fort_-_The_Great_Wall_of_Sindh.jpg',
    fallbackBg: 'linear-gradient(135deg, #451a03 0%, #172554 100%)',
  },
  {
    id: 5,
    title: 'Shah Jahan Mosque & Kashikari Tile Art',
    tag: 'Sindhi Glazed Pottery',
    district: 'Thatta',
    desc: 'Renowned for 93 resonant domes and intricate cobalt-blue glazed tilework handcrafted by Thatta’s legendary artisans.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/72/PK_Thatta_asv2020-02_img01_Shah_Jahan_Mosque.jpg',
    fallbackBg: 'linear-gradient(135deg, #1e3a8a 0%, #14532d 100%)',
  },
];

export function SindhCultureSlideshow() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imgErrors, setImgErrors] = useState({});
  const timerRef = useRef(null);

  const total = SINDH_SLIDES.length;

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIdx]);

  const slide = SINDH_SLIDES[currentIdx];

  return (
    <div
      className="sindh-slideshow"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Sindh Culture & Heritage Slideshow"
    >
      {/* Background slide images */}
      <div className="sindh-slide-canvas">
        {SINDH_SLIDES.map((item, index) => {
          const isActive = index === currentIdx;
          const hasError = imgErrors[item.id];
          return (
            <div
              key={item.id}
              className={`sindh-slide-layer ${isActive ? 'active' : ''}`}
              style={{ background: item.fallbackBg }}
            >
              {!hasError && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="sindh-slide-img"
                  onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              )}
              <div className="sindh-slide-gradient" />
            </div>
          );
        })}
      </div>

      {/* Floating Header Tag */}
      <div className="sindh-slide-top-bar">
        <span className="sindh-culture-pill">
          <Sparkles size={13} className="sindh-sparkle-icon" />
          Sindh Heritage &amp; Community Resilience
        </span>
        <div className="sindh-slide-controls">
          <button
            type="button"
            className="sindh-ctrl-btn"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <span className="sindh-counter">
            0{currentIdx + 1} / 0{total}
          </span>
        </div>
      </div>

      {/* Slide Content Caption */}
      <div className="sindh-slide-caption">
        <div className="sindh-slide-meta">
          <span className="sindh-slide-tag">{slide.tag}</span>
          <span className="sindh-slide-location">
            <MapPin size={12} /> {slide.district}
          </span>
        </div>
        <h2 className="sindh-slide-title">{slide.title}</h2>
        <p className="sindh-slide-desc">{slide.desc}</p>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        className="sindh-nav-arrow sindh-nav-prev"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        className="sindh-nav-arrow sindh-nav-next"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot Indicators */}
      <div className="sindh-slide-dots">
        {SINDH_SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`sindh-dot ${index === currentIdx ? 'active' : ''}`}
            onClick={() => setCurrentIdx(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
