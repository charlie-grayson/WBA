#!/usr/bin/env python3

# WBA Bulk upload script for certificates
# takes input from XLSX and uploads to restdb.io

def set_api_and_url(filename):
    config = open(filename, "r")
    # config.txt has four lines formatted as follows
    # MEMBER-URL:<URL of member database>
    # SUBID-URL:<URL of end-entity database>
    # CERT-URL:<URL of certificate database>
    # API-KEY:<Master API key for database>

    # config.txt file must be in same directoy as python .py

    member_url = config.readline() #dummy read not used in this script
    subid_url = config.readline() #dummy read not used in this script
    local_url = config.readline()
    local_apikey = config.readline()

    local_url = local_url[local_url.find(":") + 1:-1]
    local_apikey = local_apikey[local_apikey.find(":") + 1:-1]

    return (local_url,local_apikey)

def enter_and_check_excel(path):
    import pandas as pd
    import os.path

    pd.set_option('display.max_rows', None)
    check = False
    cols = [1, 2, 3, 4, 5, 6]
    resources = ["SerialNumber", "IssuerDnOrg", "SubjectDnUid", "ExpiryDate", "Type", "Status"]

    while check == False:
        check = True
        name = input("Enter filename of xls to upload: ")
        filename = os.path.join(path, name)

        try:
            pd.read_excel(filename, na_values=["", " ", "-"])
        except NameError:
            check = False
            print("File Not Found.")
        except Exception:
            check = False
            print("Error in reading", filename)
        if check == True:
            try:
                local_data = pd.read_excel(filename, sheet_name='Certs', usecols=cols, skiprows = 3)
            except Exception as Ex:
                check = False
                print("Sheet named Certs not found")
        if check == False:
            print(' Please re-enter')

    #  check columns are formtted correctly
    i = 0
    for col in local_data.columns:
        if (col != resources[i]):
            print('Sheet named SubIDs has badly formatted columns')
            exit()
        i = i + 1
    check_regex(local_data)
    return (local_data)

def check_regex(local_data):
    import re

    # REGEXP Checking
    regexp = ["^[1-9][0-9]*$", ".*", "^[^_]*$", "^(([2]\d{3})(\-)((0[1-9]|1[0-2]))(\-)((0[1-9]|[12]\d|3[01])))$",
              "^((End-Entity)|(Registration-Authority))$", "^((Issued)|(Revoked))$"]

    for index, row in local_data.iterrows():
        a = re.match(regexp[0], str(row['SerialNumber']))
        b = re.match(regexp[1], row['IssuerDnOrg'])
        c = re.match(regexp[2], row['SubjectDnUid'])
        d = re.match(regexp[3], row['ExpiryDate'])
        e = re.match(regexp[4], row['Type'])
        f = re.match(regexp[5], row['Status'])
        if (a and b and c and d and e and f):
            print("Certificate Record ", index, "REGEXP check PASSED")
        else:
            print("Certificate Record ", index, "REGEXP check FAILED - please correct and try again")
            exit()

    return

def post_data(local_data, local_url, local_apikey):
    import requests

    headers = {
        "Content-Type": "application/json"
    }
    headers["x-apikey"] = local_apikey

    print("Parsed Array Information")
    for index, row in local_data.iterrows():
        json = "{ \"SerialNumber\": \"" + str(row['SerialNumber']) + "\" , \"IssuerDnOrg\": \"" + row['IssuerDnOrg'] + "\" , \"SubjectDnUid\": \"" + row['SubjectDnUid'] + "\", \"ExpiryDate\": \"" + row['ExpiryDate'] + "\", \"Type\": \"" + row ['Type'] + "\" , \"Status\": \"" + row ['Status'] + "\"  }"
        # check that new database has same field names as above
        print (json)
        response = requests.post(local_url, headers=headers, data=json)
        if response.status_code>=400:
            print ("Error uploading new Subject DN UID ", row['SubjectDnUid'], " to the database")
            print (response.text)
    return

def main():
    import os.path
    import sys

    print ("WBA BULK INSTALL ISSUED CERTIFICATE LIST FROM XLS TO RESTDB")

    dirpath = os.path.dirname(sys.argv[0])
    config_file = os.path.join(dirpath, "config.cfg")

    if os.path.exists(config_file):

        url, apikey = set_api_and_url(config_file)
        df = enter_and_check_excel(dirpath)
        post_data(df,url,apikey)

    else:
        print("config.cfg file Not Found.")

if __name__ == "__main__":
    main()

