import React, { useEffect, useState, useCallback } from 'react';
import { submitWaitlist, getCount, isEmail, statusToState } from '../api.js';

const MESSAGES = {
  created: { cls: 'ok', text: '🎉 Cảm ơn bạn! Email đã được thêm vào danh sách chờ.' },
  exists: { cls: 'ok', text: '👍 Email này đã có trong danh sách chờ rồi. Hẹn gặp lại khi ra mắt!' },
  error: { cls: 'err', text: '⚠️ Email không hợp lệ hoặc có lỗi xảy ra. Vui lòng thử lại.' },
};

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | created | exists | error
  const [count, setCount] = useState(null);

  const refreshCount = useCallback(async () => {
    try {
      setCount(await getCount());
    } catch {
      /* social proof is best-effort; ignore */
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setState('error');
      return;
    }
    setState('loading');
    try {
      const r = await submitWaitlist(email.trim().toLowerCase());
      setState(statusToState(r));
      refreshCount();
    } catch {
      setState('error');
    }
  }

  const msg = MESSAGES[state];

  return (
    <section className="waitlist" id="waitlist">
      <div className="container waitlist__inner">
        <h2 className="section__title">Tham gia danh sách chờ</h2>
        <p className="waitlist__lead">
          Để lại email để nhận ưu tiên truy cập và ưu đãi đặc biệt khi ChainPay ra mắt.
        </p>

        <form className="waitlist__form" onSubmit={onSubmit} noValidate>
          <input
            className="waitlist__input"
            type="email"
            name="email"
            required
            placeholder="email@doanhnghiep.com"
            aria-label="Địa chỉ email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === 'error') setState('idle');
            }}
          />
          <button
            className="btn btn--primary"
            type="submit"
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Đang gửi…' : 'Đăng ký'}
          </button>
        </form>

        {msg && (
          <p className={`waitlist__msg waitlist__msg--${msg.cls}`} role="status">
            {msg.text}
          </p>
        )}

        {count !== null && count > 0 && (
          <p className="waitlist__count">
            Đã có <strong>{count}</strong> người đăng ký
          </p>
        )}
      </div>
    </section>
  );
}
