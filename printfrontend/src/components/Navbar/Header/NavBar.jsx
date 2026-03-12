import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { fetchMenuData } from "../services/menuApi.js";
import MegaMenu from "./MegaMenu";
import { NavBarSkeleton } from "../../Skeleton";

const NavBar = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchMenuData()
      .then(setMenu)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveId(null);
  }, [location.pathname]);

  if (loading) {
    return (
      <nav className="max-w-7xl mx-auto w-full relative border-t border-gray-100">
        <NavBarSkeleton />
      </nav>
    );
  }

  return (
    <nav className="w-full border-t border-gray-100/80 bg-white">
      <div className="max-w-7xl mx-auto relative">
        <ul className="lg:flex hidden justify-center items-center px-4 text-[13px] font-medium tracking-wide">
          {/* View All */}
          <li>
            <Link
              to="/view-all"
              className="block py-3 px-4 text-black hover:text-brand transition-colors whitespace-nowrap"
            >
              View All
            </Link>
          </li>

          {menu.map((item) => (
            <li
              key={item.id}
              onMouseEnter={() => setActiveId(item.id)}
              onMouseLeave={() => setActiveId(null)}
              className="static flex items-center"
            >
              {/* Subtle separator */}
              <span className="text-gray-200 text-[4px] select-none mx-0.5">•</span>

              <Link
                to={`/categories/${item.id}`}
                className={`flex items-center gap-1 py-3 px-3.5 transition-all border-b-2 whitespace-nowrap ${activeId === item.id
                  ? 'text-brand border-brand font-semibold'
                  : 'text-black border-transparent hover:text-brand'
                  }`}
                onClick={() => setActiveId(null)}
              >
                {item.label}
                {item.sections && item.sections.length > 0 && (
                  <svg className={`w-2.5 h-2.5 ml-0.5 transition-transform duration-200 ${activeId === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                )}
              </Link>

              {activeId === item.id && (
                <MegaMenu sections={item.sections} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
