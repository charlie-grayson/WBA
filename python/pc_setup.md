## Python setup from scratch for PC users

1. Download Python

[Python Release Python 3.7.8 \| Python.org](https://www.python.org/downloads/release/python-378/)

This should also install pip to enable you to insatll additional packages

2. Upgrade pip

In order to upgrade PIP in Windows, you’ll need to open the Windows Command Prompt, and then type/copy the command below

```
>py -m pip install --upgrade pip
```

2. Install the required packages for the Python scripts

You can use the same Windows Command Prompt to enter the following in turn

```
>py -m pip install requests
>py -m pip insatll sys
>py -m pip install pandas
>py -m pip install sys
>py -m pip install os
>py -m pip install xlrd
>py -m pip install regex
```
     
3. Download the Python and config.cfg files from

[WBA/python at master · charlie-grayson/WBA · GitHub](https://github.com/charlie-grayson/WBA/tree/master/python)

Script Name | Description
------------ | -------------
wba_cert_upload.py | uplaod issued certificates to restdb.io
wba_subid_upload.py | uplaod assigned SubIDs  to restdb.io
wba_member_upload.py | uplaod WBA primary members to restdb.io


**NOTE: The wba_member_upload.py script CANNOT be used with a regular WBA Agent API key**

Ensure the config.cfg file is stored in the same directoy as the *.py files

4. Edit the config.cgf file

The config.cfg needs to be edited using your preferred editor. One approach is to use notepad.

Use the same Windows Command Prompt and type the following:

```
>notepad config.cfg
```

Replace the dummy URLs with the ones provided by WBA
Relpace the dummy API with the API key allocated to you by WBA

5. Copy the excel spreadsheet containing the nformation to be uploaded to the same directory as the *.py files
 
The script check the sheet and columns are correctly formatted so please take care 

6. Run the script

Open the Windows Command Prompt and change to the directory where you have stored the *.py and *.cfg files

To upload issued certificates, run the following command

```
>py wba_cert_upload.py
```

To upload assigned identities, run the following command

```
>py wba_subid_upload.py
```    

To upload new WBA Member IDs, run the following command (**WBA PMO ONLY**)

```
>py wba_member_upload.py
```

In all cases, the filename needs to be entered corresponding to the *.xlsx to be uploaded.
