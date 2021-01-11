import React, { useState } from "react";

import {
  Paper,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  // CircularProgress,
} from "@material-ui/core";

import { Add, Delete } from "@material-ui/icons";
// import { useParams } from "react-router-dom";
import Contact from "./Contact";
// import firebase from "../../firebase";
// import { auth } from "../../auth";

import SelectInput from "./SelectInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "./RequiredMark";
import { validateField } from "../validate";
import { deepCopy } from "../../utils/misc";
import ContactTitle from "../ContactTitle";

const ContactTab = ({ disabled, record, handleInputChange, userContacts }) => {
  const name = "contacts";

  const value = record.contacts || [];

  // const { region } = useParams();
  // const [isSavingContact, setisSavingContact] = useState(false);
  const initial = {
    role: [],
    orgName: "",
    orgEmail: "",
    orgURL: "",
    orgAdress: "",
    orgCity: "",
    orgCountry: "",
    indName: "",
    indPosition: "",
    indEmail: "",
  };
  const [activeContact, setActiveContact] = useState(0);

  const contactList = Object.values(userContacts || {});

  function handleAddContact(index) {
    handleInputChange({
      target: {
        name: "contacts",
        value: value.concat(contactList[index]),
      },
    });
    setActiveContact(value.length);
  }
  // async function saveContact(idx) {
  //   if (value[idx]) {
  //     setisSavingContact(true);

  //     await firebase
  //       .database()
  //       .ref(region)
  //       .child("users")
  //       .child(auth.currentUser.uid)
  //       .child("contacts")
  //       .push(value[idx]);

  //     setisSavingContact(false);
  //   }
  // }

  function addItem() {
    const changes = {
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    };

    handleInputChange(changes);
    setActiveContact(value.length);
  }
  function handleChange(e) {
    const newValue = [...value];
    const propName = e.target.name;
    newValue[activeContact][propName] = e.target.value;
    const parentEvent = { target: { name, value: newValue } };
    handleInputChange(parentEvent);
  }
  function removeItem() {
    handleInputChange({
      target: {
        name,
        value: value.filter((e, index) => index !== activeContact),
      },
    });
    if (value.length) setActiveContact(value.length - 2);
  }
  const contact = value[activeContact];
  return (
    <Grid container spacing={3}>
      <Paper style={paperClass}>
        <Grid item xs>
          <QuestionText>
            <En>
              Please enter at least one <b>Metadata Contact</b> and one{" "}
              <b>Data Contact</b> for this dataset.
            </En>
            <Fr>
              Veuillez saisir au moins un contact lié à cet ensemble de données.
              Vous pouvez créer un nouveau contact ici.
            </Fr>
            <RequiredMark passes={validateField(record, "contacts")} />
            <SupplementalText>
              <En>
                If you have any saved contacts you can select them from the
                list.
              </En>
              <Fr>
                Si vous avez des contacts enregistrés, vous pouvez les
                sélectionner dans la liste.
              </Fr>
            </SupplementalText>
          </QuestionText>
        </Grid>
      </Paper>
      <Grid container direction="row" style={{ marginLeft: "5px" }}>
        <Grid item xs={3}>
          <Grid container direction="column" spacing={2}>
            <Grid item xs>
              Contacts:
              <List>
                {value.map((contactItem, i) => {
                  return (
                    <ListItem
                      key={i}
                      button
                      onClick={() => setActiveContact(i)}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activeContact === i ? "bold" : "",
                            }}
                          >
                            {i + 1}. <ContactTitle contact={contactItem} />
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Grid>

            <Grid item xs>
              <Button
                disabled={disabled}
                startIcon={<Add />}
                onClick={addItem}
                style={{ height: "56px", marginLeft: "10px" }}
              >
                <En>Add new contact</En>
                <Fr>Ajouter un contact</Fr>
              </Button>
            </Grid>
            <Grid item xs>
              <SelectInput
                style={{}}
                value=""
                labelId="add-existing"
                onChange={(e) => handleAddContact(e.target.value)}
                optionLabels={contactList.map((contactItem) => (
                  <ContactTitle contact={contactItem} />
                ))}
                options={contactList.map((v, i) => i)}
                disabled={!contactList.length || disabled}
                label={<I18n en="Add saved contact" fr="Ajouter un contact" />}
              />
            </Grid>
          </Grid>
        </Grid>

        {contact && (
          <Grid item xs>
            <Grid container direction="column">
              <Paper style={paperClass}>
                <Grid container direction="column" spacing={3}>
                  <Grid item xs>
                    <Contact
                      showRolePicker
                      value={contact}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </Grid>
                  <Grid item xs>
                    <Grid container direction="row" spacing={3}>
                      <Grid item xs>
                        <Button
                          startIcon={<Delete />}
                          disabled={disabled}
                          onClick={removeItem}
                        >
                          <En>Remove contact</En>
                          <Fr>Supprimer contact</Fr>
                        </Button>
                      </Grid>
                      {/* <Grid item xs>
                      <Button
                        startIcon={
                          isSavingContact ? <CircularProgress /> : <Save />
                        }
                        disabled={
                          disabled || (!contact.orgName && !contact.indName)
                        }
                        onClick={() => saveContact(i)}
                      >
                        <En>Save to stored contacts</En>
                        <Fr>Supprimer contact</Fr>
                      </Button>
                    </Grid> */}
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default ContactTab;