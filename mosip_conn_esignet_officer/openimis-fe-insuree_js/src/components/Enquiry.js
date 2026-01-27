import React, { useState, useRef } from "react";
import { injectIntl } from "react-intl";
import { alpha, makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { InputBase } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { formatMessage } from "@openimis/fe-core";
import EnquiryDialog from "./EnquiryDialog";
import { INSUREE_NUMBER_MAX_LENGTH } from "../constants";

const useStyles = makeStyles((theme) => ({
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "auto",
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: 120,
      "&:focus": {
        width: 200,
      },
    },
  },
  inputLarge: {
    width: 200,
  },
}));

const Enquiry = (props) => {
  const { intl, ...others } = props;
  const [chfid, setChfid] = useState(null);
  const inputRef = useRef();
  const classes = useStyles();

  const handleKeyPress = (event) => {
    if (event.charCode === 13 && event.target.value) {
      setChfid(event.target.value);
    } else {
      const value = event.target.value;
      const charCode = event.charCode;
      const isAlphaNumeric = /^[a-zA-Z0-9]*$/.test(value + String.fromCharCode(charCode));
      const isLengthValid = value.length < INSUREE_NUMBER_MAX_LENGTH || charCode === 50;
      if (!isAlphaNumeric || !isLengthValid) {
        event.preventDefault();
        return;
      }
    }
  };

  const handleClose = () => {
    setChfid(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={classes.search}>
      <EnquiryDialog open={Boolean(chfid)} chfid={chfid} onClose={handleClose} {...others} />
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <InputBase
        inputRef={inputRef}
        placeholder={formatMessage(intl, "insuree", "appBar.enquiry")}
        classes={{
          root: classes.inputRoot,
          input: clsx(classes.inputInput, Boolean(chfid) && classes.inputLarge),
        }}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default injectIntl(Enquiry);
