// Codehooks for implementing database logic for WBA

// Codehook for end-entity collection

// this codehook ensures that an ecosystem broker can only GET the end-entity
// details of end-entities associated with their primary ID
var beforeGET = function(req, res) {

//    log.debug("Calling get REQUEST", req.query);
//    log.debug("Calling get HINT", req.hint);

    if (!req.hint['#usersession']['email'])
    // the usersession with valid email is used when the restdb web page requests the end-entities
    {
        let apikey = req.hint['#headers']["x-apikey"];
        let query = {AgentAPIKey: req.hint['#headers']["x-apikey"]};
        let hint = {};
        let agent = "";
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
                // collestion, which company was allocated the API key
                // NOTE - IT IS ASSUMED THAT AN API KEY IS ONLY ALLOCATED TO A
                // SINGLE MEMBER
                
                // use db.get function to see who has been allocated the API key

                db.get("/rest/wba-members",query,hint,function (err,data) {
                    if (!err){
                // new code needed as an API key may not enable access to end-entities 
                // in which case the query will be null
                        if(data.length ===0){
                            res.end({"error": {"statuscode": 400, "message": "API key doesn't permit access to End-Entity collection"}});
                        }
                        else {
                            agent += data[0].Company;
                // over-write query with WBA agent corresponding to API key
                        req.query.WBAAgent = agent;
                        res.send({"query": req.query});
                        }
                    }
                    else{
                        log.error("db.get error was generated from API call sent by APKkey :", apikey);
                        res.end({"error": {"statuscode": 400, "message": "db.get error was generated from API call"}});
                    }

                })
            }
        }
    }
    else {
        // web page request - so do not change the query
        res.send({"query": req.query});
    }
}


