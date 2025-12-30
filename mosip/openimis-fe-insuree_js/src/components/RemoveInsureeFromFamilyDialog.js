import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager } from "@openimis/fe-core";

const styles = (theme) => ({
  primaryButton: theme.dialog.primaryButton,
  secondaryButton: theme.dialog.secondaryButton,
});

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";

import { FormattedMessage } from "@openimis/fe-core";

import { familyLabel, insureeLabel } from "../utils/utils";

class RemoveInsureeFromFamilyDialog extends Component {
  constructor(props) {
    super(props);
    this.canCancel = props.modulesManager.getConf("fe-insuree", "canCancelPoliciesOnRemoveInsureeFromFamily", true);
    this.canKeep = props.modulesManager.getConf("fe-insuree", "canKeepPoliciesOnRemoveInsureeFromFamily", true);
  }

  render() {
    const { classes, family, insuree, onCancel, onConfirm } = this.props;
    return (
      <Dialog open={!!insuree} onClose={onCancel}>
        <DialogTitle>
          <FormattedMessage
            module="insuree"
            id="removeInsureeFromFamilyDialog.title"
            values={{ insuree: insureeLabel(insuree), family: familyLabel(family) }}
          />
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <FormattedMessage
              module="insuree"
              id="removeInsureeFromFamilyDialog.message"
              values={{ insuree: insureeLabel(insuree), family: familyLabel(family) }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {!!this.canCancel && (
            <Button onClick={(e) => onConfirm(true)} className={classes.primaryButton} autoFocus>
              <FormattedMessage module="insuree" id="removeInsureeFromFamilyDialog.cancelPolicies.button" />
            </Button>
          )}
          {!!this.canKeep && (
            <Button onClick={(e) => onConfirm(false)} className={classes.secondaryButton}>
              <FormattedMessage module="insuree" id="removeInsureeFromFamilyDialog.keepPolicies.button" />
            </Button>
          )}
          <Button onClick={onCancel} className={classes.secondaryButton}>
            <FormattedMessage module="core" id="cancel" />
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(RemoveInsureeFromFamilyDialog))));
