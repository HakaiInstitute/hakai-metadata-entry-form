import React from "react";
import {
  Add,
  Delete,
  ArrowUpwardSharp,
  ArrowDownwardSharp,
} from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import Autocomplete from '@material-ui/lab/Autocomplete';
import validator from "validator";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { associationTypeCode, initiativeTypeCode, identifierType } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "../FormComponents/SelectInput";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass, SupplementalText } from "./QuestionStyles";

const validateURL = (url) => !url || validator.isURL(url);

const AssociatedResources = ({ updateResources, resources, disabled }) => {

  const emptyResource = { title: { en: "", fr: "" }, authority: "", code: "", association_type: "", initiative_type: "", url: "" };
  const { language } = useParams();

  function addResource() {
    updateResources(resources.concat(deepCopy(emptyResource)));
  }

  // removes the resource section from the list at index i
  function removeResource(i) {
    updateResources(resources.filter((e, index) => index !== i));
  }

  // move the resource section
  function moveResource(i, newIndex) {
    if (newIndex < 0 || newIndex >= resources.length) return;
    const element = resources.splice(i, 1)[0];
    resources.splice(newIndex, 0, element);
    updateResources(resources);
  }

  return (
    <div>
      {resources.map((dist = deepCopy(emptyResource), i) => {
        function urlIsValid(url) {
          return (e) => {
            !url || validateURL(url)
          };
        }
        function handleResourceChange(key) {
          return (e) => {
            const newValue = [...resources];
            newValue[i][key] = e.target.value;
            updateResources(newValue);
          };
        }
        function handleIdentifierChange(key) {
          return (e) => {

            const newValue = [...resources];
            newValue[i][key] = e.target.value;

            if (urlIsValid(newValue[i]['code']) && !newValue[i]['urls']) {
              console.log('Code is Valid URL')
              newValue[i]['url'] = newValue[i]['code']
            }

            let s = newValue[i]['code']

            switch (true) {
              case urlIsValid(newValue[i]['code']) && /^http.?:\/\/doi\.org\//i.test(s):
                newValue[i]['authority'] = 'DOI'
                console.log('MATCH DOI')
                break;
              case urlIsValid(newValue[i]['code']) && /^http.?:\/\/ca\.cioos/i.test(s):
                newValue[i]['authority'] = 'ca.cioos'
                console.log('MATCH DOI')
                break;
              case urlIsValid(newValue[i]['code']):
                newValue[i]['authority'] = 'URL'
                console.log('MATCH URL')
                break;
              default:
                newValue[i]['authority'] = ''
                break;
            }

            updateResources(newValue);
            console.log(newValue[i])

          };
        }
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter a title of the resource</En>
                    <Fr>Entrez une titre de la ressource</Fr>
                  </I18n>
                  <RequiredMark passes={dist.title?.en || dist.title?.fr} />
                </QuestionText>{" "}
                <BilingualTextInput
                  name="title"
                  label={<I18n en="Title" fr="Titre" />}
                  value={dist.title}
                  onChange={handleResourceChange("title")}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier for the related resource</En>
                    <Fr>Saisissez l'identifiant de la ressource associée</Fr>
                  </I18n>

                  <RequiredMark passes={validator.isURL(dist.code)} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The identifier may be to a metadata resource on another
                          repository or another record within CIOOS. A DOI or full URL are prefered.
                        </p>
                      </En>
                      <Fr>
                        <p>
                          L'identifiant peut provenir d'une ressource de métadonnées sur un autre
                          référentiel ou d'un autre enregistrement au sein de CIOOS. Un DOI ou une
                          URL complète sont préférables.
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <TextField
                  label={<I18n en="Identifier" fr="identifiant" />}
                  value={dist.code}
                  onChange={handleIdentifierChange("code")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier type</En>
                    <Fr>Entrez le type d'identifiant</Fr>
                  </I18n>
                  <RequiredMark passes={dist.authority} />
                </QuestionText>

                <Autocomplete
                  freeSolo
                  options={identifierType}
                  value={dist.authority}
                  renderInput={(params) => <TextField
                    {...params}
                    label={< I18n en="Authority" fr="Autorité" />}

                    onChange={handleResourceChange("authority")}
                    fullWidth
                    disabled={disabled}
                  />}
                />
              </Grid>

              <Grid item xs>
                <TextField
                  label={<I18n en="url" fr="url" />}
                  value={dist.url}
                  onChange={handleIdentifierChange("url")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>




              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>What is the relation type?</En>
                    <Fr>
                      Quel est le type de relation?</Fr>
                  </I18n>
                  <RequiredMark passes={dist.association_type} />
                </QuestionText>
                <SelectInput
                  value={dist.association_type}
                  onChange={handleResourceChange("association_type")}
                  options={Object.keys(associationTypeCode)}
                  optionLabels={Object.values(associationTypeCode).map(
                    ({ title }) => title[language]
                  )}
                  optionTooltips={Object.values(associationTypeCode).map(
                    ({ text }) => text[language]
                  )}
                  disabled={disabled}
                  label={<I18n en="Association Type" fr="Type d'association" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>What is the initiative type?</En>
                    <Fr>
                      Quel est le type d'initiative ?</Fr>
                  </I18n>
                </QuestionText>
                <SelectInput
                  value={dist.initiative_type}
                  onChange={handleResourceChange("initiative_type")}
                  options={Object.keys(initiativeTypeCode)}
                  optionLabels={Object.values(initiativeTypeCode).map(
                    ({ title }) => title[language]
                  )}
                  optionTooltips={Object.values(initiativeTypeCode).map(
                    ({ text }) => text[language]
                  )}
                  disabled={disabled}
                  label={<I18n en="Initiative Type" fr="Type d'initiative" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid item xs>
                <Button
                  startIcon={<Delete />}
                  disabled={disabled}
                  onClick={() => removeResource(i)}
                >
                  <I18n>
                    <En>Remove item</En>
                    <Fr>Supprimer la ressource</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowUpwardSharp />}
                  disabled={disabled || i - 1 < 0}
                  onClick={() => moveResource(i, i - 1)}
                >
                  <I18n>
                    <En>Move up</En>
                    <Fr>Déplacer vers le haut</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowDownwardSharp />}
                  disabled={disabled || i + 1 >= resources.length}
                  onClick={() => moveResource(i, i + 1)}
                >
                  <I18n>
                    <En>Move down</En>
                    <Fr>Déplacer vers le bas</Fr>
                  </I18n>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Paper style={paperClass}>
        <Button startIcon={<Add />} disabled={disabled} onClick={addResource}>
          <I18n>
            <En>Add item</En>
            <Fr>Ajouter une ressource</Fr>
          </I18n>
        </Button>
      </Paper>
    </div>
  );
};

export default AssociatedResources;
