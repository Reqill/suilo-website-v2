const admin = require("firebase-admin");
const randomstring = require("randomstring");

// Private service account key
const serviceAccount = require("./permissions.json"); 

// Authorise Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// Assign database reference
const db = admin.firestore();


/*      ======== GENERAL UTIL FUNCTIONS ========      */


// general function for modifying the date-containing parameters of temp objects into formatted strings
function formatFirebaseTimestamps(dataObject, dateFormat) {
    for (fieldName of ["date", "modified"]) {
        if (!dataObject[fieldName])
        {
            // document does not contain the given field; skip it
            continue;
        }
        // cast field value as JS date object which has a built-in function to format it as a string
        date = new Date(dataObject[fieldName]._seconds * 1000);  // Date object constructor takes milliseconds
        // formatting using specified locale, default en-GB uses dd/mm/YYYY
        dataObject[fieldName] = date.toLocaleString(dateFormat || "en-GB");
    }
}


// general function for performing action on single document
function executeQuery(req, res, collectionName, onSuccessCallback) {
    // get id from url parameters or arguments, e.g. /api/news/foo or /api/news/?id=foo
    const id = req.params.id || req.query.id;
    // check if the id was provided in the query parameters
    if (id) {
        // initialise query
        const docRef = db.collection(collectionName).doc(id);
        // validation success; execute the given callback function
        onSuccessCallback(docRef);
    } else {
        // return an error if the query parameters do not contain the id of the document to be updated
        return res.status(400).json({ errorDescription: "400 Bad Request: No document ID specified." });
    }
}


// general function for generating a shortened URL
function sendGenerateURLResponse(res, destination) {
    // initialise the links collection reference
    const shortURLs = db.collection("links");

    // actually generate the URL pair and place it in the database
    function generate() {
        // generate new URLs until it finds one that hasn't been used yet
        while (true) {
            // generate alphanumeric string with length of 5 characters
            const randStr = randomstring.generate(7);
            // regenerate if the link is taken
            if (resolveShortURL(randStr).then((destination) => destination)) {
                continue;
            }
            // add the data to the database
            shortURLs.doc(randStr).set({
                destination
            });
            // return the shortened URL; breaks the while loop
            return randStr;
        }
    }
    // initialise query to check if there is already a short url for the given destination
    const checkIfAlreadyExistsQuery = shortURLs.where("destination" , "==", destination).limit(1);

    // determine if the URL should be generated, and if so, generate it
    checkIfAlreadyExistsQuery.get()
    .then((querySnapshot) => {
        // existing data found in the database
        if (querySnapshot.empty) {
            // existing data not found in the database; return newly-created shortened URL
            return res.status(200).json({ url: '/' + generate() });
        } else {
            // return the id of the document (i.e. short URL)
            return res.status(200).json({ url: '/' + querySnapshot.docs[0].id });
        }
    });
}

// general function for retrieving the destination URL of a shortened link
function resolveShortURL(shortURL) {
    // initialise link collection reference
    const shortURLs = db.collection("links");

    // define thenable function
    function resolve(resolve, reject) {
        // get the document with the specified ID
        shortURLs.doc(shortURL).get()
        .then((doc) => {
            // get the document data
            const data = doc.data();
            // check if the data has been retrieved successfully
            if (data) {
                // return the destination url
                resolve(data.destination);
            } else {
                // return false if the given short URL is not present in the database
                resolve(false);
            }
        });
    }
    // return a thenable object; usage is resolveShortURL(shortURL).then((destination) => {...})
    return { then: resolve }
}


/*      ======== GENERAL CRUD FUNCTIONS ========      */

// general function for creating a single document
function createSingleDocument(data, collectionName, res) {
    // attempts to add the data to the given collection
    db.collection(collectionName).add(data)
    .then((doc) => {
        // success; return the data along with the document id
        return res.status(200).json({ id: doc.id, ...data });
    }).catch((error) => {
        // return an error when the document could not be added, e.g. invalid collection name
        return res.status(500).json({ errorDescription: "500 Server Error: Could not create document.", error });
    });
}

