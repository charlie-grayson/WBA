// Codehooks for hsp-end-entities
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);
  var slackhookurl = <<replace with slackhookurl for your slack channel>>;
  var who = req.hint['#usersession'].email || "REST API";
  var apikey = req.hint['#headers']["x-apikey"];
  var wbaAgent = req.body['WBAAgent'];
  let query = {Company: req.body['WBAAgent']};
  let hint = {};

// Obtaining data from database
    db.get("/rest/wba-members",query,hint,function (err,data) {
        //if Exists
        if (!err){
//            log.debug("WBAID from API: ", wbaAgent);
//            log.debug("API Keyfrom API: ", apikey);
//            log.debug("recovered APIkey: ", data[0].AgentAPIKey);
            if (data[0].AgentAPIKey==apikey) {
                var slackmatch = {
                    "message": `${who} created a new WBA Identity, generated by ${data[0].Company} \n WBAID=${req.body['WBAID']} `,
                    "slackhookurl": slackhookurl,
//                    "channel": "#certificate-repository" 
                    "channel": "#wba-hsp-repository" 
                }
                slack(slackmatch, function(body){
                    res.end();
                });
            }
            else {
                req.body['void'] = true; // WBAID does not match the WBAID allocated to the AgentAPIKey so set WBAID to void
                var slacknomatch = {
                    "message": `${who} tried to create a new WBA identity \n using an API key from ${data[0].WBAID} BUT with illegal WBAID ${req.body['WBAAgent']}. \n Any posted data will be automatically deleted`,
                    "slackhookurl": slackhookurl,
                    "channel": "#certificate-repository" 
                }
                slack(slacknomatch, function(body){
                    res.end({"data": req.body});
                });    
            }
        }
        else{
            // No data in given origin URL
            log.error("No Origin URL");
            res.end();
        }
       
    })
}

function afterPOST(req, res){
// clean up codehook to remove entry if submission does not adhere to policy, 
// e.g., WBAID does not correspond to API key used in API
  var query = {_id: req.body['_id']};
  // Obtaining data from database
  db.get("<<replace with data location within database>>",query,{},function (err,data) {
    if(!err){
      if (data[0].void){
//        log.debug("record to be voided");
// Delete Data from within database
        db.delete("<<replace with data location within database>>"+req.body._id,{},function(err,result){
          if (err){
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
        // Unable to find submission to delete
      log.error("No _id");
      res.end();
    }
  })
}
