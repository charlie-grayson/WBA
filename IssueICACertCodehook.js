// Codehooks for issuing-ica-certificate// Codehooks for certificate
function beforePOST(req, res){

//  log.debug("REQ.HINT: ",req.hint);
  var slackhookurl = <<replace with slackhook url for your slack channel>>;
  var issuerDnO = req.body['issuerDnO'];
  // Message Output
  var slackmatch = {
    "message": `WBA PMO created a new WBA PKI Issuing I-CA certificate issued by ${req.body['issuerDnO']} \nSubject \nO=${req.body['subjectDnO']} \nOU=${req.body['subjectDnOu']} \nC=${req.body['subjectDnC']}`,
    "slackhookurl": slackhookurl,
    "channel": "#certificate-repository"  
  }
  slack(slackmatch, function(body){
    res.end();
  });
}
