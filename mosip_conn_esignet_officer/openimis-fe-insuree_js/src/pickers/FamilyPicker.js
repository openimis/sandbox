import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { FormControl, TextField } from "@material-ui/core";
import { injectIntl } from "react-intl";
import { familyLabel } from "../utils/utils";
import _ from "lodash";

const styles = (theme) => ({
  label: {
    color: theme.palette.primary.main,
  },
  item: {
    padding: theme.spacing(1),
  },
});

class FamilyPicker extends Component {
  render() {
    const { intl, module, withLabel = true, label, value } = this.props;
    return (
      <FormControl fullWidth>
        <TextField
          disabled={true}
          label={!!withLabel && !!label && formatMessage(intl, module, label)}
          value={familyLabel(value)}
        />
      </FormControl>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(FamilyPicker)));
