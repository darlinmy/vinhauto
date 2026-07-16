import React from "react";
import "./LandingPage.css";
import vinhAutoImg from "../assets/VinhAuTo.jpg";

function LandingPage() {
  const handleCtaClick = () => {
    const chatbotBtn = document.querySelector(".chat-widget-toggle");
    if (chatbotBtn) {
      chatbotBtn.click();
    } else {
      alert("Cảm ơn Quý khách! Trợ lý AI ở góc phải màn hình sẽ hỗ trợ Quý khách đặt lịch hẹn.");
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-page-container">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="landing-logo" onClick={() => scrollToSection("home")}>
          <img src={vinhAutoImg} alt="Vinh Auto Logo" className="landing-logo-img" />
          <span>Vinh Auto</span>
        </div>
        <nav className="landing-nav">
          <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Trang Chủ</a>
          <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection("services"); }}>Dịch Vụ</a>
          <a href="#commitments" onClick={(e) => { e.preventDefault(); scrollToSection("commitments"); }}>Cam Kết</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>Liên Hệ</a>
        </nav>
        <button className="landing-header-btn" onClick={handleCtaClick}>
          Đặt Lịch Hẹn
        </button>
      </header>

      {/* Hero Section */}
      <section id="home" className="landing-hero">
        <div className="landing-hero-content">
          <h1>Hệ Thống Sửa Chữa & Bảo Dưỡng Ô Tô Vinh Auto</h1>
          <p>
            Đơn vị uy tín chuyên bảo dưỡng định kỳ, chẩn đoán lỗi chuyên sâu và sửa chữa các dòng xe du lịch. Tận tâm phục vụ mang lại sự an tâm tuyệt đối cho Quý khách trên mọi hành trình.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-cta-btn btn-primary" onClick={handleCtaClick}>
              Đặt Lịch Tư Vấn Ngay
            </button>
            <button className="landing-cta-btn btn-secondary" onClick={() => scrollToSection("services")}>
              Xem Dịch Vụ Của Chúng Tôi
            </button>
          </div>
        </div>
      </section>

      {/* Core Commitments Section */}
      <section id="commitments" className="landing-commitments-section">
        <div className="landing-section-header">
          <h2>Cam Kết Dịch Vụ Từ Vinh Auto</h2>
          <p>Chúng tôi luôn nỗ lực mang tới trải nghiệm dịch vụ trung thực, chất lượng và tử tế nhất tới mọi thế hệ khách hàng.</p>
        </div>
        <div className="landing-commitments-grid">
          <div className="landing-commitment-card">
            <div className="commitment-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="commitment-svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Trung Thực & Minh Bạch</h3>
            <p>Kiểm tra kỹ lưỡng, tư vấn đúng lỗi, báo giá chi tiết rõ ràng trước khi sửa chữa. Tuyệt đối không vẽ thêm lỗi hay thay thế linh kiện khi chưa có sự đồng ý của Quý khách.</p>
          </div>

          <div className="landing-commitment-card">
            <div className="commitment-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="commitment-svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3>Linh Kiện Chính Hãng</h3>
            <p>100% phụ tùng, dầu nhớt và vật tư thay thế đều có nguồn gốc rõ ràng, đạt chuẩn chất lượng từ nhà sản xuất xe, đi kèm chính sách bảo hành uy tín đầy đủ.</p>
          </div>

          <div className="landing-commitment-card">
            <div className="commitment-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="commitment-svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Tay Nghề Chu Đáo</h3>
            <p>Đội ngũ kỹ thuật viên giàu kinh nghiệm, tác phong chuyên nghiệp, cẩn thận tỉ mỉ trong từng con ốc để đảm bảo xe vận hành an toàn nhất.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="landing-services-section">
        <div className="landing-section-header">
          <h2>Các Dịch Vụ Tiêu Biểu</h2>
          <p>Cung cấp đầy đủ các hạng mục chăm sóc kỹ thuật chuyên sâu đáp ứng yêu cầu của Quý khách.</p>
        </div>
        <div className="landing-services-grid">
          <div className="landing-service-card">
            <div className="landing-service-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="service-svg">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h3>Chẩn Đoán Lỗi Bằng Máy Chuyên Dụng</h3>
            <p>Sử dụng máy đọc lỗi ECU hiện đại để phát hiện chính xác các sự cố điện động cơ, hộp số và các hệ thống phụ trợ, rút ngắn thời gian sửa chữa.</p>
          </div>

          <div className="landing-service-card">
            <div className="landing-service-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="service-svg">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4l3 3"></path>
              </svg>
            </div>
            <h3>Bảo Dưỡng Định Kỳ Trọn Gói</h3>
            <p>Thay dầu động cơ, lọc nhớt, vệ sinh điều hòa, cân chỉnh áp suất lốp và kiểm tra an toàn 24 hạng mục tiêu chuẩn giúp xe luôn êm ái.</p>
          </div>

          <div className="landing-service-card">
            <div className="landing-service-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="service-svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <h3>Sửa Chữa Gầm Bệ & Động Cơ</h3>
            <p>Xử lý triệt để các tiếng kêu lạ ở gầm, đại tu động cơ, khắc phục rò rỉ dầu nhớt, sửa chữa hệ thống lái và phanh xe đạt chuẩn an toàn.</p>
          </div>
        </div>
      </section>

      {/* Simple Information / Contact Section */}
      <section id="contact" className="landing-contact-section">
        <div className="landing-contact-container">
          <div className="contact-info-block">
            <h2>Thông Tin Liên Hệ</h2>
            <p className="contact-subtext">Quý khách vui lòng liên hệ hoặc ghé trực tiếp garage để được phục vụ tốt nhất.</p>
            <div className="contact-details">
              <p><strong>Địa chỉ:</strong> Lê thánh tông, phường phú mỹ, thành phố hồ chí minh</p>
              <p><strong>Điện thoại:</strong> 84+ 908 087 925</p>
              <p><strong>Giờ làm việc:</strong> 08:00 - 17:30 (Thứ 2 - Chủ Nhật)</p>
            </div>
            <button className="landing-cta-btn btn-primary" onClick={handleCtaClick}>
              Yêu Cầu Gọi Lại / Đặt Hẹn
            </button>
          </div>
          <div className="contact-visual-block">
            <div className="visual-garage-card">
              <h3>Garage Vinh Auto</h3>
              <div className="garage-badge"> Đang hoạt động</div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Vinh Auto. Mọi quyền được bảo lưu. Thiết kế đơn giản, trang trọng và lịch sự phục vụ khách hàng.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
