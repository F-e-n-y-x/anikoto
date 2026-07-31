/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — pagination.helper.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Utility function to add pagination metadata to API responses.
 *   Provides standardized pagination info for all paginated endpoints.
 *
 * @exports
 *   addPaginationMeta
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

// ══════════════════════════════════════════════════════════════
// PAGINATION METADATA
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Pagination Metadata Generator ----
/**
 * Adds pagination metadata to a response object.
 *
 * @param {object} data - The data object containing `data` array and optionally `totalPages`
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} [itemsPerPage=30] - Number of items per page
 * @returns {object} Object with data and pagination metadata
 *
 * @example
 *   const response = addPaginationMeta({ data: [...], totalPages: 5 }, 1, 30);
 *   // response = {
 *   //   data: [...],
 *   //   pagination: {
 *   //     currentPage: 1,
 *   //     totalPages: 5,
 *   //     totalItems: 150,
 *   //     itemsPerPage: 30,
 *   //     hasNext: true,
 *   //     hasPrev: false
 *   //   }
 *   // }
 */
const addPaginationMeta = (data, currentPage, itemsPerPage = 30) => {
  const totalPages = data.totalPages || 1;
  const page = parseInt(currentPage) || 1;
  // NOTE: Only the last page can have a partial item count; every other
  // page is assumed full since the source site doesn't expose a real total.
  const lastPageItems = page >= totalPages ? (data.data?.length || 0) : itemsPerPage;
  const totalItems = data.data ? (totalPages - 1) * itemsPerPage + lastPageItems : 0;

  return {
    ...data,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: itemsPerPage,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export { addPaginationMeta };
// ══════════════════════════════════════════════════════════════ END: pagination.helper.js
