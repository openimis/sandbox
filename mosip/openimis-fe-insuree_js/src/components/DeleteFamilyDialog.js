import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
  primaryButton: theme.dialog.primaryButton,
  secondaryButton: theme.dialog.secondaryButton,
});

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";

import { FormattedMessage } from "@openimis/fe-core";

import { familyLabel } from "../utils/utils";

class DeleteFamilyDialog extends Component {
  render() {
    const { classes, family, onCancel, onConfirm } = this.props;
    return (
      <Dialog open={!!family} onClose={onCancel}>
        <DialogTitle>
          <FormattedMessage module="insuree" id="deleteFamilyDialog.title" values={{ label: familyLabel(family) }} />
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <FormattedMessage
              module="insuree"
              id="deleteFamilyDialog.message"
              values={{ label: familyLabel(family) }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => onConfirm(true)} className={classes.primaryButton} autoFocus>
            <FormattedMessage module="insuree" id="deleteFamilyDialog.deleteFamilyAndInsurres.button" />
          </Button>
          <Button onClick={(e) => onConfirm(false)} className={classes.secondaryButton}>
            <FormattedMessage module="insuree" id="deleteFamilyDialog.deleteFamilyOnly.button" />
          </Button>
          <Button onClick={onCancel} className={classes.secondaryButton}>
            <FormattedMessage module="core" id="cancel" />
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(DeleteFamilyDialog)));
