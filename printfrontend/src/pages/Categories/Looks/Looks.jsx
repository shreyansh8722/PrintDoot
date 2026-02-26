import React from 'react';

const ImageGrid = () => {
  const imageUrls = [
    { title: "Embroidered Polo", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Category%20Images/Men_s-Embroidered-Polo-T-Shirt_Category-image_1x1" },
    { title: "Cotton T-Shirt", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Category%20Images/Men_s-Cotton-T-Shirts_Category-image_1x1" },
    { title: "Casual Shirt", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Category%20Images/Men_s-Casual-Shirts_Category-image_1x1" },
    { title: "Formal Shirt", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Category%20Images/Men_s-Formal-Shirts_Category-image_1x1" },
  ];

  return (
    <div className="bg-white">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Love your new look
        </h2>
        <p className="mt-2 text-gray-500">Explore our exclusive custom clothing collection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {imageUrls.map((item, index) => (
          <div key={index} className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500">
            <img
              src={item.url}
              alt={item.title}
              className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=${encodeURIComponent(item.title)}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <span className="text-white font-bold text-lg">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;