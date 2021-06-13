# MongoLogger

MongoLogger  was created after an immense amount of frustration using Winston to log requests and errors to MongoDB. Nothing was formatted the way I wanted it to be so I created MongoLogger.

## Example Log

An example of a logged document with all features enabled can be found [here](/ExampleLog.md)

## Getting Started

Run `npm i express-mongo-logger`

```js
var mongoLogger = require("../Index.js");
var express = require("express");
var app = express();

app.use(
	mongoLogger({
		mongoConnectionString: "mongodb://<User>:<Password>@<Host>:<Port>/><Database>"
	})
);

app.get("/", async function (req, res, next) {
	res.send(`Hello World!`);
});

app.get("/404", async function (req, res, next) {
	res.status(404).send(`The requested resource cannot be found!`);
});
```
By default all requests will be logged. It is **highly** recommended to define `minStatusCode:400` to only log errors.

## Configuration Parameters

```js
{
    mongoConnectionString: null, //MongoDB connection String
    minStatusCode: 200, //Minimum statuscode to log
    excludeHeadersParams: ["Authorization"], //Headers to remove in logs
    excludeBodyParams: null, //Body parameters to avoid logging (you should include all password fields at a minimum)
    excludeRouteParams: null, //Route parameters to avoid logging
    excludeQueryParams: null, //Query parameters to avoid logging
    exludeRequestTypes: ["OPTIONS"], //HTTP methods to not log
    includeFullRequest: true, //Include the full request object in log
    includeFullResponse: true, //Include the full response object in log
    extraTopLevelPropsRequest: [], //Add properties from req to the root of the document
    extraTopLevelPropsResponse: [], //Add properties from res to the root of the document
    normalCollection: "Log", //Collection to store all log events
    errorCollection: "ErrorLog", //Collection to store errors
    requestTime: true, // Log request time
    requestTime_nanoSeconds: false, //Use nanoseconds for requesttime instead of miliseconds
    returnError: true, // Send 500 status and response to client
}
```