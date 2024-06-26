import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import { En, Fr, I18n } from "../I18n";

function rand() {
  return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
  const top = 50 + rand();
  const left = 50 + rand();

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default function SimpleModal({
  open,
  onClose,
  onAccept,
  modalQuestion,
}) {
  const classes = useStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);

  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onKeyPress={(e) => {
          if (e.key === "y") {
            onClose();
            onAccept();
          }
        }}
      >
        <div style={modalStyle} className={classes.paper}>
          <h2 id="simple-modal-title">
            {modalQuestion || (
              <I18n>
                <En>Are you sure?</En>
                <Fr>Vous êtes sûr ?</Fr>
              </I18n>
            )}
          </h2>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAccept();
            }}
          >
            <I18n>
              <En>Yes</En>
              <Fr>Oui</Fr>
            </I18n>
          </button>
          <button type="button" onClick={() => onClose()}>
            <I18n>
              <En>No</En>
              <Fr>Non</Fr>
            </I18n>
          </button>
        </div>
      </Modal>
    </div>
  );
}
