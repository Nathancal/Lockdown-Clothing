module.exports = fn => {
    //This function is called when a route is called to allow for the try catch to be processed.
    return(req, res, next) =>{
        //Calls function initially passed and executes all called then returns a promise. Catch method used
        //to catch promise if its an error when the async function returns
        fn(req, res, next).catch(next);
    }
}