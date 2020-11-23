// Codehooks for implementing database logic for WBA

// Codehook for issued-certificate

// this codehook ensures that an I-CA can only GET the 
// details of issued-ceretificates associated with their API-key
// this codehook does not work with the test database wehre APIkeys are share

var beforeGET = function(req, res) {
    
//    log.debug("Calling get REQUEST", req.query);
//    log.debug("Calling get HINT", req.hint);

    if (!req.hint['#usersession']['email'])
    // the usersession with valid email is used when the restdb web page requests the end-entities
    {
        
        let apikey = req.hint['#headers']["x-apikey"];
        let query = {IssuerAPIKey: req.hint['#headers']["x-apikey"]};
        let hint = {};
        let issuer = "";

        /// **** READ THIS ****
        // test database has shared API key - so do not perform any filtering
        // comment out this line in production
        // res.send({"query": req.query});


        if (!apikey) {
        // no API-Key means GET was received from DB user interface and therefore needs
        // to return all records
            res.send({"query": req.query});
        }
        else {
        // valid API key means received over API
            if (apikey == context.settings.apikeys.master){
                // API key is master API key - so do not perform checking
                res.send({"query": req.query});
            }
            else {
                // API key is present and NOT the master key then it corresponds
                // to an APIkey allocated to an ecosystem partner

                // query contains the API key - so first look up in wba-members
                // collestion, which Issuer DN Org was allocated the API key
                // NOTE - IT IS ASSUMED THAT AN API KEY IS ONLY ALLOCATED TO A
                // SINGLE MEMBER

                db.get("/rest/wba-members",query,hint,function (err,data) {
                    if (!err){
                        issuer += data[0].IssuerDnO;
                // over-write query with IssuerDN Organisaation corresponding to API key
                        req.query.IssuerDnOrg = issuer;
                        res.send({"query": req.query});
                    }
                    else{
                        log.error("db.get error was generated from API call sent by APKkey :", apikey);
                        res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                    }

                });
            }
        }
    }
    else {
        // web page request - so do not change the query
        res.send({"query": req.query});
    }
};



function beforePOST(req, res){
// database logic to ensure only a WBA membar with an allocated API key is 
// able to notify issuance of certificates according to its issuer Dn org
// and that the subjectDnUid corresponds to a valide assigned WBAID

//  log.debug("REQ.HINT: ",req.hint);

    let slackhookurl = context.settings.slack.certurl;
    let who = req.hint['#usersession'].email || "REST API";
    let apikey = req.hint['#headers']["x-apikey"];
    let issuer = req.body['IssuerDnOrg'];
    let wbaidquery = {WBAID: req.body['SubjectDnUid'].toUpperCase()};
    let issuerquery = {IssuerDnO : req.body['IssuerDnOrg']};
    let hint = {};
    
// automatically populate the created field
    req.body['DateCreated'] = req.body['_created'];

    var slackpmo = {
        "message": `WBA PMO entered a new WBA certificate, issued by ${issuer} with WBAID=${req.body['SubjectDnUid']} `,
        "slackhookurl": slackhookurl,
        "channel": "#wba-db-certificate-issued"
    };

    
    if (!apikey) {
        // no API-Key means POST was received from user interface
        slack(slackpmo, function(body){
            res.end({"data": req.body});
        });

    }
    else {
    // valid API key means received over API
       if (apikey == context.settings.apikeys.master){
            // API key is master API key - so do not perform checking
            slack(slackpmo, function(body){
                res.end({"data": req.body});
            });

        }
        else {
            
            // API key is present and NOT the master key
            
            // first check that the API key allocated to issuer DN is valid and matches API key in POST
            
            db.get("/rest/wba-members",issuerquery,hint,function (err,data) {
                if (!err){
                    // check if the Company exists in the database
                    if(data.length ===0){
                        res.end({"error": {"statuscode": 400, "message": "Issuer DN Organization does not exist"}});
                    }
                    else {
                        // now check if API keys match
        
                        if (data[0].IssuerAPIKey!=apikey) {
                            res.end({"error": {"statuscode": 400, "message": "API Key doesn't match one allocated to Issuing I-CA"}});
                        }
                        // now need to check WBAID exists 
                        
                        db.get("/rest/end-entities",wbaidquery,hint,function (err,data2) {
                            if (!err){
                                // check if the wbaid exists in the database
                                if(data2.length ===0){
                                    res.end({"error": {"statuscode": 400, "message": "WBAID in Subject DN UID does not exist"}});
                                }
                                else {
                                    // need to check whether member has left the WBA, i.e., WBAID is void
                                    if (data2[0].void) {
                                        res.end({"error": {"statuscode": 400, "message": "WBAID in Subject DN UID has been voided by PMO"}});
                                    }
                                    else {
                                        // now need to post issuance to SLACK 
                                        var slackmatch = {
                                            "message": `A new WBA certificate was issued by ${issuer} with Subject DN UID=${data2[0].WBAID} `,
                                            "slackhookurl": slackhookurl,
                                            "channel": "#wba-db-certificate-issued"
                                        };
                                        slack(slackmatch, function(body){
                                            res.end({"data": req.body});
                                        });
                                    }
                                    
                                }
                                
                                
                                
                            }
                            else {
                                log.error("db.get error was generated from API call sent by WBAID :", wbaAgent);
                                res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                            }
                        
                        });
                    }
                }
                else {
                    log.error("db.get error was generated from API call sent by WBAID :", wbaAgent);
                        res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                }
                    
            });
                
        }
    }
}

