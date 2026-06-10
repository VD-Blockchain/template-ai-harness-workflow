import React from 'react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <p className="hero__eyebrow">Cổng thanh toán crypto cho doanh nghiệp</p>
        <h1 className="hero__title">
          Chấp nhận thanh toán crypto &amp; stablecoin <br />
          chỉ trong vài phút
        </h1>
        <p className="hero__subtitle">
          ChainPay giúp doanh nghiệp của bạn nhận thanh toán bằng tiền mã hóa và
          stablecoin một cách nhanh chóng, phí thấp và an toàn — không cần kiến thức
          kỹ thuật phức tạp.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href="#waitlist">
            Tham gia danh sách chờ
          </a>
          <a className="btn btn--ghost btn--lg" href="#how">
            Tìm hiểu cách hoạt động
          </a>
        </div>
        <p className="hero__note">Miễn phí đăng ký · Ưu tiên truy cập khi ra mắt</p>
      </div>
    </section>
  );
}
