## Python setup for PC users

A brief set of instructions for PC users to use the WBA scripts.

1. Download Python

[Python Release Python 3.7.8 \| Python.org](https://www.python.org/downloads/release/python-378/)

This will also install the PIP program which is used to install the additional packages used by the scripts

2. Upgrade pip

To upgrade PIP in Windows you will need to open the Windows Command Prompt App (search for "cmd"). Type/copy the command below in the command line

```
>py -m pip install --upgrade pip
```

2. Install the packages used by the Python scripts

Use the same Windows Command Prompt to enter the following in turn

```
>py -m pip install requests
>py -m pip install sys
>py -m pip install pandas
>py -m pip install xlrd
>py -m pip install regex
```

3. Download the Python scripts and config.cfg file from

[WBA/python at master · charlie-grayson/WBA · GitHub](https://github.com/charlie-grayson/WBA/tree/master/python)

Script Name | Description
------------ | -------------
wba_cert_upload.py | upload issued certificates to restdb.io
wba_subid_upload.py | upload assigned SubIDs  to restdb.io
wba_member_upload.py | upload WBA primary members to restdb.io

**NOTE: The wba_member_upload.py script CANNOT be used with a regular WBA Agent API key**

To download the files, navigate to the top level project directory https://github.com/charlie-grayson/WBA. Click on the **Code** icon and select the **Download ZIP** option. Open the zip file and save the required \*.py scripts and config.cfg file in the same directory on your PC.


4. Edit the config.cfg file

The config.cfg needs to be edited using your preferred editor. One approach is to use notepad.

Use the same Windows Command Prompt and type the following:

```
>notepad config.cfg
```

Replace the dummy URLs with the URLs of the production database provided by WBA
Replace the dummy API key with the API key allocated to you by WBA
Save the file

5. Copy the excel spreadsheet containing the information to be uploaded to the same directory as the *.py files
 
The scripts check the sheet and columns are correctly named/formatted, so please take care 

6. Run the script

Open the Windows Command Prompt and change to the directory where you have stored the *.py and *.cfg files

To upload an excel spreadsheet of issued certificates, run the following command

```
>py wba_cert_upload.py
```

To upload an excel spreadsheet of assigned identities, run the following command

```
>py wba_subid_upload.py
```

To upload an excel spreadsheet of new WBA Member IDs, run the following command (**WBA PMO ONLY**)

```
>py wba_member_upload.py
```

The scripts will all prompt your for the filename corresponding to the *.xlsx to be uploaded.
