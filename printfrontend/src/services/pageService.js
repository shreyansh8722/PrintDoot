import apiHook from './apiConfig';

const pageService = {
    /**
     * Get all published legal pages (list — no content)
     */
    async getAllPages() {
        const response = await apiHook.get('/pages/');
        return response.data;
    },

    /**
     * Get a single legal page by slug (includes full content)
     */
    async getPageBySlug(slug) {
        const response = await apiHook.get(`/pages/${slug}/`);
        return response.data;
    },

    /**
     * Get a page by its type (privacy, terms, etc.)
     * Fetches all pages and filters by type
     */
    async getPageByType(type) {
        const pages = await this.getAllPages();
        const match = pages.find(p => p.page_type === type);
        if (match) {
            return this.getPageBySlug(match.slug);
        }
        return null;
    }
};

export default pageService;
