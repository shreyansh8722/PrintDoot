export const heroDataSecondary = [
    {
        id: 3,
        title: "Wear Your Brand With Pride",
        subtitle: "Starting at ₹550.00",
        image: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_960/India%20LOB/NVHP/New%20Home%20Page/Production/3rd%20Feb%202025/IN_Polo_PrintedT-Shirts_Marquee_01_1",
        buttons: [
            { label: "Custom Polo Tshirt", link: "/search?q=polo+tshirt" },
            { label: "Custom Tshirt", link: "/search?q=custom+tshirt" }
        ]
    },
    {
        id: 4,
        title: "My Name, My Pride",
        subtitle: "100 visiting card at RS 100",
        image: "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,w_960/India%20LOB/NVHP/New%20Home%20Page/Testing/Static%20Page/IN_Visiting-card_GK-Fashions_Marquee_01_1",
        buttons: [
            { label: "Shop Now", link: "/search?q=visiting+cards", primary: true }
        ]
    }
];

/* Static Products — full detail for frontend-only items / API fallback */
export const staticProducts = {
    "personalized-pen": {
        id: 131,
        slug: "personalized-pen",
        title: "Personalized Pen With Name, Customized Parker Classic Gold Trim Ball Pen With Name Engraved On It A Gift For Teacher, Professor, Sir And Madam On Teacher Day",
        price: "₹499.00",
        originalPrice: "₹799.00",
        discount: "38% off",
        subcategory_name: "Personalized Gifts",
        description: "Elevate your writing experience with this premium Customized Parker Classic Gold Trim Ball Pen. Expertly crafted from stainless steel with a luxurious gold finish, this pen combines elegance with functionality. Get your name beautifully engraved on the pen body for a truly personal touch.",
        images: [
            "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80",
            "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80",
            "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
            "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=800&q=80"
        ],
        image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80",
        href: "/product/personalized-pen",
        rating: { value: 4.5, count: 128 },
        attributes: [
            {
                name: "customization",
                display_name: "Customisations",
                values: [{ value: "1 text input", display_value: "1 Text Input (Name Engraving)" }]
            }
        ],
        specifications: [
            { label: "Brand", value: "printdoot.com" },
            { label: "Writing Instrument Form", value: "Ballpoint Pen" },
            { label: "Colour", value: "Gold" },
            { label: "Ink Colour", value: "Blue" },
            { label: "Material", value: "Stainless Steel" },
            { label: "Age Range", value: "Adult" },
            { label: "Customisations", value: "1 text input" },
        ],
        aboutItems: [
            "Body Color : Gold, Ink Color : Blue, Material : Stainless Steel",
            "Package Contains: 1 Personalized Name Pen with Metal Box.",
            "Gifts for Dad / Grandfather / Husband / Friend / Teacher / Doctor / Brother / Father / Mother / Boyfriend.",
            "Perfect Gift Option — The pen comes in a beautiful presentation box, making it the ideal gift for formal or informal use, workplace or personal.",
            "Best Gifts for any Occasion: Valentine's Day, Mother's Day, Father's Day, Raksha Bandhan, Friendship Day, Teacher's Day, Children's Day, Birthday, Anniversary, Wedding, Christmas, New Year's, Thanksgiving, Diwali, Business gifts and Family gifts."
        ],
        reviews: [
            { id: 1, rating: 5, title: "Amazing quality!", comment: "The engraving is very clean and the pen writes smoothly. Perfect gift for my teacher.", user_name: "Rahul S.", created_at: "2025-12-15", is_verified_purchase: true, helpful_count: 12 },
            { id: 2, rating: 4, title: "Great presentation", comment: "The metal box packaging makes it look very premium. Slight delay in delivery but worth the wait.", user_name: "Priya M.", created_at: "2025-11-28", is_verified_purchase: true, helpful_count: 8 },
            { id: 3, rating: 5, title: "Perfect gift", comment: "Bought this for my dad's birthday. He loved it! The gold finish is elegant.", user_name: "Amit K.", created_at: "2025-10-10", is_verified_purchase: true, helpful_count: 15 },
        ]
    }
};
