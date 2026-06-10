import React from 'react';

const STEPS = [
  {
    n: '1',
    title: 'Tạo tài khoản',
    desc: 'Đăng ký ChainPay và xác minh doanh nghiệp của bạn trong vài phút.',
  },
  {
    n: '2',
    title: 'Tích hợp nút thanh toán',
    desc: 'Gắn nút thanh toán hoặc liên kết ChainPay vào website hay hóa đơn của bạn.',
  },
  {
    n: '3',
    title: 'Nhận thanh toán',
    desc: 'Khách hàng trả bằng crypto, bạn nhận stablecoin ổn định vào tài khoản.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="container">
        <h2 className="section__title">Hoạt động như thế nào</h2>
        <ol className="how__steps">
          {STEPS.map((s) => (
            <li className="how-step" key={s.n}>
              <div className="how-step__num" aria-hidden="true">{s.n}</div>
              <h3 className="how-step__title">{s.title}</h3>
              <p className="how-step__desc">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