function beforePOST(req, res){
// database logic to ensure only a WBA membar with an allocated API key is 
// able to allocate identities under its primary ID

//  log.debug("REQ.HINT: ",req.hint);
  var slackhookurl = context.settings.slack.subidurl;
  var apikey = req.hint['#headers']["x-apikey"];
  var wbaAgent = req.body['WBAAgent'];
  var wbaid = req.body['WBAID'].toUpperCase();
  var subId;
  let query = {Company: req.body['WBAAgent']};
  let hint = {};
  var syntaxCheck = 0;
  
    // automatically populate the date created field for all posts
    req.body['DateCreated'] = req.body['_created'];

    // ensure all WBAIDs are upper case by over-writing WBAID field with .toUpperCase value
    
    req.body['WBAID'] = wbaid;
    
    var slackpmo = {
        "message": `WBA PMO created a new WBA SubID, WBAID=${req.body['WBAID']} `,
        "slackhookurl": slackhookurl,
        "channel": "#wba-db-subid-assigned"
    };
    
    if (!apikey) {
        // no API-Key means POST was received from user interface
        // this allows WBA PMO to create subIDs from the GUI
        
        slack(slackpmo, function(body){
            res.end({"data": req.body});
        });

    }
    else {
    // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
            // API key is master API key - so do not perform checking
            // WBA PMO can use this API key to perform uploads of xls
            // e.g., using python scripts
                
            slack(slackpmo, function(body){
                res.end({"data": req.body});
            });
        }
        else {
            // API key is present and NOT the master key

            //checking syntax of subID - cannot contain "_" or ":" characters
            //strip of primary ID to form subId 
            // Format is subId + "." + primaryID - so strip from right most "."
            subId = wbaid.substring(0,wbaid.lastIndexOf("."));
            if (subId.includes('_')){
                syntaxCheck=1;
            }
            if (subId.includes(':')){
                syntaxCheck=1;
            }
            // log.debug("subID: ", subId, "Checking =", syntaxCheck);
            if (syntaxCheck ==1) {
                res.end({"error": {"statuscode": 400, "message": "Subordinate ID contains an illegal character"}});
            }
            else {
                // WBAID is syntatically valid - and so recover master ID
                // master ID is on right of right most "."
                masterId = wbaid.substring(1+wbaid.lastIndexOf("."));
                
                // query is the company name of the WBA Agent listed in the POST and so search master ID DB for Agent
                db.get("/rest/wba-members",query,hint,function (err,data) {
                    if (!err){
                        // check if the Company exists in the database
                        if(data.length ===0){
                            res.end({"error": {"statuscode": 400, "message": "WBA Member does not exist"}});
                        }
                        else {
                            // now check if API keys match
                            if (data[0].AgentAPIKey!=apikey) {
                                res.end({"error": {"statuscode": 400, "message": "API Key doesn't match one allocated to Member"}});
                            }
                            else {
                                if (data[0].WBAID.toUpperCase()!=masterId.toUpperCase()) {
                                  res.end({"error": {"statuscode": 400, "message": "WBA Member ID badly formatted"}});
                                }
                                else {
                                    var slackmatch = {
                                        "message": `A new WBA Identity has been assigned by ${data[0].Company} \n WBAID=${req.body['WBAID']} `,
                                        "slackhookurl": slackhookurl,
                                        "channel": "#wba-db-subid-assigned"	
                                    };
                                    slack(slackmatch, function(body){
                                        res.end({"data": req.body});
                                    });
                                }

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
    }
}

function afterPOST(req, res){
    // 1. load an email template from the database
    if (req.body.WBAMember == "Yes") {
        // do not send a welcome email to WBA members
        res.end();
    }
    
    db.get('/rest/emailtemplates',{title: "Welcome"}, {}, function(error, data){
            
        // 2. merge record with email template
        var htmlmail = template(data[0].template, req.body);
        var mailopt = {
            to: req.body.ContactEmail,
            subject: "Welcome to the WBA",
            html: htmlmail,
            company: "Wireless Broadband Alliance", // Email footer
            sendername: "WBA Automated Email" // Email sendername, hides the email address
        };
        
        // 3. send email
//        log.debug("email template is: ", mailopt);
        sendMail(mailopt, function(error, body){
        // end Codehook normally
            res.end();
        });
//        euSendMail(mailopt, function(error, body){
            // end Codehook normally
//            res.end();
//        });
//        res.end();
    });
}

// standard restdb.io sendmail does not use the EU version, i.e., sends to 
// api.mailgun.net AND NOT api.eu.mailgun.net
function euSendMail(body, callback) {
    var YOUR_DOMAIN_NAME = context.settings.mailgun.domain;
    var apikey = context.settings.mailgun.apikey;

    var options = {
        method: "POST",
        url: "https://api:"+apikey+"@api.eu.mailgun.net/v3/"+YOUR_DOMAIN_NAME+"/messages",
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            from: context.settings.mailgun.address,
            to: body.to,
            subject: body.subject,
            html: body.html 
        }
    };
//    log.info("Sending mail with Mailgun...");
//    log.debug("email post is: ", options);
    
    
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      callback(body);
    });
}

function beforePUT(req, res){
// database logic to ensure only the holder of the master API key is able to update
// the status of an end entity - PMO will set the void field to true when an end-entity
// leaves

    var apikey = req.hint['#headers']["x-apikey"];
    var slackhookurl = context.settings.slack.subidurl;
    var slackpmo = {
        "message": `Previously assigned WBAID ${req.body['WBAID']} has been voided by WBA PMO`,
        "slackhookurl": slackhookurl,
        "channel": "#wba-db-subid-assigned"
    };

    if (!apikey) {
    // no API-Key means POST was received from user interface - so permit updates
        if (req.body.void) {
            // WBAID has been voided and so send information to slack channel
            slack(slackpmo, function(body){
                res.end({"data": req.body});
            });
        }
        else {
            // and check where void isn't set to true simply update the record
            res.end({"data": req.body});
        }
        
    }
    else {
        // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
            // API key is master API key -
            res.end({"data": req.body});
        }
        else {
            res.end({"error": {"statuscode": 400, "message": "API key does not have permission to update any record"}});
        }
    }
    
}

            
