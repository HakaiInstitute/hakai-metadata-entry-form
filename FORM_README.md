# CIOOS Metadata Form Documentation

## Table of contents

1. [INITIAL SETUP](#initial-sample)
2. [IDENTIFICATION](#identification)
3. [METADATA](#metadata)
4. [SPATIAL](#spatial)
5. [CONTACT](#contact)
6. [DISTRIBUTION](#distribution)
7. [PLATFORM](#platform)

## Initial setup

Login to the system using your preferred Google account. There is currently no restriction on who can add metadata records.

Once you have logged in, select the CIOOS region that the data was collected within. If the data spans more than one region, select the region whose Regional Association you have been working with. The region selection will be used to notify a reviewer from that region to review the record once you have submitted the completed record for review. As you add records, please ensure you have filled out contact information for the metadata contact as the reviewer will use this to contact you with any questions about the metadata entry.

After selecting your region, click New Record to begin. The sections of the metadata form to fill in are listed as separate tabs across the top of the page. The sections below describe how to fill in the entries within each of these tabs. Many of these elements will translate to entries shown in CKAN, the CIOOS metadata catalogue. An example CKAN record for an existing dataset can be viewed [here](https://cioosatlantic.ca/ckan/dataset/org-coastalaction_ec2b8fbb-5482-46e2-af71-9e85d58b8922). In some cases we will also refer to the CIOOS asset map, which can be viewed as the map-based dataset browser, which is shown on the main CIOOS home page [here](https://cioos.ca).

Note that many of the elements have bilingual requirements. A 'Translate' button can be used to automatically translate the text you've entered in French or English into the other language, using AWS translation tools. 

Contact a member of the CIOOS engagement team within your region if you have questions about how to fill in any of these fields.

CIOOS Region | Email
------------ | -----
Atlantic     | info@cioosatlantic.ca

## IDENTIFICATION

### Dataset Title

This will define the dataset title, which corresponds to the header shown in CKAN for the dataset.

### Dataset Abstract

Enter the abstract for the dataset. These will define the summary text that is shown for this dataset in CKAN, so browsing some datasets at [](https://cioosatlantic.ca/ckan) can help give a sense of the type of descriptions that are typically used for this.

Suggested abstract points:
* **What:** Variables that were measured.
* **When:** Temporal coverage of the data, frequency of the measurements/observations.
* **Where:** spatial coverage of the data, sampling sites, sensor tracks, laboratory spaces
* **How:** equipment, procedures, protocols, calibrations, QA/QC.
* **Who:** participants, staff.
* **Why:** a high level statement on the outcome this data is meant to inform. 

### Essential ocean variables used

The essential ocean variables (EOVs) specified here will be relied on for searching and filtering for this dataset within the CIOOS metadata catalogue and asset map. Review the types of data that are present in the dataset and select the CIOOS EOVs that describe these data types.

More information about the CIOOS essential ocean variables that you’d like to associate with this dataset can be found [here](https://cioosatlantic.ca/eovs/). You can also find out more about the wider EOV list used by the Global Ocean Observing System (GOOD) [here](https://www.goosocean.org/index.php?option=com_content&view=article&id=14&Itemid=114).

### Data Keywords

Including information about the data types present in the dataset using standard vocabularies such as [Climate and Forecast names](https://cfconventions.org/) or the [BODC Parameter Usage Vocabulary](https://www.bodc.ac.uk/resources/vocabularies/parameter_codes/) are of particular interest. [GCMD keywords](http://vocab.nerc.ac.uk/collection/P04/current/) are also useful, however these can be automatically generated from the Climate and Forecast names, if those are provided.

### Data Status

Typically the dataset status should be set to one of the following:
* **completed** This is a modern dataset that includes full platform/instrument metadata and data collection has recently completed.
* **historical** This is a historical dataset where some key metadata elements, in particular instrument and platform metadata, can no longer be obtained.
* **onGoing** Data will be periodically added to this dataset as it comes in from a real-time or near real-time data collection instrument or platform.

If none of these options are applicable, see [here](https://wiki.esipfed.org/ISO_19115-3_Codelists#MD_ProgressCode) for the full list of status options that can be defined, with brief descriptions.

### Data Category

This should nearly always be set to 'oceans'.

If oceans is not applicable, see [here](https://wiki.esipfed.org/ISO_19115-3_Codelists#MD_TopicCategoryCode) for the full list of category options that can be defined, with brief descriptions.

### Data Maintenance Frequency

**Note** This element is not on the form, but probably should be.

This should usually be set to 'asNeeded'.

For updates to the dataset, note that the update frequency described here does not include updates where only new data is added to the datasets (e.g. real-time or near time ‘onGoing’ status datasets).

From the ISO 19115-1 2014 standard, the maintenance frequency we’re interested in here is the “frequency with which changes and additions are made to the resource after the initial resource is completed,” (or produced/published). These could be things like manually fixing known incorrect values, or running automated QC software on the data after initial release.

See [here](https://wiki.esipfed.org/ISO_19115-3_Codelists#MD_MaintenanceFrequencyCode) for further information about the available options.

### Data collection start date

Start date of data collection.

### Data collection end date

**Note** This element is not on the form, but probably should be.

End date for data collection.

### Publication date

### Revision date

## METADATA

### What licence, if any, applies to this dataset? 

We recommend that the Creative Commons Attribution 4.0 International licence (CC-BY 4.0) be applied as the default licence for all datasets that will be made available through the CIOOS platform. This allows for open sharing and adaptation of the data provided that the original creator is attributed.
Releasing the data as public domain (CC0), which imposes no restrictions of any kind is also acceptable. For datasets made available by Government of Canada departments and agencies, the Open Government Licence - Canada can be used, which is very similar to CC-BY as it allows for open sharing and adaptation of the data provided that the original creator of the data is properly attributed.

### What are the limitations affecting the fitness for use of the resource or metadata?

From ISO19115-1:2014: “constraints applied to assure the protection of privacy or intellectual property, and any special restrictions or limitations or warnings on using the resource or metadata.

Using ‘licence’ here is a good default value.

## SPATIAL

### Vertical Extent 

Captures the minimum and maximum depths (or height from sea floor) where the instrument recorded data. 

Note that a vertical reference system must be defined here, though typically this is mainly important to gauge which of depth or height from the sea floor are positive.

Lowest vertical value contained in the dataset (in metres)

Highest vertical value contained in the dataset (in metres)

The vertical coordinate reference system that was used to specify the highest and lowest vertical values.
This is typically specified as EPSG::5831, in cases where the vertical values are measured as depths from the surface, or else as EPSG::5829, in cases where the vertical values are measured as heights from sea floor.

Suggested item(s)

● EPSG::5831 (positive depth)
● EPSG::5829 (positive height from sea floor)

## CONTACT

### Distributor Contact Information 

A distributor is an organization that may or may not also be the owner or originator of the dataset, but in either case has taken on the responsibilities of making the dataset accessible to others. Principle person or organization distributing the dataset. 

## DISTRIBUTION

## PLATFORM


