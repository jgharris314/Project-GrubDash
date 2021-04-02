// Initialization 
const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

//Helpers
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId)

    if(foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    next({status: 404,
        message: `Dish id does not exist: ${dishId}`})
}

function bodyIsValid(req, res, next) {
    const { data: {  name, description, price, image_url } = {} } = req.body;
    let message;

    if (!name || name === "") {
      message = "Dish must include a name";
    } else if (!description || description === "") {
      message = "Dish must include a description";
    } else if (!price) {
      message = "Dish must include a price";
    } else if (price <= 0 || !Number.isInteger(price)) {
      message = "Dish must have a price that is an integer greater than 0";
    } else if (!image_url || image_url === "") {
      message = "Dish must include a image_url";
    }

    if(message){
        return next({
            status: 400,
            message: message,
        });
    }
    next();
}

function validateBodyId(req, res, next){
    const { dishId } = req.params
    const { data : {id} = {} } = req.body

    if(!id || id === dishId) {
		res.locals.dishId = dishId;
		return next();
	}
	next({
		status: 400,
		message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
	});
}
// CRUDL 
function create(req, res){
    const {data: { name, description, price, image_url } = {} } = req.body

    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
}

function read(req, res){
    res.json({data: res.locals.dish })
}

function update(req, res){
    const {data: { name, description, price, image_url } = {} } = req.body

    const dishToUpdate = res.locals.dish

    dishToUpdate.name = name
    dishToUpdate.description = description
    dishToUpdate.price = price
    dishToUpdate.image_url = image_url
    res.json({data: dishToUpdate})
}

function list(req, res){
    res.json({data: dishes})
}



module.exports = {

    list,
    read: [dishExists, read],
    create: [bodyIsValid, create],
    update: [dishExists, bodyIsValid, validateBodyId, update]
}