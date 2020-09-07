# WBA COdehooks

This directory contains the codehooks to be used with restdb.io database to implement the database logic for WBA.

## WBA Members Collection
the beforePOST function is used to advertise the allocation of a new PrimaryID to Slack
End-Entity Collection
The beforeGET function is used to ensure that only WBA brokers can GET the end-entity records that they have assigned
The beforePOST function is used to ensure only a WBA member with an allocated API key is able to allocate identities under its primary ID
The beforePOST function is used to advertise the assignment of a new WBAID to Slack
The afterPOST funciton is used to send a welcome email to the new WBAID assignee
All induvidual .hmtl files are within the Repositry.

All .html files are commented, and are the same in code structure, so don't get confused with which one is which.

All contain the example code for implimenting appropriate output to the database within Restdb.io.

All necessary data would be stored within the restdb.io database.

Codehooks provided are within a .js format.

These would be within the restdb.io database, and call the appropriate functions.

Slack API URLs need to be inserted into the appropriate variables.
