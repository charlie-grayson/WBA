#!/usr/bin/env python3

# WBA Bulk upload script for certificates
# takes input from XLSX and uploads to restdb.io

import pandas as pd
import os.path
import sys
import requests
import re

pd.set_option('display.max_rows', None)
dirpath = os.path.dirname(sys.argv[0])
config_file = filename = os.path.join(dirpath, "config.cfg")

print ("WBA BULK INSTALL ISSUED CERTIFICATE LIST FROM XLS TO RESTDB")
if os.path.exists(config_file):

    config = open(config_file,"r")
#config.txt has four lines formatted as follows
#MEMBER-URL:<URL of member database>
#SUBID-URL:<URL of end-entity database>
#CERT-URL:<URL of certificate database>
#API-KEY:<Master API key for database>

#config.txt file must be in same directoy as python .py

    member_url = config.readline()
    subid_url = config.readline()
    url = config.readline()
    apikey = config.readline()

    url = url[url.find(":")+1:-1]
    apikey = apikey[apikey.find(":")+1:-1]

    check = False
    cols = [1, 2, 3, 4, 5, 6]
    resources = ["SerialNumber", "IssuerDnOrg", "SubjectDnUid", "ExpiryDate", "Type", "Status"]
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
                data = pd.read_excel(filename, sheet_name='Certs', usecols=cols, skiprows = 3)
            except Exception:
                check = False
                print("Sheet named Certs not found")
        if check == False:
            print(' Please re-enter')

    # check columns are formtted correctly
    i=0
    for col in data.columns:
        if (col!=resources[i]):
            check = False
            print('Sheet named Certs has badly formated columns')
            exit()
        i=i+1


    df = pd.read_excel (filename, sheet_name='Certs', usecols=cols, skiprows = 3)


    headers = {
        "Content-Type": "application/json"
    }
    headers["x-apikey"] = apikey

    #REGEXP Checking
    regexp = ["^[1-9][0-9]*$", ".*", "^[^_]*$", "^(([2]\d{3})(\-)((0[1-9]|1[0-2]))(\-)((0[1-9]|[12]\d|3[01])))$",
              "^((End-Entity)|(Registration-Authority))$", "^((Issued)|(Revoked))$"]

    for index, row in df.iterrows():
        a = re.match (regexp[0], str(row['SerialNumber']))
        b = re.match (regexp[1], row['IssuerDnOrg'])
        c = re.match(regexp[2], row['SubjectDnUid'])
        d = re.match(regexp[3], row['ExpiryDate'])
        e = re.match(regexp[4], row['Type'])
        f = re.match(regexp[5], row['Status'])
        if (a and b and c and d and e and f):
            print ("Certificate Record ", index, "REGEXP check PASSED")
        else:
            print("Certificate Record ", index, "REGEXP check FAILED - please correct and try again")
            exit()


        #   code to check GET CURL works
#    response = requests.get(url, headers=headers)
#    print (response, response.text, response.json())


    #Check that CURL POST is working
#    json = "{ \"Company\": \"Dummy Company\" , \"Category\": \"General\", \"Contact\": \"John Smith\", \"PrimaryID\": \"Dummy\", \"CountryCode\": \"US\" }"
#    response = requests.post(url, headers=headers, data=json)
#    print (response.text, response.json)
#    print ("status code ", response.status_code)

    print ("Parsed Array Information")
    for index, row in df.iterrows():
        json = "{ \"SerialNumber\": \"" + str(row['SerialNumber']) + "\" , \"IssuerDnOrg\": \"" + row['IssuerDnOrg'] + "\" , \"SubjectDnUid\": \"" + row['SubjectDnUid'] + "\", \"ExpiryDate\": \"" + row['ExpiryDate'] + "\", \"Type\": \"" + row ['Type'] + "\" , \"Status\": \"" + row ['Status'] + "\"  }"
        # check that new database has same field names as above
        print (json)
        response = requests.post(url, headers=headers, data=json)
        if response.status_code>=400:
            print ("Error uploading new Subject DN UID ", row['SubjectDnUid'], " to the database")
            print (response.text)
else:
    print("config.cfg file Not Found.")


