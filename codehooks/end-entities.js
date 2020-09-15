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
        var apikey = req.hint['#headers']["x-apikey"];
        var query = {AgentAPIKey: req.hint['#headers']["x-apikey"]};
        var hint = {};
        var agent = "";
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

                db.get("/rest/wba-members",query,hint,function (err,data) {
                    if (!err){
                        agent += data[0].Company;
                // over-write query with WBA agent corresponding to API key
                        req.query.WBAAgent = agent;
                        res.send({"query": req.query});
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
  var slackhookurl = context.settings.slack.url;
  var who = req.hint['#usersession'].email || "REST API";
  var apikey = req.hint['#headers']["x-apikey"];
  var wbaAgent = req.body['WBAAgent'];
  var wbaid = req.body['WBAID'];
  var subId;
  var query = {Company: req.body['WBAAgent']};
  var hint = {};
  var syntaxCheck = 0;
  
  // automatically populate the date created field for all posts
  req.body['DateCreated'] = req.body['_created'];
    
    if (!apikey) {
        // no API-Key means POST was received from user interface
        // this allows WBA PMO to create subIDs from the GUI
            res.end();
    }
    else {
    // valid API key means received over API
        if (apikey == context.settings.apikeys.master){
            // API key is master API key - so do not perform checking
            // WBA PMO an use this API key to perform uploads of xls
           res.end();
        }
        else {
            // API key is present and NOT the master key

 //checking syntax of subID - cannot contain "_" or ":" characters
            //strip of primary ID to form subId
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
                masterId = wbaid.substring(1+wbaid.lastIndexOf("."));
                
                // query is the WBA Agent listed in the POST and so seach master ID DB for Agent
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
                            if (data[0].WBAID!=masterId) {
                                res.end({"error": {"statuscode": 400, "message": "WBA Member ID badly formatted"}});
                            }

                            
                            var slackmatch = {
                                "message": `${who} created a new WBA Identity, generated by ${data[0].Company} \n WBAID=${req.body['WBAID']} `,
                                "slackhookurl": slackhookurl,
                                "channel": "#subid-allocation"	
                            // need to update with production channel
                            };
                            slack(slackmatch, function(body){
                                res.end();
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
}

function afterPOST(req, res){
    // 1. load an email template from the database
    if (req.body.WBAMember == "Yes") {
        // do not send a welcome email
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
        euSendMail(mailopt, function(error, body){
            // end Codehook normally
            res.end();
        });
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
            from: 'Wireless Broadband Alliance <WBA@emaildomain>',
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
