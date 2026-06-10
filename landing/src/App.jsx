import React from 'react';
import Hero from './sections/Hero.jsx';
import Value from './sections/Value.jsx';
import Features from './sections/Features.jsx';
import HowItWorks from './sections/HowItWorks.jsx';
import Waitlist from './sections/Waitlist.jsx';
import Footer from './sections/Footer.jsx';

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <span className="brand">Chain<span className="brand__accent">Pay</span></span>
          <a className="btn btn--ghost" href="#waitlist">Đăng ký sớm</a>
        </div>
      </header>
      <main>
        <Hero />
        <Value />
        <Features />
        <HowItWorks />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
