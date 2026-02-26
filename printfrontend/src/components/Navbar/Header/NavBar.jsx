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

  // Fetch menu once
  useEffect(() => {
    fetchMenuData()
      .then(setMenu)
      .finally(() => setLoading(false));
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setActiveId(null);
  }, [location.pathname]);

  // Show skeleton while loading — reserves exact layout space
  if (loading) {
    return (
      <nav className="max-w-[1800px] w-full relative">
        <NavBarSkeleton />
      </nav>
    );
  }

  return (
    <nav className="max-w-[1800px] w-full relative">
      <ul className="max-w-[1800px] mx-auto px-6 lg:flex hidden justify-between items-center gap-6 font-semibold text-[14px]">
        {/* Static View All Link */}
        <li className="py-3 cursor-pointer text-center hover:text-cyan-600 transition-colors">
          <Link to="/view-all">View All</Link>
        </li>

        {menu.map((item) => (
          <li
            key={item.id}
            onMouseEnter={() => setActiveId(item.id)}
            onMouseLeave={() => setActiveId(null)}
            className="py-3 cursor-pointer text-center"
          >
            <Link
              to={`/categories/${item.id}`}
              className="hover:text-cyan-600 transition-colors block"
              onClick={() => setActiveId(null)}
            >
              {item.label}
            </Link>

            {activeId === item.id && (
              <MegaMenu sections={item.sections} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;
