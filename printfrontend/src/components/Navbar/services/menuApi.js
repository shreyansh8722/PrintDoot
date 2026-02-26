import catalogService from '../../../services/catalogService';

let menuCache = null;
let fetchingPromise = null;

export const fetchMenuData = async () => {
  // Return cached data if available
  if (menuCache) {
    return menuCache;
  }

  // If a fetch is already in progress, return the existing promise
  if (fetchingPromise) {
    return fetchingPromise;
  }

  // Start new fetch
  fetchingPromise = (async () => {
    try {
      // Fetch categories. 
      const categories = await catalogService.getCategories();

      // Transform backend categories to MegaMenu format
      const transformedMenu = categories.map(category => {
        const subcategories = category.subcategories || [];

        // Map Subcategories to Sections
        // Each Subcategory becomes a column (Section) in the MegaMenu
        // The items in the column are the Products belonging to that Subcategory

        const sections = subcategories.map(sub => {
          const products = sub.products || [];
          // Map Products to Links
          const productLinks = products.map(product => ({
            name: product.name,
            path: `/categories/${category.slug}/${product.slug}`, // Nested link preserving category context
            isNew: product.is_featured,
            image: product.primary_image,
            description: product.description,
            price: product.price
          }));

          return {
            title: sub.name,
            path: `/categories/${category.slug}?subcategory=${sub.slug}`, // Subcategory Link
            links: productLinks,
          };
        });

        // If no subcategories, provide a fallback
        if (sections.length === 0) {
          sections.push({
            title: "Browse",
            path: `/categories/${category.slug}`,
            links: [
              {
                name: `All ${category.name}`,
                path: `/categories/${category.slug}`,
                image: category.image
              }
            ]
          });
        }

        return {
          id: category.slug,
          label: category.name,
          sections: sections, // Now sections are actual subcategories
          footerLink: {
            label: `See all ${category.name}`,
            path: `/categories/${category.slug}`
          }
        };
      });

      menuCache = transformedMenu;
      return transformedMenu;
    } catch (error) {
      console.error("Error fetching menu data", error);
      return [];
    } finally {
      fetchingPromise = null;
    }
  })();

  return fetchingPromise;
};
