import { associationTypeCode } from "../isoCodeLists";

async function dataCiteToRecord(dcJson) {
    const record = {}

    record.datasetIdentifier = `https://doi.org/${dcJson.doi}`;
    const dcContacts = [...dcJson.creators, ...dcJson.contributors];

    record.contacts = dcContacts.length ? dcContacts.reduce((contactList, creator) => {
        const contact = {};
        let indOrcid = ''
        let orgRor = ''
    
        const {
            givenName = '',
            familyName = '',
            name = '',
            affiliation = '',
            nameIdentifiers = '',
            nameType = '',
            contributorType = '',
        } = creator;

        indOrcid = nameIdentifiers.filter(x => x.nameIdentifierScheme === "ORCID")[0]?.nameIdentifier || '';
        orgRor = nameIdentifiers.filter(x => x.nameIdentifierScheme === "ROR")[0]?.nameIdentifier || '';

        if (nameType === "Organizational" || familyName === undefined){
            contact.orgName = name
        }else{
            contact.givenNames = givenName;
            contact.lastName = familyName;
            contact.orgName = affiliation.join();
        }
        contact.indOrcid = indOrcid;        
        contact.orgRor = orgRor;
        contact.role = [contributorType || 'author']

        // Add the creator to the list if it exists
        if (contact) {
            contactList.push(contact);
        }

        return contactList;
    }, []) : [];

    record.contacts = record.contacts.concat(dcJson.fundingReferences.map(
        ({ funderName, 
            funderIdentifier, 
            funderIdentifierType,
        })  => ({ 
            orgName: funderName,
            orgRor: funderIdentifierType === "ROR" ? funderIdentifier : '',
            role: "Funder",
        })))
    
    // remove duplicates
    record.contacts = record.contacts.filter((x, i, arr) =>
            arr.findIndex(y =>
                JSON.stringify(y) === JSON.stringify(x)
            ) === i
        )

    record.title = {};
    record.title.en = dcJson.titles.filter(x => !x.lang || (x.lang && x.lang === 'en'))[0].title;
    record.title.fr = dcJson.titles.filter(x => x.lang && x.lang === 'fr')[0].title;


    record.keywords = {};
    record.keywords.en = dcJson.subjects.filter(x => !x.lang || (x.lang && x.lang === 'en')).map(x => x.subject);
    record.keywords.fr = dcJson.subjects.filter(x => x.lang && x.lang === 'fr').map(x => x.subject);

    const createdDate = dcJson.dates.filter(x => x.dateType === "Created")[0] || null;
    record.created = createdDate;

    const collected = dcJson.dates.filter(x => x.dateType === "Collected")[0] || null;
    [record.dateStart, record.dateEnd] = collected.length ? collected?.split("/") : [null,null];

    record.datePublished = dcJson.dates
        .filter(x => x.dateType in ["Submitted", "Issued", "Accepted"])
        .sort((a, b) => {
            if (a.date > b.date){ 
                return 1
            } if (b.date > a.date){ 
                return -1 
            } 
            return 0
        })

    const updated = dcJson.dates.filter(x => x.dateType === "Updated");
    record.dateRevised = updated?.[0]

    record.language = dcJson.language

    record.metadataScope = dcJson.types.resourceTypeGeneral

    record.associated_resources = dcJson.relatedIdentifiers.map(
        ({  relatedIdentifier, 
            relatedIdentifierType, 
            relationType,
        }) => 
        ({
            title: {en:'',fr:''},
            code: relatedIdentifier,
            authority: relatedIdentifierType,
            association_type: relationType,
            association_type_iso: associationTypeCode[relationType].isoValue,
        }));



    // dcJson.relatedItems[]

    record.license = dcJson.rightsList[0].rightsIdentifier

    record.abstract = {};
    record.abstract.en = dcJson.descriptions.filter(x => !x.lang || (x.lang && x.lang === 'en')).map(x => x.description).join('\n\n')
    record.abstract.fr = dcJson.descriptions.filter(x => x.lang && x.lang === 'fr').map(x => x.description).join('\n\n')
    
    record.map = dcJson.geoLocations.filter(x => x.geoLocationBox).map(({geoLocationBox: { eastBoundLongitude, northBoundLatitude, southBoundLatitude, westBoundLongitude}}) => ({
        east: eastBoundLongitude,
        north: northBoundLatitude,
        south: southBoundLatitude,
        west: westBoundLongitude,
    })).shift();

    // metadata???
    // "created": "2022-11-09T23:56:15.000Z",
    // "registered": "2022-11-09T23:56:16.000Z",
    // "published": "2022",
    // "updated": "2024-04-11T06:06:58.000Z"


    return record;
}

export default dataCiteToRecord;