function beforePUT(req, res){
// database logic to ensure only the holder of the API key is able to update
// the status of a certificate from issued to revoked

//    log.debug("REQ.HINT: ",req.hint);

    var apikey = req.hint['#headers']["x-apikey"];
    var issuer = req.body['IssuerDnOrg'];
    let objectquery = {objectID: req.body['objectID']};
    let issuerquery = {IssuerDnO: req.body['IssuerDnOrg']};
    let hint = {};

    if (!apikey) {
        // no API-Key means PUT was received from user interface
            res.end({"data": req.body});
    }
    else {
    // valid API key means received over API
       if (apikey == context.settings.apikeys.master){
            // API key is master API key - so do not perform checking
           res.end({"data": req.body});
        }
        else {

            // API key is present and NOT the master key
            //  check that the API key allocated to issuer DN is valid and matches API key in PUT

            db.get("/rest/wba-members",issuerquery,hint,function (err,data) {
                if (!err){
                    // check if the issuerDB exists in the database
                    if(data.length ===0){
                        res.end({"error": {"statuscode": 400, "message": "issuer DN does not exist"}});
                    }
                    else {
                        // now check if issuer's API key matches the API key

                        if (data[0].IssuerAPIKey!=apikey) {
                            res.end({"error": {"statuscode": 400, "message": "API Key doesn't match the one used to create the record"}});
                        }
                        // now need to over-write the req.body with existing settings - 
                        // i.e., you can ONLY update the Status element
                        db.get("/rest/issued-certificates",objectquery,hint,function (err,data2) {
                            if (!err) {
                                // check if the object exists in the database
                                if(data2.length ===0){
                                    res.end({"error": {"statuscode": 400, "message": "object ID does not exist"}});
                                }
                                // now overwrite with current record
                                req.body.SerialNumber = data2[0].SerialNumber;
                                req.body.IssuerDnOrg = data2[0].IssuerDnOrg;
                                req.body.SubjectDnUid = data2[0].SubjectDnUid;
                                req.body.ExpiryDate = data2[0].ExpiryDate;
                                req.body.Type = data2[0].Type;
                                
                                res.end({"data": req.body});
                            }
                            else {
                                log.error("db.get error was generated from API call sent by WBAID :", wbaAgent);
                                res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                            }
                        
                        });
                        
                    }
                }
                else {
                    log.error("db.get error was generated from API call sent by WBAID :", wbaAgent);
                        res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                }

            });

        }
    }
}
