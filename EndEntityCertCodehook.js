// Codehooks for end-entity certificate
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);
    var slackhookurl = <<replace with slackhookurl for your slack channel>>;
    var who = req.hint['#usersession'].email || "REST API";
    var apikey = req.hint['#headers']["x-apikey"];
    var origin = req.hint['#headers'].origin;
// need to recover primary ID from UID
// then query on primary ID to get the API key
// then compare recovered API key with that used in API call
    var issuerdno = req.body['issuerDnO'];
    var uid = req.body['subjectUid'];
// need to strip leading subordinate IDs from UID   

    var agentId = uid;
    var n=agentId.indexOf('.');
// search for WBA-ID primary ID as being left of leftmost delimiter "."
    while (n!==-1) {
        agentId = agentId.substring(n+1);
        n=agentId.indexOf('.');
    }
//    log.debug("recovered primary ID is ", agentId);
    let query = {IssuerDnO: issuerdno};
    let hint = {};
    
    // Obtain data from database
    db.get("/rest/wba-members",query,hint,function (err,data) {
        if(!err){
//            log.debug("recovered API Key: ", data[0].IssuerAPIKey);
            
            if (data[0].IssuerAPIKey==apikey){
                // If match
                var slackmatch = {
                    // display new WBA PKI End Entitiy cert
                    "message": `${who} created a new WBA PKI End Entity certificate issued by ${data[0].Company} \nSubject \nWBAID=${req.body['subjectUid']} \nO=${req.body['subjectDnO']} \nOU=${req.body['subjectDnOu']} \nCN=${req.body['subjectDnCn']}`,
                    "slackhookurl": slackhookurl,
                    "channel": "#certificate-repository" 
                }
                slack(slackmatch, function(body){
                    res.end();
                });
            } else {
                // If no match
                req.body['void'] = true; // Issuer DN C does not match so set certificate to void
                var slacknomatch = {
                    // display the attempted new cert
                    "message": `${who} atempted to create a new WBA PKI End Entity certificate \n from ${data[0].issuerDnO} BUT with illegal IssuerDN Organization ${req.body['issuerDnO']}`,
                    "slackhookurl": slackhookurl,
                    "channel": "#certificate-repository" 
                }
                slack(slacknomatch, function(body){
                    res.end({"data": req.body});
                });
            }
        }
        else{
            // no data found
            log.error("No Origin URL");
            res.end();
        }
    })
}

function afterPOST(req, res){
// clean up codehook to remove entry if it submission does not adhere to policy, 
// e.g., issuerDN does not correspond to API key used in API
    var query = {_id: req.body['_id']};
    db.get("/rest/end-entity-cert",query,{},function (err,data) {
        if(!err){
            if (data[0].void){
                log.debug("record to be voided");
                // deleting record from database
                db.delete("/rest/end-entity-cert/"+req.body._id,{},function(err,result){
                    if (err){
                        // deletion error
                        log.error("Unable to delete");
                        res.end();
                    }
                    else {
                        res.end();
                    }
                });
            }
            else {
            //no operation if void is not set
                res.end();
            }
        }
        else{
            // No id to delete
            log.error("No _id");
            res.end();
        }
    })
}
