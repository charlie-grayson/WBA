// Codehooks for emailtemplates
function beforeGET(req, res){
// database logic to ensure only the holder of the master API key is able to GET
// the email templates

    var apikey = req.hint['#headers']["x-apikey"];

    if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
        res.end();
    }
    else {
            // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            res.end();
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to GET email templates"}});
        }
    }

}

function beforePOST(req, res){
// database logic to ensure only the holder of the master API key is able to POST
// the email templates

    var apikey = req.hint['#headers']["x-apikey"];

    if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
        res.end();
    }
    else {
            // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            res.end();
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to POST email templates"}});
        }
    }

}

function beforePUT(req, res){
// database logic to ensure only the holder of the master API key is able to PUT
// the email templates

    var apikey = req.hint['#headers']["x-apikey"];

    if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
        res.end();
    }
    else {
            // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            res.end();
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to PUT email templates"}});
        }
    }

}
