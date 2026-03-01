import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonImage } from "../../Skeleton";

const MegaMenu = ({ sections }) => {
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <div className="absolute left-0 top-full w-full bg-white border-t shadow-lg z-50 animate-slideDown">
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8 text-[13px]">

        {/* Links Grid */}
        <div className="grid grid-cols-4 gap-8 flex-1">
          {sections.map((section, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-3 text-gray-900">
                {section.path ? (
                  <Link to={section.path} className="hover:text-blue-600 transition-colors">
                    {section.title}
                  </Link>
                ) : (
                  section.title
                )}
              </h4>
              <ul className="space-y-2 text-gray-600">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      to={link.path}
                      className="block hover:text-black transition-colors"
                      onMouseEnter={() => setHoveredLink(link)}
                    >
                      {link.name}
                      {link.isNew && (
                        <span className="ml-2 text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded-full font-bold">
                          NEW
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Hover Preview with skeleton image */}
        {hoveredLink && (
          <div className="w-64 hidden lg:flex flex-col bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="aspect-square bg-white rounded-md mb-3 overflow-hidden relative border border-gray-100">
              {hoveredLink.image ? (
                <SkeletonImage
                  src={hoveredLink.image}
                  alt={hoveredLink.name}
                  className="w-full h-full object-contain p-2"
                  containerClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl text-gray-300">📷</span>
                </div>
              )}
            </div>

            <p className="font-bold text-gray-900 text-sm line-clamp-2">{hoveredLink.name}</p>

            <p className="text-xs text-gray-500 mt-1 line-clamp-3">
              {hoveredLink.description || "Customize this product to your needs."}
            </p>

            <Link to={hoveredLink.path} className="mt-auto block text-center text-xs font-semibold text-blue-600 hover:text-blue-800 pt-3">
              Customize Now &rarr;
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default memo(MegaMenu);

