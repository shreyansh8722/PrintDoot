import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { fetchMenuData } from "../services/menuApi.js";
import MegaMenu from "./MegaMenu";
import { NavBarSkeleton } from "../../Skeleton";
import { FaChevronDown } from "react-icons/fa";

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
    <nav className="w-full border-t border-gray-100">
      <div className="max-w-7xl mx-auto relative">
        <ul className="lg:flex hidden justify-center items-center px-4 font-semibold text-[14px]">
          {/* View All */}
          <li>
            <Link
              to="/view-all"
              className="block py-3 px-3 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50/50 whitespace-nowrap"
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
              {/* Dot separator */}
              <span className="text-gray-300 text-[6px] select-none">●</span>

              <Link
                to={`/categories/${item.id}`}
                className={`flex items-center gap-1.5 py-3 px-3 transition-all border-b-2 whitespace-nowrap ${activeId === item.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                onClick={() => setActiveId(null)}
              >
                {item.label}
                {item.sections && item.sections.length > 0 && (
                  <FaChevronDown className={`text-[8px] transition-transform duration-200 ${activeId === item.id ? 'rotate-180' : ''}`} />
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
