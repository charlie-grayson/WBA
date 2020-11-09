// Codehooks for implementing database logic for WBA

// Codehook to report creation of new WBA Member
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);

    var slackhookurl = context.settings.slack.url;
    var slackmatch = {
        "message": `WBA PMO created a new Primary WBA Identity, \n WBAID=${req.body['WBAID']} `,
        "slackhookurl": slackhookurl,
        "channel": "#subid-allocation"  // replace this with the production channel - see that this is "sub-id"
    }
    slack(slackmatch, function(body){
        res.end();
    });
}
