/**
 * Pagination Utility
 * Provides consistent pagination across all list endpoints
 */

/**
 * Paginate a Mongoose query
 * @param {Model} model - Mongoose model
 * @param {Object} query - Query filter
 * @param {Object} options - Pagination options
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
const paginate = async (model, query = {}, options = {}) => {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(options.limit) || 20), 100); // Max 100
    const skip = (page - 1) * limit;
    const sort = options.sort || { createdAt: -1 };
    const select = options.select || '';
    const populate = options.populate || '';

    const [data, total] = await Promise.all([
        model.find(query)
            .select(select)
            .populate(populate)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        model.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages,
            hasNext: page < pages,
            hasPrev: page > 1
        }
    };
};

/**
 * Parse pagination params from request query
 * @param {Object} query - Express req.query
 * @returns {Object} Pagination options
 */
const getPaginationParams = (query) => ({
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 20,
    sort: query.sortBy ? { [query.sortBy]: query.order === 'asc' ? 1 : -1 } : { createdAt: -1 }
});

/**
 * Apply pagination to an existing Mongoose query
 * @param {Query} query - Mongoose query
 * @param {Object} options - Pagination options
 * @returns {Query} Paginated query
 */
const applyPagination = (query, options = {}) => {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(options.limit) || 20), 100);
    const skip = (page - 1) * limit;

    return query.skip(skip).limit(limit);
};

module.exports = {
    paginate,
    getPaginationParams,
    applyPagination
};
