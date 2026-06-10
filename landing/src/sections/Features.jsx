import React from 'react';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Tích hợp nhanh',
    desc: 'Thêm thanh toán crypto chỉ với vài dòng mã hoặc một liên kết — sẵn sàng trong vài phút.',
  },
  {
    icon: '💸',
    title: 'Phí thấp',
    desc: 'Phí giao dịch minh bạch, thấp hơn nhiều so với thẻ tín dụng truyền thống.',
  },
  {
    icon: '🪙',
    title: 'Thanh toán stablecoin',
    desc: 'Nhận USDT, USDC và các stablecoin phổ biến — tránh biến động giá tiền mã hóa.',
  },
  {
    icon: '🔒',
    title: 'Bảo mật',
    desc: 'Hạ tầng không lưu khóa của bạn, mã hóa đầu cuối và giám sát giao dịch liên tục.',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <h2 className="section__title">Vì sao chọn ChainPay</h2>
        <div className="features__grid">
          {FEATURES.map((f) => (
            <article className="feature-card" key={f.title}>
              <div className="feature-card__icon" aria-hidden="true">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
