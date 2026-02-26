import React from 'react';

const PackagingNeeds = () => {
  const packagingImages = [
    { id: 1, title: "Packaging Labels", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/marketing%20Materials/Labels%20and%20Stickers/Product%20and%20Packaging%20Labels/IN_Product-and-Packaging-Labels_Overview" },
    { id: 2, title: "QR Code Stickers", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/label%20and%20sticker/QR%20Code%20Sticker%20Revised/IN_QR-Code-Stickers_Overview" },
    { id: 3, title: "Auto Lock Boxes", url: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_450/India%20LOB/Packaging%20Materials/Auto%20Lock%20Boxes/IN_Auto-Lock-Boxes_Overview" },
    { id: 4, title: "Custom Tape", url: "https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=Custom+Tape" },
  ];

  return (
    <div className="bg-white">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Packaging Needs
        </h2>
        <p className="mt-2 text-gray-500">Professional shipping and labeling solutions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packagingImages.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(item.title)}`;
                }}
              />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">{item.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackagingNeeds;