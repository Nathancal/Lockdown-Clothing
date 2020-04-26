exports.checkStrings = (queryReq, query) =>{
    //Sorting
    if(queryReq.sort){
        const sortBy = queryReq.sort.split(',').join(' ');
        console.log(sortBy);
        query = query.sort(sortBy);
    }

    //Field limiting
    if(queryReq.fields){
        const fields = queryReq.fields.split(',').join(' ');
        query = query.select(fields)
    }else{
        query = query.select('-__v');
    }

    return query
}