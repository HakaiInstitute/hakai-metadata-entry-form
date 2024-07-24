import glob
import os
import traceback
from pathlib import Path
import json

import yaml
from firebase_to_xml.__main__ import get_filename
from firebase_to_xml.get_records_from_firebase import get_records_from_firebase
from firebase_to_xml.record_json_to_yaml import record_json_to_yaml
from flask import Flask, jsonify, make_response, request
from metadata_xml.template_functions import metadata_to_xml
from hakai_metadata_conversion.citation_cff import citation_cff
from hakai_metadata_conversion.erddap import global_attributes

import sentry_sdk

from git import Repo
# make sure .git folder is properly configured
PATH_OF_GIT_REPO = r'xml/.git'
COMMIT_MESSAGE = 'comment from python script'

def git_pull():
    try:
        repo = Repo(PATH_OF_GIT_REPO)
        origin = repo.remote(name='origin')
        origin.pull()
    except Exception as e:
        print('Some error occurred while pulling the code')
        print(e)


def git_push(files):
    try:
        repo = Repo(PATH_OF_GIT_REPO)                
        repo.git.add([files])
        repo.index.commit(COMMIT_MESSAGE)
        origin = repo.remote(name='origin')
        origin.push()
    except Exception as e:
        print('Some error occurred while pushing the code')
        print(e)

sentry_sdk.init(
    dsn="https://8fd4b6885cc447c0b11aa0cb3009b0e3@o56764.ingest.us.sentry.io/5493983",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0,
)

# on the server its run inside docker, the values of xml, key.json work for the server
firebase_auth_key_file = "key.json"
firebase_auth_key_json = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY','{}'))
# this is bind mounted to /var/www/html/dev/metadata
xml_folder = "xml"

waf_url = "https://pac-dev1.cioos.org/dev/metadata/"

app = Flask(__name__)

def delete_record(basename):
    # before writing/update a file, delete the old one
    # this way if the status changes (and so the folder changes), we dont end up with multiple copies
    # sanitize filename. just for security, the names should already be safe
    basename = "".join(
        [
            character if character.isalnum() else "_"
            for character in basename.strip().lower()
        ]
    )
    types = ('.xml','.yaml') # the tuple of file types
    
    existing_record_path = []
    
    for files in types:
        existing_record_path.extend(glob.glob(f"{xml_folder}/**/{basename}{files}", recursive=True))


    for file_path in existing_record_path:
        print("Deleting", file_path)
        os.remove(file_path)


def get_complete_path(status, region, basename,file_suffix):
    submitted_dir_addon = ""
    if status == "submitted":
        submitted_dir_addon = "unpublished"

    filename = "/".join([xml_folder, submitted_dir_addon, region, basename + file_suffix])
    return filename


@app.route("/recordDelete")
def recordDelete():
    filenameToDelete = request.args.get("filename")
    # so anyone can delete any xml file hmm
    git_pull()
    delete_record(filenameToDelete)
    git_push([filenameToDelete])
    return jsonify(message="record deleted")


