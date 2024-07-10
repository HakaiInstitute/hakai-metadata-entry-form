
import React, { useContext, useState } from "react";
import {
    Paper,
    TextField,
    Button,
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { En, Fr, I18n } from "../I18n";
import dataCiteToRecord from "../../utils/dataCiteToRecord";
import { validateDOI } from "../../utils/validate";
import {
    QuestionText,
    SupplementalText,
    paperClass,
} from "./QuestionStyles";

import { UserContext } from "../../providers/UserProvider";

const DOIImport = ({ record, name, handleUpdateImportDatasetIdentifier, bulkUpdateRecord, disabled }) => {
    const { getDoi } = useContext(UserContext);
    const doiIsValid = validateDOI(record.importDatasetIdentifier)
    const [doiErrorFlag, setDoiErrorFlag] = useState(false);
    const [loadingDoi, setLoadingDoi] = useState(false);

    const showImportDoi = record.importDatasetIdentifier !== '';
    
  
    async function handleUpdateRecordFromDOI() {
        setLoadingDoi(true);
        // const database = getDatabase(firebase);
        if (!record.importDatasetIdentifier) {
            setLoadingDoi(false);
            return;
        }
        try {
            const doi = record.importDatasetIdentifier.replace('https://doi.org/', '');
            getDoi({ doi })
                .then(async (result) => {
                    const newRecord = await dataCiteToRecord(result.data);
                    newRecord.importDatasetIdentifier = '';
                    bulkUpdateRecord(newRecord);
                })
                .finally(() => {
                    setLoadingDoi(false);
                });

        } catch (err) {
            setDoiErrorFlag(true);
            throw new Error(`Error in handleUpdateRecordFromDOI: ${err}`);
        }                    

    }
       
    return (
        <Paper style={paperClass}>
            <QuestionText>
                <I18n>
                    <En>Import metadata from DOI</En>
                    <Fr>Importez des métadonnées depuis DOI</Fr>
                </I18n>{" "}
                <SupplementalText>
                    <I18n>
                        <En>
                            <p>Eg, https://doi.org/10.0000/0000. This will overwrite existing form values.</p>
                        </En>
                        <Fr>
                            <p>
                                Par exemple, https://doi.org/10.0000/0000. Cela écrasera les valeurs de formulaire existantes.
                            </p>
                        </Fr>
                    </I18n>
                </SupplementalText>
            </QuestionText>

            {
                doiErrorFlag && (
                    <span>
                        <I18n
                            en="Error occurred with DOI API"
                            fr="Une erreur s'est produite avec l'API DOI"
                        />
                    </span>
                )
            }
  
            <TextField
                style={{ marginTop: "10px" }}
                name={name || "importDatasetIdentifier"}
                helperText={
                    (doiIsValid ? "" : <I18n en="Invalid DOI" fr="DOI non valide" />)
                }
                error={!doiIsValid}
                value={record.importDatasetIdentifier}
                onChange={(e) => handleUpdateImportDatasetIdentifier(e)}
                disabled={disabled}
                fullWidth
            />
            {
                showImportDoi && (
                    <Button
                        onClick={() => handleUpdateRecordFromDOI()}
                        disabled={['not found', 'unknown'].includes(record.doiCreationStatus)}
                        style={{ display: 'inline', marginTop: "10px", marginRight: "15px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {loadingDoi ? (
                                <>
                                    <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                    Loading...
                                </>
                            ) : (
                                "Import Record from DOI"
                            )}
                        </div>
                    </Button>
                )
            }
        </Paper>

    );
};

export default DOIImport;