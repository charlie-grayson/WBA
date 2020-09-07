# WBA

Work by Charlie Grayson.
Licenced Under Apache 2.0.
Licence Provided within the Repositry.

This directory contains the codehooks to be used with restdb.io database to implement the database logic for WBA.

## WBA Members Collection
1) the beforePOST function is used to advertise the allocation of a new PrimaryID to Slack

## End-Entity Collection
1) The beforeGET function is used to ensure that only WBA brokers can GET the end-entity records that they have assigned
2) The beforePOST function is used to ensure only a WBA member with an allocated API key is able to allocate identities under its primary ID
3) The beforePOST function is used to advertise the assignment of a new WBAID to Slack
4) The afterPOST funciton is used to send a welcome email to the new WBAID assignee

## Issued-Certificate Collection
1) The beforeGET function is used to ensure that only WBA brokers can GET the issued-certificate records that they have issued
2) The beforePOST function is used to ensure a WBA Issuing I-CA can only notify certificates with their corresponding Issue Dn Organization
3) The beforePOST function is used to ensure that the WBAID in the Subject DN UID filed corresponds to an assigned WBAID
4) The beforePOST function is used to advertise the issueance of a certificate to Slack
5) The beforePUT function is used to ensure only the holder of the API key is able to update the status of a certificate from issued to revoked

