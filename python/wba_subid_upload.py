#!/usr/bin/env python3

# WBA Bulk upload script for Subordinate IDs
# takes input from XLSX and uploads to restdb.io

import pandas as pd
import os.path
import sys
import requests
import re

pd.set_option('display.max_rows', None)
dirpath = os.path.dirname(sys.argv[0])
config_file = filename = os.path.join(dirpath, "config.cfg")

print ("WBA BULK INSTALL SUBORDINATE ID LIST FROM XLS TO RESTDB")
if os.path.exists(config_file):

    config = open(config_file,"r")
#config.txt has four lines formatted as follows
#MEMBER-URL:<URL of member database>
#SUBID-URL:<URL of end-entity database>
#CERT-URL:<URL of certificate database>
#API-KEY:<Master API key for database>

#config.txt file must be in same directoy as python .py

    member_url = config.readline()
    url = config.readline()
    cert_url = config.readline()
    apikey = config.readline()

    url = url[url.find(":")+1:-1]
    apikey = apikey[apikey.find(":")+1:-1]

    check = False
    cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    resources = ["CompanyName", "CompanyAddress", "CompanyPhone", "ContactName", "ContactEmail", "ContactPhone", "WBAMember", "WBAAgent", "WBAID", "EntityType"]
#these column headings are checked to see if they are correct in the xlsx


    while check==False:
        check = True
        name = input("Enter filename of xls to upload: ")
        filename = os.path.join(dirpath, name)

        try:
            pd.read_excel(filename, na_values=["", " ", "-"])
        except NameError:
            check = False
            print ("File Not Found.")
        except Exception:
            check = False
            print ("Error in reading", filename)
        if check == True:
            try:
                data = pd.read_excel(filename, sheet_name='SubIDs', usecols=cols, skiprows = 3)
            except Exception:
                check = False
                print("Sheet named SubIDs not found")
        if check == False:
            print(' Please re-enter')

    # check columns are formtted correctly
    i=0
    for col in data.columns:
        if (col!=resources[i]):
            check = False
            print('Sheet named SubIDs  has badly formated columns')
            exit()
        i=i+1


    df = pd.read_excel (filename, sheet_name='SubIDs', usecols=cols, skiprows = 3)


    headers = {
        "Content-Type": "application/json"
    }
    headers["x-apikey"] = apikey

    # REGEXP Checking
    regexp = [".*", ".*", ".*", ".*", ".*", ".*", "^((Yes)|(No))$", "^[^_]*$", "^[^_]*$", "^((VNP)|(HSP)|(VNP&HSP))$"]


    for index, row in df.iterrows():
        a = re.match (regexp[6], row['WBAMember'])
        b = re.match (regexp[7], row['WBAAgent'])
        c = re.match(regexp[8], row['WBAID'])
        d = re.match(regexp[9], row['EntityType'])
        if (a and b and c and d ):
            print ("SubID Record ", index, "REGEXP check PASSED")
        else:
            print("SubID Record ", index, "REGEXP check FAILED - please correct and try again")
            exit()

    #code to check GET CURL works
#    response = requests.get(url, headers=headers)
#    print (response, response.text, response.json())


    #Check that CURL POST is working
#    json = "{ \"Company\": \"Dummy Company\" , \"Category\": \"General\", \"Contact\": \"John Smith\", \"PrimaryID\": \"Dummy\", \"CountryCode\": \"US\" }"
#    response = requests.post(url, headers=headers, data=json)
#    print (response.text, response.json)
#    print ("status code ", response.status_code)

    print ("Parsed Array Information")
    for index, row in df.iterrows():
        json = "{ \"CompanyName\": \"" + row['CompanyName'] + "\" , \"CompanyAddress\": \"" + row['CompanyAddress'] + "\" , \"CompanyPhone\": \"" + row['CompanyPhone'] + "\", \"ContactName\": \"" + row['ContactName'] + "\", \"ContactEmail\": \"" + row ['ContactEmail'] + "\" , \"ContactPhone\": \"" + row ['ContactPhone'] + "\" , \"WBAMember\": \"" + row ['WBAMember'] + "\" , \"WBAAgent\": \"" + row ['WBAAgent'] + "\"  , \"WBAID\": \"" + row ['WBAID'] + "\"  , \"EntityType\": \"" + row ['EntityType'] + "\" }"
        # check that new database has same field names as above
        print (json)
        response = requests.post(url, headers=headers, data=json)
        if response.status_code>=400:
            print ("Error uploading new SubID ", row['WBAID'], " to the database")
            print (response.text)
else:
    print("config.cfg file Not Found.")


