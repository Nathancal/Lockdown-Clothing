exports.paginate = async (queryReq, query, obj) => {

    const page = queryReq.page * 1 || 1;
    const limit = queryReq.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (queryReq.page) {
        //If the number of documents that we skip is greater than the number there is then
        //it does not exist
        const numObj = await obj.countDocuments();
        if (skip > numObj) {
            throw new Error('This page does not exist');
        }
    }


    return query
}
