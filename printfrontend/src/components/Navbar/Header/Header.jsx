import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import SearchDropdown, { addRecentSearch } from "./SearchDropdown";
import SignInDropdown from "./SignInDropdown";
import AccountDropdown from "./AccountDropdown";
import NavBar from "./NavBar";
import userService from "../../../services/userService";
import logoImg from "../../../assets/logo.jpeg";
import { BsFolder2 } from "react-icons/bs";
import { FaRegHeart } from "react-icons/fa";
import { MdOutlineShoppingBag } from "react-icons/md";
import { LuUserRound } from "react-icons/lu";
import { IoMdHelpCircleOutline, IoMdClose } from "react-icons/io";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);

  // Track scroll for subtle header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  const checkAuth = () => {
    const isAuth = userService.isAuthenticated();
    setIsAuthenticated(isAuth);
    if (isAuth) {
      const storedUser = localStorage.getItem('username');
      setUsername(storedUser || 'Account');
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  // Close dropdowns + mobile menu on route change
  useEffect(() => {
    setShowSearch(false);
    setShowSignIn(false);
    setShowAccount(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
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
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      {/* Top utility bar */}
      <div className="hidden lg:block bg-dark text-gray-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-9 text-[11px] font-medium">
          <div className="flex items-center gap-6">
            <a href="tel:02522669393" className="hover:text-brand transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              02522-669393
            </a>
            <Link to="/help" className="hover:text-brand transition-colors">Help & Support</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/track-order" className="hover:text-brand transition-colors">Track Order</Link>
            <Link to="/faq" className="hover:text-brand transition-colors">FAQ</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0 group">
          <img
            src={logoImg}
            alt="PrintDoot.com"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
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
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  value={desktopQuery}
                  onChange={(e) => setDesktopQuery(e.target.value)}
                  placeholder="Search products, categories…"
                  onFocus={() => setShowSearch(true)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
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
        <nav className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <NavIconLink to="/account/designs" icon={<BsFolder2 className="text-[22px]" />} label="Projects" />
          <NavIconLink to="/favorites" icon={<FaRegHeart className="text-[20px]" />} label="Favorites" />

          {/* Sign In / Account */}
          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={() => setShowAccount(true)}
              onMouseLeave={() => setShowAccount(false)}
            >
              <Link to="/account" className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900 group">
                <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-medium tracking-wide">{username.length > 8 ? username.slice(0, 8) + '…' : username}</span>
              </Link>
              {showAccount && <AccountDropdown onLogout={handleLogout} />}
            </div>
          ) : (
            <div
              onMouseEnter={() => setShowSignIn(true)}
              onMouseLeave={() => setShowSignIn(false)}
              className="relative"
            >
              <Link to="/login" className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900">
                <LuUserRound className="text-[22px]" />
                <span className="text-[11px] font-semibold tracking-wide">Sign in</span>
              </Link>
              {showSignIn && <SignInDropdown />}
            </div>
          )}

          <Link to="/cart" className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900 relative">
            <MdOutlineShoppingBag className="text-[22px]" />
            <span className="text-[11px] font-semibold tracking-wide">Cart</span>
          </Link>
        </nav>

        {/* Mobile icons */}
        <div className="flex lg:hidden items-center gap-1">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-2.5 text-gray-600 hover:text-dark rounded-lg hover:bg-gray-50 transition-all"
            aria-label="Search"
          >
            <IoSearchOutline className="text-xl" />
          </button>
          <Link to="/cart" className="p-2.5 text-gray-600 hover:text-dark rounded-lg hover:bg-gray-50 transition-all relative">
            <MdOutlineShoppingBag className="text-xl" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2.5 text-gray-600 hover:text-dark rounded-lg hover:bg-gray-50 transition-all"
            aria-label="Open menu"
          >
            <HiOutlineMenuAlt3 className="text-2xl" />
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
            <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              name="mobile-search"
              placeholder="Search products…"
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </form>
        </div>
      )}

      {/* Desktop category nav bar */}
      <NavBar />

      {/* ── Mobile Slide-out Menu ── */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[320px] max-w-[85vw] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Close header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="font-bold text-lg text-dark">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <IoMdClose className="text-xl text-gray-600" />
          </button>
        </div>

        {/* User greeting */}
        <div className="px-5 py-4 bg-gradient-to-br from-brand-50/60 to-gray-50 border-b border-gray-100">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-brand rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-dark">Hi, {username}</p>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-xs text-brand hover:underline font-medium">View Account</Link>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center">
                <LuUserRound className="text-xl text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-dark">Sign in</p>
                <p className="text-xs text-gray-400">Access your account</p>
              </div>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="py-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <MobileNavLink to="/view-all" icon={<MdOutlineShoppingBag className="text-lg" />} label="Shop All Products" onClose={() => setMobileMenuOpen(false)} />
          <MobileNavLink to="/account/designs" icon={<BsFolder2 className="text-lg" />} label="My Projects" onClose={() => setMobileMenuOpen(false)} />
          <MobileNavLink to="/favorites" icon={<FaRegHeart className="text-lg" />} label="My Favorites" onClose={() => setMobileMenuOpen(false)} />
          <MobileNavLink to="/cart" icon={<MdOutlineShoppingBag className="text-lg" />} label="Cart" onClose={() => setMobileMenuOpen(false)} />

          <div className="my-2 mx-5 border-t border-gray-100" />

          <MobileNavLink to="/account/orders" icon={null} label="My Orders" onClose={() => setMobileMenuOpen(false)} />
          <MobileNavLink to="/account/addresses" icon={null} label="My Addresses" onClose={() => setMobileMenuOpen(false)} />

          <div className="my-2 mx-5 border-t border-gray-100" />

          <MobileNavLink to="/help" icon={<IoMdHelpCircleOutline className="text-lg" />} label="Help & Support" onClose={() => setMobileMenuOpen(false)} />
          <MobileNavLink to="/contact" icon={null} label="Contact Us" onClose={() => setMobileMenuOpen(false)} />

          {isAuthenticated && (
            <>
              <div className="my-2 mx-5 border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-red-600 hover:bg-red-50 transition-colors text-sm font-medium rounded-lg mx-2"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ── Helper: Desktop nav icon button ── */
function NavIconLink({ to, icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-dark">
      {icon}
      <span className="text-[11px] font-semibold tracking-wide">{label}</span>
    </Link>
  );
}

/* ── Helper: Mobile nav link ── */
function MobileNavLink({ to, icon, label, onClose }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-brand-50/40 hover:text-dark transition-colors text-sm font-medium"
    >
      {icon && <span className="w-5 text-gray-400">{icon}</span>}
      {!icon && <span className="w-5" />}
      {label}
    </Link>
  );
}
