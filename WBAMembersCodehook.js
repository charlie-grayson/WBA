// Codehooks for wba-members
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);
    var slackhookurl = <<replace with slackhookurl for your slack channel>>;
    var who = req.hint['#usersession'].email || "REST API";
    // Output of Message
    var slackmatch = {
        "message": `WBA PMO created a new Primary WBA Identity, \n WBAID=${req.body['WBAID']} `,
        "slackhookurl": slackhookurl,
        "channel": "#wba-hsp-repository" 
    }
    // End
    slack(slackmatch, function(body){
        res.end();
    });
}
