exports.checkForId = (objectId, next) =>{
    if(!objectId){
        return next(new AppError('No Product found with that ID', 404))
    }
}
