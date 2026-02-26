import React from 'react';
import { Link, useParams } from 'react-router-dom';

const Breadcrumb = () => {
  const { category } = useParams();

  return (
    <div className="bg-white p-8 font-sans">
      <div className="flex items-center space-x-2">
        <Link to="/" className="text-gray-600 hover:text-black transition-colors duration-200">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        {category ? (
          <>
            <Link to="/view-all" className="text-gray-600 hover:text-black transition-colors duration-200">
              View All
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{category}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">View All</span>
        )}
      </div>
    </div>
  );
};

export default Breadcrumb;