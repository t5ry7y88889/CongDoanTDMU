import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultSlides = [
  {
    id: 1,
    image: '/images/banner.jpg',
    title: 'CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    subtitle: 'Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi người lao động'
  }
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(defaultSlides);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/articles?status=published')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Take top 4 articles with valid images
          const validArticles = res.data.filter(a => a.image && !a.image.includes('banner.jpg')).slice(0, 4);
          const topList = validArticles.length >= 2 ? validArticles : res.data.slice(0, 4);
          const formatted = topList.map(a => ({
            id: a.id,
            articleId: a.id,
            image: a.image || '/images/banner.jpg',
            title: a.title,
            subtitle: a.summary ? (a.summary.length > 140 ? a.summary.slice(0, 140) + '...' : a.summary) : 'Công đoàn Trường Đại học Thủ Dầu Một'
          }));
          if (formatted.length > 0) {
            setSlides(formatted);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section id="sectionslide" className="my-3">
      <div className="container">
        <div className="carousel slide shadow-sm position-relative overflow-hidden rounded" style={{ height: '380px' }}>
          {/* Indicators */}
          <div className="carousel-indicators">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={idx === currentIndex ? 'active' : ''}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>

          {/* Slides */}
          <div className="carousel-inner h-100">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                className={`carousel-item h-100 ${idx === currentIndex ? 'active' : ''}`}
                style={{
                  display: idx === currentIndex ? 'block' : 'none',
                  transition: 'opacity 0.6s ease-in-out',
                  cursor: s.articleId ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (s.articleId) navigate(`/bai-viet?id=${s.articleId}`);
                }}
              >
                <img
                  src={s.image}
                  className="d-block w-100 h-100"
                  alt={s.title}
                  style={{ objectFit: 'cover' }}
                />
                <div
                  className="carousel-caption d-none d-md-block"
                  style={{
                    background: 'rgba(0, 34, 64, 0.78)',
                    borderRadius: '6px',
                    padding: '14px 24px',
                    bottom: '24px'
                  }}
                >
                  <h5 className="fw-bold text-warning mb-1" style={{ letterSpacing: '0.5px' }}>
                    {s.title}
                  </h5>
                  <p className="mb-0 text-light" style={{ fontSize: '14px' }}>
                    {s.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            className="carousel-control-prev"
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            style={{ width: '5%', background: 'none', border: 'none' }}
          >
            <span className="carousel-control-prev-icon"></span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            style={{ width: '5%', background: 'none', border: 'none' }}
          >
            <span className="carousel-control-next-icon"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
