var mongoLogger = require("../src/Index.js");
var express = require("express");
var app = express();

app.use(
	mongoLogger({
		minStatusCode: 400,
		mongoConnectionString:
			"mongodb://admin:Z2d3*mNs##Yy@172.104.192.106:49376/test?authSource=test&readPreference=primary&appname=MongoDB%20Compass&ssl=false",
	})
);

//NO FAVICON FOR YOU!
app.get("/favicon.ico", async function (req, res, next) {
	res.status(404).send("Not found");
});

//RETURN A RESPONSE WITH A CERTAIN STATUS CODE
app.get("/:statusCode", async function (req, res, next) {
	if (req.params.statusCode >= 500) {
		app.thisDoesntExistAndWillThrowAnError();
	}
	res
		.status(req.params.statusCode)
		.send(`HTTP Status Code is : ${req.params.statusCode}`);
});

console.log("Express on http://localhost:3912/200");

app.listen(3912);
