import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import logoImg from '../../assets/logo.jpeg';

const Footer = () => {
  const footerData = {
    help: [
      { label: "My Account", to: "/account" },
      { label: "Contact us", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Bulk Order Inquiry", to: "/contact" },
    ],
    policies: [
      { label: "Terms and Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "Refund & Return Policy", to: "/refund-policy" },
    ],
  };

  return (
    <footer className="w-full font-sans border-t border-gray-200">
      {/* Top Section - Dark Brand Background */}
      <div className="bg-dark text-white py-14">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Logo & Tagline */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/">
              <img src={logoImg} alt="PrintDoot.com" className="h-10 w-auto brightness-0 invert object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Premium custom printing & personalized gifts. Fast delivery across India.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand hover:text-white transition-all duration-300" aria-label="Twitter"><RiTwitterXFill className="text-sm" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand hover:text-white transition-all duration-300" aria-label="Facebook"><FaFacebookF className="text-sm" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand hover:text-white transition-all duration-300" aria-label="Instagram"><FaInstagram className="text-sm" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand hover:text-white transition-all duration-300" aria-label="YouTube"><FaYoutube className="text-sm" /></a>
            </div>
          </div>

          {/* Column 2: Easy Returns */}
          <div className="space-y-6">
            <p className="text-lg font-semibold leading-tight">
              Easy Returns: <Link to="/refund-policy" className="underline decoration-1 underline-offset-4 hover:text-brand transition-all">Free Replacement or Full Refund</Link>
            </p>
            <div className="hidden lg:block border-b border-gray-600 w-3/4"></div>
          </div>

          {/* Column 3: Let us help */}
          <div>
            <h3 className="text-base font-bold mb-5 text-brand-200">Let us help</h3>
            <ul className="space-y-3.5 text-[15px] text-gray-300">
              {footerData.help.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Our policies */}
          <div>
            <h3 className="text-base font-bold mb-5 text-brand-200">Our policies</h3>
            <ul className="space-y-3.5 text-[15px] text-gray-300">
              {footerData.policies.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[#111a27] text-gray-400 py-8">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">

          {/* Left: Contact and Legal */}
          <div className="space-y-2">
            <a href="tel:02522669393" className="text-[15px] font-medium text-brand hover:text-brand-300 transition-colors">02522-669393</a>
            <p className="text-[13px] leading-relaxed">
              © 2024–{new Date().getFullYear()} PrintDoot. All rights reserved.
            </p>
            <p className="text-[13px] opacity-80">
              Unless stated otherwise, prices are exclusive of delivery and product options.
            </p>
          </div>

          {/* Center: Payment Icons */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-2 py-1 rounded-md w-14 h-9 flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="max-h-6" />
            </div>
            <div className="bg-white px-2 py-1 rounded-md w-14 h-9 flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="max-h-3" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;