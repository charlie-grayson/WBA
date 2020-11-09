// Codehooks for implementing database logic for WBA
function beforeGET(req, res){
// database logic to ensure only the holder of the master API key is able to GET
// the issuing I-CA colection

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
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to GET Issuing I-CA Collection"}});
        }
    }

}


function beforePOST(req, res){
// database logic to ensure only the holder of the master API key is able to POST
// the issuing I-CA colection

    var slackhookurl = context.settings.slack.certurl;
    var issuerDnO = req.body['issuerDnO'];

    var slackmatch = {
        "message": `WBA PMO created a new WBA PKI Issuing I-CA certificate issued by ${req.body['issuerDnO']} \nSubject \nO=${req.body['subjectDnO']}`,
        "slackhookurl": slackhookurl,
        "channel": "#cert-issuer"
    }

    var apikey = req.hint['#headers']["x-apikey"];

    if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
        slack(slackmatch, function(body){
            res.end();
        });

    }
    else {
            // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
        // API key is master API key -
            slack(slackmatch, function(body){
                res.end();
            });
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to POST to Issuing I-CAs collection"}});
        }
    }

}

function beforePUT(req, res){
// database logic to ensure only the holder of the master API key is able to GET
// the issuing I-CA colection

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
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to PUT issuing I-CAs"}});
        }
    }

}