# this would make us need to connect AWS Lambda to Firebase, doable, but I cant think how this would help anything
# create XML,YAML snippet, and write them to the WAF
@app.route("/record")
def recordUpdate():
    path = request.args.get("path")
    if not path:
         return make_response(jsonify(error="Missing path"), 500)
 
    [region, userID, recordID] = path.split("/")
    pathComplete = region + "/users/" + userID + "/records/" + recordID

    recordFromFB = get_records_from_firebase(
        "", firebase_auth_key_file, pathComplete, [], firebase_auth_key_json
    )[0]
    if not recordFromFB or not "title" in recordFromFB:
        return jsonify(message="not found")

    status = recordFromFB.get("status", "")
    basename = recordFromFB.get('filename') or get_filename(recordFromFB)
    
    xml_filename = get_complete_path(status, region, basename,'.xml')
    yaml_filename = get_complete_path(status, region, basename,'.yaml')
    cff_filename = get_complete_path(status, region, basename, '.cff')
    erddap_filename = get_complete_path(status, region, basename, '.erddap')

    git_pull()

    # delete file if exists already
    print(basename)
    delete_record(basename)

    # ah just let it run, if its a complete file it should work
    if status not in ["submitted", "published"]:
        return jsonify(message="")

    # this might fail for incomplete files. It should only be used if record is complete
    try:
        record = record_json_to_yaml(recordFromFB)
        xml = metadata_to_xml(record)
        record_yaml =  yaml.safe_dump(record, allow_unicode=True)
        cff_yaml = citation_cff(
            record, 
            record_type=recordFromFB.get('metadataScope')
            )
        erddap_xml = global_attributes(
            record,
            output='xml'
        )

        # create path if doesn't exist
        print(xml_filename)
        Path(xml_filename).parent.mkdir(parents=True, exist_ok=True)

        with open(xml_filename, "w") as f:
            f.write(xml)
            print("wrote", xml_filename)
        
        with open(yaml_filename, "w") as g:
            g.write(record_yaml)
            print("wrote", yaml_filename)
        
        with open(cff_filename, "w") as g:
            g.write(cff_yaml)
            print("wrote", cff_filename)

        with open(erddap_filename, "w") as g:
            g.write(erddap_xml)
            print("wrote", erddap_filename)

        git_push([xml_filename.replace('xml/', ''),
                 yaml_filename.replace('xml/', ''),
                 cff_filename.replace('xml/', ''),
                 erddap_filename.replace('xml/', ''),])
        url = waf_url + basename
        
        # returned value doesn't do anything
        return jsonify(message=url)
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
        return make_response(jsonify(error="Error creating xml"), 500)


# skip firebase and just create the XML directly
@app.route("/recordToXML", methods=["POST"])
def recordToXML():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)
    # basename = get_filename(recordFromFB)
    try:
        xml = metadata_to_xml(record)
        return jsonify(message={"xml": xml})
    except Exception:
        print(traceback.format_exc())
        return make_response(jsonify(error="Error creating xml"), 500)


@app.route("/recordToYAML", methods=["POST"])
def recordToYAML():
    recordFromFB = request.get_json()

    # basename = get_filename(recordFromFB)
    record = record_json_to_yaml(recordFromFB)
    print(record)

    return jsonify(message={"record": yaml.safe_dump(record, allow_unicode=True)})


@app.route("/recordToCFF", methods=["POST"])
def recordToCFF():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)

    # basename = get_filename(recordFromFB)
    try:
        cff = citation_cff(
            record,
            record_type=recordFromFB.get('metadataScope')
        )
        return jsonify(message={"record": cff})
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
        return make_response(jsonify(error="Error creating cff"), 500)


@app.route("/recordToERDDAP", methods=["POST"])
def recordToERDDAP():
    recordFromFB = request.get_json()

    record = record_json_to_yaml(recordFromFB)

    # basename = get_filename(recordFromFB)
    try:
        erddap_xml = global_attributes(
            record,
            output='xml'
        )
        return jsonify(message={"xml": erddap_xml})
    except Exception as err:
        print(traceback.format_exc())
        sentry_sdk.capture_exception(err)
        return make_response(jsonify(error="Error creating erddap snippet"), 500)

@app.errorhandler(404)
def resource_not_found(e):
    return make_response(jsonify(error="Not found!"), 404)

# Setup Git Credentials
GH_USERNAME = os.environ.get("GH_USERNAME", None)
GH_PAT = os.environ.get("GH_PAT", None)
if GH_USERNAME and GH_PAT:
    print("Running Git configuration")
    repo = Repo(PATH_OF_GIT_REPO)
    origin = repo.remote(name='origin')
    repoURL = origin.url
    repoURL = repoURL.replace("https://github", "https://%s:%s@github" % (GH_USERNAME,GH_PAT))
    cw = origin.config_writer
    cw.set_value('url', repoURL)
    cw.release()
    print("Completed Git configuration")

if __name__ == "__main__":
    app.run()
