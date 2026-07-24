import recordToDataCite from '../utils/recordToDataCite';

const region = 'pacific';
const language = 'en';
const datacitePrefix = '10.21966';

// Minimal valid metadata record — contacts must be an array (not null) because
// the function calls contacts.find() unconditionally.
function makeRecord(overrides = {}) {
    return {
        contacts: [],
        title: { en: 'Test Dataset' },
        abstract: { en: 'Test abstract' },
        identifier: 'test-identifier-abc123',
        ...overrides,
    };
}

describe('recordToDataCite', () => {
    describe('creator filtering by role', () => {
        it('excludes a contact whose only role is publisher', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: true,
                    role: ['publisher'],
                    givenNames: 'Jane',
                    lastName: 'Smith',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators).toHaveLength(0);
        });

        it('includes a contact that has publisher plus at least one other role', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: true,
                    role: ['publisher', 'principalInvestigator'],
                    givenNames: 'Jane',
                    lastName: 'Smith',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators).toHaveLength(1);
            expect(result.data.attributes.creators[0]).toMatchObject({
                name: 'Smith, Jane',
                nameType: 'Personal',
            });
        });

        it('excludes a contact not marked inCitation', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: false,
                    role: ['author'],
                    givenNames: 'Bob',
                    lastName: 'Jones',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators).toHaveLength(0);
        });
    });

    describe('organizational creator (org-only contact)', () => {
        it('creates an Organizational nameType creator when only orgName is present', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: true,
                    role: ['author'],
                    orgName: 'Hakai Institute',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators).toHaveLength(1);
            expect(result.data.attributes.creators[0]).toMatchObject({
                name: 'Hakai Institute',
                nameType: 'Organizational',
            });
        });

        it('includes ROR in nameIdentifiers for an organizational creator with orgRor', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: true,
                    role: ['author'],
                    orgName: 'Hakai Institute',
                    orgRor: 'https://ror.org/02ps1na03',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators[0].nameIdentifiers).toEqual([{
                schemeUri: 'https://ror.org',
                nameIdentifier: 'https://ror.org/02ps1na03',
                nameIdentifierScheme: 'ROR',
            }]);
        });

        it('omits nameIdentifiers for an organizational creator without orgRor', () => {
            const record = makeRecord({
                contacts: [{
                    inCitation: true,
                    role: ['custodian'],
                    orgName: 'Tula Foundation',
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.creators[0].nameIdentifiers).toBeUndefined();
        });
    });

    describe('relatedIdentifiers spread guard', () => {
        it('does not throw when history exists but associated_resources is absent', () => {
            const record = makeRecord({
                history: [{
                    source: [{ authority: 'DOI', code: '10.1234/source' }],
                    processingStep: [],
                    additionalDocumentation: [],
                }],
            });
            expect(() => recordToDataCite(record, language, region, datacitePrefix)).not.toThrow();
        });

        it('includes history source entries in relatedIdentifiers as IsDerivedFrom', () => {
            const record = makeRecord({
                history: [{
                    source: [{ authority: 'DOI', code: '10.1234/source' }],
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            expect(result.data.attributes.relatedIdentifiers).toContainEqual({
                relatedIdentifier: '10.1234/source',
                relatedIdentifierType: 'DOI',
                relationType: 'IsDerivedFrom',
            });
        });

        it('merges associated_resources and history into relatedIdentifiers', () => {
            const record = makeRecord({
                associated_resources: [
                    { authority: 'DOI', code: '10.9999/related', association_type: 'IsPartOf' },
                ],
                history: [{
                    source: [{ authority: 'DOI', code: '10.1234/source' }],
                }],
            });
            const result = recordToDataCite(record, language, region, datacitePrefix);
            const ids = result.data.attributes.relatedIdentifiers;
            expect(ids).toContainEqual(expect.objectContaining({ relatedIdentifier: '10.9999/related' }));
            expect(ids).toContainEqual(expect.objectContaining({ relatedIdentifier: '10.1234/source' }));
        });
    });
});
