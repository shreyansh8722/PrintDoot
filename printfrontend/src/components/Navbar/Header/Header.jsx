import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import SearchDropdown, { addRecentSearch } from "./SearchDropdown";
import AccountDropdown from "./AccountDropdown";
import SignInDropdown from "./SignInDropdown";
import NavBar from "./NavBar";
import userService from "../../../services/userService";
import logoImg from "../../../assets/logo.webp";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuth = () => {
    const isAuth = userService.isAuthenticated();
    setIsAuthenticated(isAuth);
    if (isAuth) {
      const storedUser = localStorage.getItem('username');
      const firstName = storedUser ? storedUser.split(' ')[0] : 'Account';
      setUsername(firstName);
    }
  };

  useEffect(() => { checkAuth(); }, [location.pathname]);

  useEffect(() => {
    setShowSearch(false);
    setShowAccount(false);
    setShowSignIn(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    userService.logout();
    setIsAuthenticated(false);
    setShowAccount(false);
    setUsername("");
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className={`bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

      {/* ─── Top Utility Bar ─── */}
      <div className="hidden lg:block bg-dark">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-8 text-[11px] tracking-wide text-white">
          <div className="flex items-center gap-5">
            <a href="tel:+917827303575" className="hover:text-white/70 transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              +91 78273-03575
            </a>
            <span className="w-px h-3 bg-gray-600" />
            <Link to="/help" className="hover:text-white/70 transition-colors">Help & Support</Link>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/track-order" className="hover:text-white/70 transition-colors">Track Order</Link>
            <span className="w-px h-3 bg-gray-600" />
            <Link to="/faq" className="hover:text-white/70 transition-colors">FAQ</Link>
          </div>
        </div>
      </div>

      {/* ─── Main Header Bar ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[64px] sm:h-[74px] gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0 group">
          <img
            src={logoImg}
            alt="PrintDoot.com"
            className="h-10 sm:h-12 lg:h-[50px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div ref={searchRef} className="relative w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = desktopQuery.trim();
                if (q) {
                  addRecentSearch(q);
                  navigate(`/search?q=${encodeURIComponent(q)}`);
                  setShowSearch(false);
                  setDesktopQuery("");
                }
              }}
              className="w-full"
            >
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input
                  type="text"
                  value={desktopQuery}
                  onChange={(e) => setDesktopQuery(e.target.value)}
                  placeholder="Search for products, gifts & more..."
                  onFocus={() => setShowSearch(true)}
                  className="w-full bg-gray-50/80 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-[13px] font-normal focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand/30 focus:border-brand/50 transition-all placeholder:text-gray-400"
                />
              </div>
            </form>
            {showSearch && (
              <SearchDropdown
                query={desktopQuery}
                onSelect={() => { setShowSearch(false); setDesktopQuery(""); }}
              />
            )}
          </div>
        </div>

        {/* Right Nav — Desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
          <HeaderIconBtn to="/account/designs" label="Projects">
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
          </HeaderIconBtn>

          <HeaderIconBtn to="/favorites" label="Wishlist">
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </HeaderIconBtn>

          {/* Account / Sign in */}
          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={() => setShowAccount(true)}
              onMouseLeave={() => setShowAccount(false)}
            >
              <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-black hover:text-brand group">
                <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-[12px] font-semibold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium hidden xl:block">{username}</span>
              </Link>
              {showAccount && <AccountDropdown onLogout={handleLogout} />}
            </div>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setShowSignIn(true)}
              onMouseLeave={() => setShowSignIn(false)}
            >
              <Link to="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-black hover:text-brand">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span className="text-[13px] font-medium">Sign In</span>
              </Link>
              {showSignIn && <SignInDropdown />}
            </div>
          )}

          <Link to="/cart" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-black hover:text-brand relative ml-1">
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            <span className="text-[13px] font-medium">Cart</span>
          </Link>
        </nav>

        {/* Mobile icons */}
        <div className="flex lg:hidden items-center gap-0.5">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-2.5 text-black hover:text-brand rounded-lg hover:bg-gray-50 transition-all"
            aria-label="Search"
          >
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </button>
          <Link to="/cart" className="p-2.5 text-black hover:text-brand rounded-lg hover:bg-gray-50 transition-all relative">
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2.5 text-black hover:text-brand rounded-lg hover:bg-gray-50 transition-all"
            aria-label="Open menu"
          >
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 animate-slideDown">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const query = formData.get('mobile-search')?.trim();
              if (query) {
                addRecentSearch(query);
                navigate(`/search?q=${encodeURIComponent(query)}`);
                setMobileSearchOpen(false);
              }
            }}
            className="relative"
          >
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              type="text"
              name="mobile-search"
              placeholder="Search products…"
              autoFocus
              className="w-full bg-gray-50/80 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand/50"
            />
          </form>
        </div>
      )}

      {/* Category Nav Bar */}
      <NavBar />

      {/* ─── Mobile Slide-out Menu ─── */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="font-semibold text-[15px] text-dark tracking-tight">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-dark text-[13px]">Hi, {username}</p>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-[11px] text-brand hover:underline font-medium">View Account</Link>
              </div>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-dark text-[13px]">Sign in</p>
                <p className="text-[11px] text-gray-400">Access your account</p>
              </div>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="py-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <MobileLink to="/view-all" label="Shop All Products" onClose={() => setMobileMenuOpen(false)}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
          </MobileLink>
          <MobileLink to="/account/designs" label="My Projects" onClose={() => setMobileMenuOpen(false)}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
          </MobileLink>
          <MobileLink to="/favorites" label="My Wishlist" onClose={() => setMobileMenuOpen(false)}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </MobileLink>
          <MobileLink to="/cart" label="Cart" onClose={() => setMobileMenuOpen(false)}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          </MobileLink>

          <div className="my-1.5 mx-5 border-t border-gray-100" />

          <MobileLink to="/account/orders" label="My Orders" onClose={() => setMobileMenuOpen(false)} />
          <MobileLink to="/account/addresses" label="My Addresses" onClose={() => setMobileMenuOpen(false)} />

          <div className="my-1.5 mx-5 border-t border-gray-100" />

          <MobileLink to="/help" label="Help & Support" onClose={() => setMobileMenuOpen(false)}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
          </MobileLink>
          <MobileLink to="/contact" label="Contact Us" onClose={() => setMobileMenuOpen(false)} />

          {isAuthenticated && (
            <>
              <div className="my-1.5 mx-5 border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-500 hover:bg-red-50/60 transition-colors text-[13px] font-medium"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ── Desktop icon + label button ── */
function HeaderIconBtn({ to, label, children }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-black hover:text-brand group">
      <span className="group-hover:text-brand transition-colors">{children}</span>
      <span className="text-[13px] font-medium hidden xl:block">{label}</span>
    </Link>
  );
}

/* ── Mobile nav link ── */
function MobileLink({ to, label, onClose, children }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:bg-gray-50 hover:text-dark transition-colors text-[13px] font-medium"
    >
      {children ? <span className="w-5 text-gray-400 flex-shrink-0">{children}</span> : <span className="w-5" />}
      {label}
    </Link>
  );
}
