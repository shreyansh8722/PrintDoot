import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPinterestP,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaTruck,
  FaUndoAlt,
  FaHeadset,
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import logoImg from '../../assets/logo.webp';

/* ──────────────── DATA ──────────────── */
const shopLinks = [
  { label: 'T-Shirts', to: '/categories/t-shirts' },
  { label: 'Mugs & Cups', to: '/categories/mugs' },
  { label: 'Visiting Cards', to: '/categories/visiting-cards' },
  { label: 'Photo Frames', to: '/categories/photo-frames' },
  { label: 'Stickers & Labels', to: '/categories/stickers' },
  { label: 'Corporate Gifts', to: '/categories/corporate' },
  { label: 'Caps & Hats', to: '/categories/caps' },
  { label: 'View All Products', to: '/view-all' },
];

const helpLinks = [
  { label: 'My Account', to: '/account' },
  { label: 'Track Your Order', to: '/track-order' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Bulk Order Inquiry', to: '/contact' },
  { label: 'Design Help', to: '/help' },
];

const policyLinks = [
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cookie Policy', to: '/cookies' },
  { label: 'Refund & Return Policy', to: '/refund-policy' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
];

const trustBadges = [
  { icon: FaShieldAlt, title: '100% Secure', desc: 'Payment' },
  { icon: FaTruck, title: 'Fast Delivery', desc: 'Pan-India' },
  { icon: FaUndoAlt, title: 'Easy Returns', desc: '7-Day Policy' },
  { icon: FaHeadset, title: '24/7 Support', desc: 'Always Here' },
];

/* ──────────────── COLLAPSIBLE SECTION (MOBILE) ──────────────── */
const MobileAccordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 lg:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 lg:hidden"
      >
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
        {open ? <FaChevronUp className="text-xs text-gray-400" /> : <FaChevronDown className="text-xs text-gray-400" />}
      </button>
      <h3 className="hidden lg:block text-sm font-bold text-white tracking-wide uppercase mb-5">{title}</h3>
      <div className={`${open ? 'max-h-96 pb-4' : 'max-h-0'} lg:max-h-none overflow-hidden transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
};

/* ──────────────── FOOTER ──────────────── */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full font-sans">

      {/* ═══════ TRUST BADGES BAR ═══════ */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 place-items-center">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="text-brand text-lg" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ NEWSLETTER STRIP ═══════ */}
      <div className="bg-brand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-white font-bold text-lg sm:text-xl">Stay in the loop!</h3>
            <p className="text-white/80 text-sm mt-0.5">Get exclusive offers, new arrivals & design inspiration.</p>
          </div>
          <form className="flex w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 sm:w-72 px-4 py-3 rounded-l-xl text-sm bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:bg-white/30 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-dark text-white font-semibold text-sm rounded-r-xl hover:bg-gray-900 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* ═══════ MAIN FOOTER ═══════ */}
      <div className="bg-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 lg:pt-16 lg:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* ── Brand Column ── */}
            <div className="lg:col-span-4 space-y-5">
              <Link to="/" className="inline-block">
                <img
                  src={logoImg}
                  alt="PrintDoot"
                  className="h-11 w-auto rounded-lg object-contain"
                />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                India's trusted destination for premium custom printing & personalized gifts.
                From T-shirts to visiting cards — we bring your ideas to life with quality and care.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 pt-2">
                <a href="tel:+917827303575" className="flex items-center gap-3 text-sm text-gray-300 hover:text-brand transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-brand/20 flex items-center justify-center transition-colors">
                    <FaPhoneAlt className="text-xs text-brand" />
                  </div>
                  +91 78273-03575
                </a>
                <a href="mailto:printdootweb@gmail.com" className="flex items-center gap-3 text-sm text-gray-300 hover:text-brand transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-brand/20 flex items-center justify-center transition-colors">
                    <FaEnvelope className="text-xs text-brand" />
                  </div>
                  printdootweb@gmail.com
                </a>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <FaClock className="text-xs text-brand" />
                  </div>
                  Mon – Sat, 9 AM – 7 PM
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-2.5 pt-3">
                {[
                  { Icon: FaFacebookF, label: 'Facebook', href: 'https://www.facebook.com/share/17F8cyKAQo/?mibextid=wwXIfr', color: '#1877F2' },
                  { Icon: FaInstagram, label: 'Instagram', href: 'https://www.instagram.com/printdoot?igsh=czltNGNvaHNsMm4z', color: '#E4405F' },
                  { Icon: RiTwitterXFill, label: 'Twitter', href: '#', color: '#ffffff' },
                  { Icon: FaYoutube, label: 'YouTube', href: '#', color: '#FF0000' },
                  { Icon: FaPinterestP, label: 'Pinterest', href: '#', color: '#E60023' },
                  { Icon: FaLinkedinIn, label: 'LinkedIn', href: '#', color: '#0A66C2' },
                ].map(({ Icon, label, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20"
                  >
                    <Icon className="text-sm" style={{ color }} />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Shop Links ── */}
            <div className="lg:col-span-3">
              <MobileAccordion title="Shop by Category">
                <ul className="space-y-3 text-[14px] text-gray-400">
                  {shopLinks.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="hover:text-brand hover:pl-1 transition-all duration-200">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </MobileAccordion>
            </div>

            {/* ── Help Links ── */}
            <div className="lg:col-span-2">
              <MobileAccordion title="Need Help?">
                <ul className="space-y-3 text-[14px] text-gray-400">
                  {helpLinks.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="hover:text-brand hover:pl-1 transition-all duration-200">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </MobileAccordion>
            </div>

            {/* ── Policies ── */}
            <div className="lg:col-span-3">
              <MobileAccordion title="Our Policies">
                <ul className="space-y-3 text-[14px] text-gray-400">
                  {policyLinks.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="hover:text-brand hover:pl-1 transition-all duration-200">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Payment Icons */}
                <div className="mt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">We Accept</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking'].map((method) => (
                      <span
                        key={method}
                        className="px-2.5 py-1.5 bg-white/5 rounded-md text-[11px] text-gray-400 border border-white/10"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </MobileAccordion>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div className="border-t border-white/10 mt-10 lg:mt-14 pt-6 lg:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-[13px] text-gray-500">
                  © 2024–{currentYear} <span className="text-gray-400 font-medium">PrintDoot</span>. All rights reserved.
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Prices are exclusive of delivery charges and product customization options unless stated otherwise.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <span>🇮🇳</span>
                <span>Proudly Made in India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
