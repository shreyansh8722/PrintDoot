import React from 'react';

const MadeByYouPage = () => {
  const products = [
    { id: 1, title: "Photo Album", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Photo%20Gifts/Photo%20Albums/IN_Photo-album_Overview", rating: 4.5 },
    { id: 2, title: "Engraved Pen", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Pens/Personalised%20Pens/IN_Personalised-Pens_Overview", rating: 4.2 },
    { id: 3, title: "Notebook", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Category%20Images/Stationery/Personalised-notebooks_Stationery_Category-image_1x1", rating: 4.7 },
    { id: 4, title: "2025 Diary", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/All%20Product/Discover%20More/Calendars", rating: 4.8 },
  ];

  return (
    <div className="bg-white">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Made by You
        </h2>
        <p className="mt-2 text-gray-500">Unique products customized with your personal touch</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
              <img
                src={product.url}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(product.title)}`;
                }}
              />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">{product.title}</h3>
            <div className="flex justify-center items-center mt-1 gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium text-gray-600">{product.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MadeByYouPage;