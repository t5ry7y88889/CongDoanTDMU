import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultSlides = [
  {
    id: 1,
    image: '/images/banner.jpg',
    title: 'CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    subtitle: 'Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi người lao động',
    linkUrl: '/gioi-thieu'
  }
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(defaultSlides);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 1. Fetch dynamic banners from database first
    fetch('/api/banners')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map(b => ({
            id: b.id,
            image: b.image || b.HinhAnhUrl || '/images/banner.jpg',
            title: b.title || b.TieuDe || '',
            subtitle: b.subtitle || b.PhuDe || '',
            linkUrl: b.linkUrl || b.DuongDanLienKet || ''
          }));
          setSlides(formatted);
        } else {
          // Fallback to top published articles if no custom banners
          fetch('/api/articles?status=published')
            .then(r => r.json())
            .then(artRes => {
              if (artRes.success && Array.isArray(artRes.data) && artRes.data.length > 0) {
                const validArticles = artRes.data.filter(a => a.image && !a.image.includes('banner.jpg')).slice(0, 4);
                const topList = validArticles.length >= 2 ? validArticles : artRes.data.slice(0, 4);
                const formatted = topList.map(a => ({
                  id: a.id,
                  articleId: a.id,
                  image: a.image || '/images/banner.jpg',
                  title: a.title,
                  subtitle: a.summary ? (a.summary.length > 140 ? a.summary.slice(0, 140) + '...' : a.summary) : 'Công đoàn Trường Đại học Thủ Dầu Một',
                  linkUrl: `/bai-viet?id=${a.id}`
                }));
                if (formatted.length > 0) setSlides(formatted);
              }
            }).catch(() => {});
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

  const handleSlideClick = (slide) => {
    if (!slide) return;
    const targetUrl = slide.linkUrl || (slide.articleId ? `/bai-viet?id=${slide.articleId}` : '');
    if (!targetUrl) return;
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <section id="sectionslide" className="my-3">
      <div className="container">
        <div className="carousel slide shadow-sm position-relative overflow-hidden rounded" style={{ height: '380px' }}>
          {/* Indicators */}
          <div className="carousel-indicators">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
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
                key={s.id || idx}
                className={`carousel-item h-100 ${idx === currentIndex ? 'active' : ''}`}
                style={{
                  display: idx === currentIndex ? 'block' : 'none',
                  transition: 'opacity 0.6s ease-in-out',
                  cursor: (s.linkUrl || s.articleId) ? 'pointer' : 'default'
                }}
                onClick={() => handleSlideClick(s)}
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
                  {s.subtitle && (
                    <p className="mb-0 text-light" style={{ fontSize: '14px' }}>
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          {slides.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Trước</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Sau</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
