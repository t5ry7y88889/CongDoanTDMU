import { useState } from 'react';

const slides = [
  {
    id: 1,
    image: '/images/banner.jpg',
    title: 'ĐẠI HỘI CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT',
    subtitle: 'Đổi mới - Dân chủ - Đoàn kết - Phát triển vì quyền lợi đoàn viên'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200',
    title: 'CHĂM LO ĐỜI SỐNG & BẢO VỆ QUYỀN LỢI ĐOÀN VIÊN',
    subtitle: 'Triển khai nhiều chương trình phúc lợi, trợ cấp khó khăn và khám sức khỏe định kỳ'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
    title: 'PHONG TRÀO THI ĐUA DẠY TỐT - HỌC TỐT - NGHIÊN CỨU TỐT',
    subtitle: 'Phát huy tinh thần sáng tạo của cán bộ, giảng viên trong kỷ nguyên số'
  }
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section id="sectionslide" className="my-3">
      <div className="container">
        <div id="heroCarousel" className="carousel slide shadow-sm" data-bs-ride="carousel">
          <div className="carousel-indicators">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to={idx}
                className={idx === currentIndex ? 'active' : ''}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>

          <div className="carousel-inner rounded">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                className={`carousel-item ${idx === currentIndex ? 'active' : ''}`}
                style={{
                  display: idx === currentIndex ? 'block' : 'none',
                  transition: 'opacity 0.6s ease-in-out'
                }}
              >
                <img
                  src={s.image}
                  className="d-block w-100"
                  alt={s.title}
                  style={{ height: '380px', objectFit: 'cover' }}
                />
                <div
                  className="carousel-caption d-none d-md-block"
                  style={{
                    background: 'rgba(0,34,64,0.75)',
                    borderRadius: '4px',
                    padding: '12px 20px'
                  }}
                >
                  <h5 className="fw-bold text-warning">{s.title}</h5>
                  <p className="mb-0">{s.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="prev"
            onClick={handlePrev}
            aria-label="Previous Slide"
          >
            <span className="carousel-control-prev-icon"></span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="next"
            onClick={handleNext}
            aria-label="Next Slide"
          >
            <span className="carousel-control-next-icon"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;