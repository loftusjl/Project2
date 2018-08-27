const Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config/config.json')[env];
var db = {};

if (config.use_env_variable) {
	var sequelize = new Sequelize(process.env[config.use_env_variable], {
		define: {
			charset: 'utf8',
			collate: 'utf8_general_ci'
		}
	});
} else {
	var sequelize = new Sequelize(
		process.env.DB_DATABASE,
		process.env.DB_USER,
		process.env.DB_PASS,
		config, {
			define: {
				charset: 'utf8',
				collate: 'utf8_general_ci'
			}
		}
	);
}
var db = require('../models');

module.exports = function (app) {
	// Get all products
	app.get('/api/products', function (req, res) {
		db.Product.findAll({}).then(dbProduct => res.json(dbProduct));
	});
	// Get all products under PAR
	app.get('/api/products/up', function (req, res) {
		sequelize.query('SELECT * FROM products WHERE prodOnHand < prodPAR').then(dbProduct => res.json(dbProduct));
	});
	// search a product by category
	app.get('/api/products/category/:category', function (req, res) {
		db.Product.findAll({
			where: {
				prodCategory: req.params.category
			}
		}).then(dbProduct => res.json(dbProduct));
	});
	// search a product by name
	app.get('/api/products/search/:name', function (req, res) {
		db.Product.findAll({
			where: {
				prodName: {
					$like: `%${req.params.name}%`
				}
			}
		}).then(dbProduct => res.json(dbProduct));
	});
	// employee pick list view. shows only the items being requested that have not been added to an order yet. (OrderId IS NULL)
	app.get('/api/employee/picklist', function (req, res) {
		sequelize.query('SELECT prodName,prodPAR, prodOnHand, olQuantity, olUnitofIssue FROM products, orderlines WHERE products.id = prodID AND OrderId IS NULL')
			.then(dbProduct => res.json(dbProduct));
	});
	// employee pick list view. shows only the items being requested that have not been added to an order yet. (OrderId IS NULL)
	app.get('/api/supervisor/picklist', function (req, res) {
		sequelize.query('SELECT prodName,prodPAR, prodOnHand, olQuantity, olUnitofIssue, prodPrice, SUM(prodPrice*olQuantity) AS Total FROM products, orderlines WHERE products.id = prodID AND OrderId IS NULL')
			.then(dbProduct => res.json(dbProduct));
	});
	// Create a new product
	app.post('/api/supervisor/products', function (req, res) {
		db.Product.create(req.body).then(dbProduct => res.json(dbProduct));
	});

	// Delete an product by id
	app.delete('/api/supervisor/products/:id', function (req, res) {
		db.Product.destroy({
			where: {
				id: req.params.id
			}
		}).then(dbProduct => res.json(dbProduct));
	});
	// Update product by id
	app.put('/api/products/:id', function (req, res) {
		sequelize.query('UPDATE products SET prodCategory=?,prodName=?,prodOnHand=?,prodPAR=?,prodPrice=?,prodPhoto=? WHERE id=?', 
			{replacements: [req.body.prodCategory, req.body.prodName, req.body.prodOnHand, req.body.prodPAR, req.body.prodPrice, req.body.prodPhoto, req.params.id]})
			.then(dbProduct => res.json(dbProduct));
	});
};
