// Codehooks for implementing database logic for WBA

function beforeGET(req, res){
// database logic to ensure only the holder of the master API key is able to GET
// the WBA member list
   
    if (!req.hint['#headers']){
        // no headers means GET was received from DB user interface and therefore needs
        res.end();
    }
    else {
        if (!req.hint['#headers']['x-apikey']) {
            res.end();
        }
        else {
            var apikey = req.hint['#headers']['x-apikey'];
            if (apikey == context.settings.apikeys.master){
        // API key is master API key -
                res.end();
            }
            else {
                res.end({"error": {"statuscode": 400, "message": "API key does not have permission to view WBA member collection"}});
            }
        }
    }
}
    

// Codehook to report creation of new WBA Member
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);

    var slackhookurl = context.settings.slack.memberurl;
    var apikey = req.hint['#headers']["x-apikey"];

    // ensure all WBAIDs are upper case
    
    var masterID = req.body['PrimaryID'].toUpperCase();
    var countryCode = req.body['CountryCode'];
    var WBAID;
    
    if (!countryCode){
        WBAID = masterID;
    }
    else {
        WBAID = masterID + ":" + countryCode.toUpperCase();
    }
    
    
    var slackmatch = {
            "message": `WBA PMO created a new Primary WBA Identity, \n WBAID=${WBAID} `,
            "slackhookurl": slackhookurl,
            "channel": "#wba-db-new-member"
    };
    
    req.body['WBAID'] = WBAID;
    req.body['PrimaryID'] = masterID;
    res.end({"data": req.body});
    
    
    
    // valid API key means received over API
    if (!apikey) {
        // no API-Key means POST was received from DB user interface and therefore needs

        slack(slackmatch, function(body){
            res.end({"data": req.body});
        });
    }
    else {
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            slack(slackmatch, function(body){
                res.end({"data": req.body});
            });
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to POST to WBA member collection"}});
        } 
    }
    
}

function beforePUT(req, res){
// database logic to ensure only the holder of the master API key is able to update
// the status of an end entity

    var apikey = req.hint['#headers']["x-apikey"];

    if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
        res.end({"data": req.body});
    }
    else {
            // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            res.end({"data": req.body});
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to PUT to WBA member collection"}});
        }
    }
}
