#!/usr/bin/env python3

# WBA Bulk upload script for WBA-MEMBERS
# takes input from XLSX and uploads to restdb.io

def set_api_and_url(filename):
    config = open(filename, "r")
    # config.txt has four lines formatted as follows
    # MEMBER-URL:<URL of member database>
    # SUBID-URL:<URL of end-entity database>
    # CERT-URL:<URL of certificate database>
    # API-KEY:<API key for database>

    # config.txt file must be in same directoy as python .py

    lines = config.readlines()
    
    local_url = lines[0]
#    subid_url = lines[2] #dummy read not used in this script
#    cert_url = lines[3] #dummy read not used in this script
    local_apikey = lines[4]

    local_url = local_url[local_url.find(":") + 1:-1]
    local_apikey = local_apikey[local_apikey.find(":") + 1:-1]
    
    validate_url(local_url)
    
    return (local_url,local_apikey)

def validate_url(local_url):
    import re
    
    # Regular Expression Checking against expression for valid URL
    # catches situation where user has not edited default config file
    url_regex = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
    if not re.match(url_regex, local_url):
        print ("URL in config.cfg is badly formatted")
        exit()
    
    return

def enter_and_check_excel(path):
    import pandas as pd
    import os.path

    pd.set_option('display.max_rows', None)
    check = False
    cols = [2, 3, 4, 5, 6]
    resources = ["Member", "Type", "Contact Person", "Company ID", "Country ISO (Opt)"]

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
                local_data = pd.read_excel(filename, sheet_name='WBAID Members', usecols=cols, skiprows = 1)
            except Exception as Ex:
                check = False
                print("Sheet named WBAID Members not found")
        if check == False:
            print(' Please re-enter')

    #  check columns are formtted correctly
    i = 0
    for col in local_data.columns:
        if (col != resources[i]):
            print('Sheet named WBAID Members has badly formatted columns')
            exit()
        i = i + 1
    return (local_data)

def post_data(local_data, local_url, local_apikey):
    import requests

    headers = {
        "Content-Type": "application/json"
    }
    headers["x-apikey"] = local_apikey

    print("Parsed Array Information")
    for index, row in local_data.iterrows():
        
    #check if country code is populated - it is optional:
        if (row['Country ISO (Opt)'] != row['Country ISO (Opt)']):
            # means that the country code is an empty cell so don't include it in json
            json = "{ \"Company\": \"" + row['Member'] + "\" , \"Category\": \"" + row['Type'] + "\",\"Contact\": \"" + \
            row['Contact Person'] + "\", \"PrimaryID\": \"" + row['Company ID'] + "\" }"
        else:
            json = "{ \"Company\": \"" + row['Member'] + "\" , \"Category\": \"" + row['Type'] + "\",\"Contact\": \"" + \
            row['Contact Person'] + "\", \"PrimaryID\": \"" + row['Company ID'] + "\", \"CountryCode\": \"" + \
            row['Country ISO (Opt)'] + "\" }"
        
        # check that new database has same field names as above
        print (json)
        response = requests.post(local_url, headers=headers, data=json)
        if response.status_code>=400:
            print ("Error uploading new member ", row['Member'], " to the database")
            print (response.text)
    return

def main():
    import os.path
    import sys

    print ("WBA BULK INSTALL MEMBER LIST FROM XLS TO RESTDB")

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



