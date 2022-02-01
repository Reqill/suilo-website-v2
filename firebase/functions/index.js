// General imports
const express = require("express");
const cors = require("cors");

// Firebase imports
const functions = require("firebase-functions");

// Local imports
const {
  db,
  HTTP,
  getDocRef,
  sendSingleResponse,
  sendListResponse,
  deleteSingleDocument,
} = require("./util");
const luckyNumbersRoute = require("./routes/luckyNumbers");
const newsRoute = require("./routes/news");
const linksRoute = require("./routes/links");
const calendarRoute = require("./routes/calendar");
const eventsRoute = require("./routes/events");
const authMiddleware = require("./authMiddleware");

// initialise express
const app = express();

// default CORS options:
/* {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
} */
app.use(cors());

// uncomment to enable token verification (doesn't work when tested?)
// use authentication middleware for individual HTTP methods
//*
app.get("*", authMiddleware("any"));
app.put("*", authMiddleware("edit"));
app.post("*", authMiddleware("admin"));
app.delete("*", authMiddleware("admin"));
//*/

// set individual API routes
app.use("/api/luckyNumbers/", luckyNumbersRoute);
app.use("/api/news/", newsRoute);
app.use("/api/links/", linksRoute);
app.use("/api/calendar/", calendarRoute);
app.use("/api/events/", eventsRoute);

// define server region name for Firebase app
const SERVER_REGION = "europe-west1";

// define the routes that the API is able to serve
const definedRoutes = ["luckyNumbers", "news", "links", "calendar", "events"];

// define sort options for sending list responses
const sortOptions = {
  events: ["date", "asc"],
  links: ["destination", "asc"],
  news: ["date", "desc"],
};
// define routes that have similar structures
for (const endpoint of ["events", "links", "news"]) {
  app
    // READ all events/links/news
    .get(`/api/${endpoint}/`, (req, res) => {
      // ?page=1&items=25&all=false
      const docListQuery = db
        .collection(endpoint)
        .orderBy(...sortOptions[endpoint]);
      sendListResponse(docListQuery, req.query, res);
    })

    // READ single event/link/news
    .get(`/api/${endpoint}/:id`, (req, res) => {
      getDocRef(req, res, endpoint).then((docRef) =>
        sendSingleResponse(docRef, res)
      );
    })

    // DELETE single event/link/news
    .delete(`/api/${endpoint}/:id`, (req, res) => {
      getDocRef(req, res, endpoint).then((docRef) =>
        deleteSingleDocument(docRef, res)
      );
    });
}

for (const route of definedRoutes) {
  // catch all requests to paths that are listed above but use the incorrect HTTP method
  for (const pathSuffix of ["/", "/:foo/"]) {
    app.all("/api/" + route + pathSuffix, (req, res) => {
      return res.status(405).json({
        errorDescription: `${HTTP.err405}Cannot ${req.method} '${req.path}'.`,
      });
    });
  }
}

// catch all requests to paths that are not listed above
app.all("*", (req, res) => {
  return res.status(404).json({
    errorDescription: `${HTTP.err404}The server could not locate the resource at '${req.path}'.`,
  });
});

exports.app = functions.region(SERVER_REGION).https.onRequest(app);
