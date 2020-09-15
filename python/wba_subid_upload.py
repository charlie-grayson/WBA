#!/usr/bin/env python3

# WBA Bulk upload script for Subordinate IDs
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
    local_url = config.readline()
    cert_url = config.readline() #dummy read not used in this script
    local_apikey = config.readline()

    local_url = local_url[local_url.find(":") + 1:-1]
    local_apikey = local_apikey[local_apikey.find(":") + 1:-1]

    validate_url(local_url)
    
    return (local_url,local_apikey)

def validate_url(local_url):
    import re
    
    # REGEXP Checking against expression for valid URL
    # catches situation where user has not edited default config file
    url_regexp = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
    if not re.match(url_regexp, local_url):
        print ("URL in config.cfg is badly formatted")
        exit()
    return

def enter_and_check_excel(path):
    import pandas as pd
    import os.path

    pd.set_option('display.max_rows', None)
    check = False
    cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    resources = ["CompanyName", "CompanyAddress", "CompanyPhone", "ContactName", "ContactEmail", "ContactPhone",
                 "WBAMember", "WBAAgent", "WBAID", "EntityType"]

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
                local_data = pd.read_excel(filename, sheet_name='SubIDs', usecols=cols, skiprows=3)
            except Exception as Ex:
                check = False
                print("Sheet named SubIDs not found")
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
    regexp = [".*", ".*", ".*", ".*", ".*", ".*", "^((Yes)|(No))$", "^[^_]*$", "^[^_]*$", "^((VNP)|(HSP)|(VNP&HSP))$"]

    for index, row in local_data.iterrows():
        a = re.match (regexp[6], row['WBAMember'])
        b = re.match (regexp[7], row['WBAAgent'])
        c = re.match(regexp[8], row['WBAID'])
        d = re.match(regexp[9], row['EntityType'])
        if (a and b and c and d ):
            print ("SubID Record ", index, "REGEXP check PASSED")
        else:
            print("SubID Record ", index, "REGEXP check FAILED - please correct and try again")
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
        json = "{ \"CompanyName\": \"" + row['CompanyName'] + "\" , \"CompanyAddress\": \"" + row[
            'CompanyAddress'] + "\" , \"CompanyPhone\": \"" + row['CompanyPhone'] + "\", \"ContactName\": \"" + row[
                   'ContactName'] + "\", \"ContactEmail\": \"" + row['ContactEmail'] + "\" , \"ContactPhone\": \"" + \
               row['ContactPhone'] + "\" , \"WBAMember\": \"" + row['WBAMember'] + "\" , \"WBAAgent\": \"" + row[
                   'WBAAgent'] + "\"  , \"WBAID\": \"" + row['WBAID'] + "\"  , \"EntityType\": \"" + row[
                   'EntityType'] + "\" }"
        # check that new database has same field names as above
        print(json)
        response = requests.post(local_url, headers=headers, data=json)
        if response.status_code >= 400:
            print("Error uploading new SubID ", row['WBAID'], " to the database")
            print(response.text)
    return


def main():
    import os.path
    import sys

    print ("WBA BULK INSTALL SUBORDINATE ID LIST FROM XLS TO RESTDB")

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
