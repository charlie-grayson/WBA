#!/usr/bin/env python3

# WBA Bulk upload script for certificates
# takes input from XLSX and uploads to restdb.io

import pandas as pd
import os.path
import requests

pd.set_option('display.max_rows', None)
dirpath = os.path.dirname(__file__)

print ("WBA BULK INSTALL ISSUED CERTIFICATE LIST FROM XLS TO RESTDB")
if os.path.exists("config.txt"):

    config = open("config.txt","r")
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


    #code to check GET CURL works
#    response = requests.get(url, headers=headers)
#    print (response, response.text, response.json())

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
    print("config.txt file Not Found.")


