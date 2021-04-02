// Initialization 
const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// Helpers
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId)

    if(foundOrder) {
        res.locals.order = foundOrder;
        next();
    }
    next({
        status: 404,
        message: `Order id does not exist: ${orderId}`
    })
}

function validateDestroy(req, res, next) {
    const {orderId} = req.params

    if(res.locals.order.status !== "pending"){
        return next({
            status: 400,
            message: `Cannot cancel order ${orderId}. Order must be pending`
        })
    }
    next();
}

function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  let message;

  if (!deliverTo || deliverTo === "") {
    message = "Order must include a deliverTo";
  } else if (!mobileNumber || mobileNumber === "") {
    message = "Order must include a mobileNumber";
  } else if (!dishes) {
    message = "Order must include a dish";
  } else if (!Array.isArray(dishes) || dishes.length < 1) {
    message = "dishes cannot be empty";
  } else {
    if (dishes) {
      dishes.forEach((dish) => {
        if (
          !dish.quantity ||
          dish.quantity <= 0 ||
          !Number.isInteger(dish.quantity)
        ) {
          message = `Dish ${dishes.indexOf(
            dish
          )} must have a quantity that is an integer greater than 0`;
        }
      });
    }
  }

  if (message) {
    next({
      status: 400,
      message: message,
    });
  }
  next();
}

function validateStatus(req, res, next){
    const { orderId } = req.params
    const { data: {id, status } = {} } = req.body;

    if(id && orderId !== id){
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id} Route: ${orderId}`
        })
    }

    if(!status || status === "invalid"){
        return next({
            status: 400,
            message: "A pending status is required to update an order."
        })
    }
    next();
}

//CRUDL
function create(req, res) {
    const {data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status ? status : "pending",
        dishes: dishes,
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}

function read(req, res) {
    res.json({data: res.locals.order})
}

function update(req, res){
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

	res.locals.order = {
		id: res.locals.order.id,
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
		status: status,
	}

	res.json({ data: res.locals.order });
}

function destroy(req, res) {
    const { orderId } = req.params;
    orders.filter(order => order.id === orderId)
    res.sendStatus(204)
}

function list(req, res){
    res.json({data: orders})
}

module.exports = {

    list,
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, validateStatus, update],
    delete: [orderExists, validateDestroy, destroy]
}