// general function for sending back a single document
function sendSingleResponse(docQuery, res, dateFormat) {
    // send the query to database
    docQuery.get()
    .then((doc) => {    
        // check if the document was found
        const temp = doc.data();
        if (temp) {
            // formats all specified date fields as strings if they exist
            formatFirebaseTimestamps(temp, dateFormat);
            // send document id with rest of the data
            return res.status(200).json({ id: doc.id, ...temp });
        }  else {
            // return an error if the document was not found
            return res.status(404).json({ errorDescription: "404 Not Found: The requested document was not located." });
        }
    });
}

// general function for sending back a list of documents
function sendListResponse(docListQuery, res, { specialCase = "", startIndex = 0, dateFormat }) {
    // initialise response as an empty array
    const response = [];
    // send the query to database
    docListQuery.get()
    .then((querySnapshot) => {
        // loop through every document
        let index = 0;
        querySnapshot.forEach((doc) => {
            // increments index after evaluating it to see if it should be included in the response
            if (index++ >= startIndex) {
                // read the document
                const temp = doc.data();
                if (temp) {
                    // formats all specified date fields as strings if they exist
                    formatFirebaseTimestamps(temp, dateFormat);
                    response.push({ id: doc.id, ...temp });
                } else {
                    // return an error if any document was not found
                    // index has already been incremented so it is 1-based
                    return res.status(404).json({ errorDescription: `404 Not Found: Document ${index} was not located.` });
                }
            }
        });
        return res.status(200).json(response);    
    }).catch((error) => {
        return res.status(500).json({ errorDescription: "500 Server Error: Could not retrieve documents.", error });
    });
}

// general function for updating a single document
function updateSingleDocument(docQuery, res, requestParams, attributesToUpdate = []) {
    // initialise new data
    const newData = {
        // add parameter indicating when the news was last edited
        modified: admin.firestore.Timestamp.fromDate(new Date())
    };
    // initialise boolean to indicate if any parameters were updated
    let dataUpdated = false;
    // loop through each attribute that should be set
    attributesToUpdate.forEach((attrib) => {
        // check if object attribute is provided in the request query
        if (requestParams[attrib]) {
            // it is; assign parameter to object attributes
            newData[attrib] = requestParams[attrib];
            // mark data as updated
            dataUpdated = true;
        }
    });
    if (!dataUpdated) {
        // return an error if the query does not contain any new assignments
        return res.status(400).json({ errorDescription: "400 Bad Request: There were no updated fields provided." });
    } else {
        console.log(newData);
    }
    // send the query to database
    docQuery.update(newData)
    .then(() => {
        // return updated document on success

        // initialise parameters
        const dateFormat = requestParams.date_format || "en-GB";
        // send query to db
        sendSingleResponse(docQuery, res, dateFormat);
    }).catch((error) => {
        // return an error when the document was not found/could not be updated
        return res.status(400).json({ errorDescription: "400 Bad Request: Could not update document. It most likely does not exist.", error });
    });
}

// general function for deleting a single document
function deleteSingleDocument(docQuery, res) {
    docQuery.delete()
    .then(() => {
        // success deleting document
        // this may occur even if the document did not exist to begin with
        return res.status(200).json({ msg: `Success! Document with ID '${docQuery.id}' has been deleted.` });
    }).catch((error) => {
        return res.status(500).json({ errorDescription: "500 Server Error: The specified document could not be deleted.", error });
    });
}

module.exports = { 
    admin,
    db,
    executeQuery,
    sendGenerateURLResponse,
    resolveShortURL,
    createSingleDocument,
    sendSingleResponse,
    sendListResponse,
    updateSingleDocument,
    deleteSingleDocument
};
