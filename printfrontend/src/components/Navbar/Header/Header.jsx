import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import SearchDropdown, { addRecentSearch } from "./SearchDropdown";
import SignInDropdown from "./SignInDropdown";
import AccountDropdown from "./AccountDropdown";
import NavBar from "./NavBar";
import userService from "../../../services/userService";
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

  const searchRef = useRef(null);

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
  }, [location.pathname]); // Re-check on route change

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rotate-45"></div>
          <span className="text-2xl sm:text-4xl font-bold text-gray-900">printdoot</span>
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
              <input
                type="text"
                value={desktopQuery}
                onChange={(e) => setDesktopQuery(e.target.value)}
                placeholder="Search products, categories…"
                onFocus={() => setShowSearch(true)}
                className="w-full border border-gray-200 rounded-full py-2.5 pl-5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 cursor-pointer"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.85-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
                </svg>
              </button>
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
        <nav className="hidden lg:flex items-center gap-5 font-medium text-[13px] text-gray-700 flex-shrink-0">
          <Link to="/help" className="flex items-center gap-1.5 group">
            <IoMdHelpCircleOutline className="text-lg text-gray-500 group-hover:text-black transition-colors" />
            <div className="border-b-2 border-transparent group-hover:border-gray-400 pb-0.5 transition-all">
              <p className="font-semibold text-gray-800 leading-tight">Help is here</p>
              <p className="text-[11px] text-gray-400">02522-669393</p>
            </div>
          </Link>

          <Link to="/account/designs" className="flex items-center gap-1.5 pb-0.5 border-b-2 border-transparent hover:border-gray-400 transition-all">
            <BsFolder2 className="text-base" />
            <span>My Projects</span>
          </Link>

          <Link to="/favorites" className="flex items-center gap-1.5 pb-0.5 border-b-2 border-transparent hover:border-gray-400 transition-all">
            <FaRegHeart className="text-base" />
            <span>My Favorites</span>
          </Link>

          {/* Sign In / Account */}
          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={() => setShowAccount(true)}
              onMouseLeave={() => setShowAccount(false)}
            >
              <Link to="/account" className="flex items-center gap-1.5 pb-0.5 border-b-2 border-transparent hover:border-gray-400 transition-all">
                <LuUserRound className="text-base" />
                <span>Hi, {username}</span>
              </Link>
              {showAccount && <AccountDropdown onLogout={handleLogout} />}
            </div>
          ) : (
            <div
              onMouseEnter={() => setShowSignIn(true)}
              onMouseLeave={() => setShowSignIn(false)}
              className="relative"
            >
              <Link to="/login" className="flex items-center gap-1.5 pb-0.5 border-b-2 border-transparent hover:border-gray-400 transition-all">
                <LuUserRound className="text-base" />
                <span>Sign in</span>
              </Link>
              {showSignIn && <SignInDropdown />}
            </div>
          )}

          <Link to="/cart" className="flex items-center gap-1.5 pb-0.5 border-b-2 border-transparent hover:border-gray-400 transition-all">
            <MdOutlineShoppingBag className="text-lg" />
            <span>Cart</span>
          </Link>
        </nav>

        {/* Mobile icons — Cart, Search, Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
            aria-label="Search"
          >
            <IoSearchOutline className="text-xl" />
          </button>
          <Link to="/cart" className="p-2 text-gray-600 hover:text-black transition-colors">
            <MdOutlineShoppingBag className="text-xl" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
            aria-label="Open menu"
          >
            <HiOutlineMenuAlt3 className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Mobile search bar — slides down */}
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
            <input
              type="text"
              name="mobile-search"
              placeholder="Search products…"
              autoFocus
              className="w-full border border-gray-200 rounded-full py-2.5 pl-5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <IoSearchOutline className="text-lg" />
            </button>
          </form>
        </div>
      )}

      {/* Desktop category nav bar */}
      <NavBar />

      {/* ── Mobile Slide-out Menu ── */}
      {/* Overlay */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="font-bold text-lg text-gray-900">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <IoMdClose className="text-2xl text-gray-600" />
          </button>
        </div>

        {/* User greeting */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Hi, {username}</p>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-xs text-blue-600 hover:underline">View Account</Link>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <LuUserRound className="text-xl text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sign in</p>
                <p className="text-xs text-gray-400">Access your account</p>
              </div>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="py-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
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

/* ── Helper: Mobile nav link ── */
function MobileNavLink({ to, icon, label, onClose }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors text-sm font-medium"
    >
      {icon && <span className="w-5 text-gray-400">{icon}</span>}
      {!icon && <span className="w-5" />}
      {label}
    </Link>
  );
}

