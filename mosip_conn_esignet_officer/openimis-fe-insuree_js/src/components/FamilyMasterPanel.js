import React, { Fragment } from "react";
import { injectIntl } from "react-intl";

import { Grid, FormControlLabel, Checkbox, Typography, Divider, Tooltip, IconButton } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { People as PeopleIcon } from "@material-ui/icons";

import {
  historyPush,
  withHistory,
  withModulesManager,
  TextInput,
  formatMessage,
  PublishedComponent,
  FormattedMessage,
  FormPanel,
  Contributions,
} from "@openimis/fe-core";
import { DEFAULT } from "../constants";

const FAMILY_MASTER_PANEL_CONTRIBUTION_KEY = "insuree.Family.master";

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});

class FamilyMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  renderLastNameField = (edited, classes) => {
    return (
      <Grid item xs={3} className={classes.item}>
        <TextInput
          module="insuree"
          label="Family.headInsuree.lastName"
          readOnly={true}
          value={!edited || !edited.headInsuree ? "" : edited.headInsuree.lastName}
        />
      </Grid>
    );
  };

  renderGivenNameField = (edited, classes) => (
    <Grid item xs={3} className={classes.item}>
      <TextInput
        module="insuree"
        label="Family.headInsuree.otherNames"
        readOnly={true}
        value={!edited || !edited.headInsuree ? "" : edited.headInsuree.otherNames}
      />
    </Grid>
  );

  headSummary = () => {
    const { classes, edited } = this.props;
    return (
      <Fragment>
        <Grid item xs={3} className={classes.item}>
          <TextInput
            module="insuree"
            label="Family.headInsuree.chfId"
            readOnly={true}
            value={!edited || !edited.headInsuree ? "" : edited.headInsuree.chfId}
          />
        </Grid>
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField(edited, classes)}
            {this.renderGivenNameField(edited, classes)}
          </>
        ) : (
          <>
            {this.renderGivenNameField(edited, classes)}
            {this.renderLastNameField(edited, classes)}
          </>
        )}
        <Grid item xs={2} className={classes.item}>
          <PublishedComponent
            pubRef="core.DatePicker"
            value={!edited || !edited.headInsuree ? null : edited.headInsuree.dob}
            module="insuree"
            label="Family.headInsuree.dob"
            readOnly={true}
          />
        </Grid>
        <Grid item xs={1} className={classes.item}>
          <PublishedComponent
            pubRef="insuree.InsureeGenderPicker"
            value={!edited || !edited.headInsuree || !edited.headInsuree.gender ? null : edited.headInsuree.gender.code}
            module="insuree"
            label="Family.headInsuree.gender"
            readOnly={true}
          />
        </Grid>
      </Fragment>
    );
  };

  updateContribution = (contributionKey, contributionValue) => {
    let contributionAttribute = this.getAttribute("contribution");

    if (!contributionAttribute) {
      contributionAttribute = {};
    }
    contributionAttribute[contributionKey] = contributionValue;
    this.updateAttribute("contribution", contributionAttribute);
  };

  render() {
    const { intl, classes, edited, openFamilyButton = false, readOnly, overview } = this.props;
    return (
      <Fragment>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Grid container align="center" justify="center" direction="column" className={classes.fullHeight}>
              <Grid item>
                <Typography>
                  <FormattedMessage module="insuree" id="insuree.FamilyDetailPanel.title" />
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          {!!openFamilyButton && !!overview && !!edited.uuid && (
            <Grid item>
              <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
                <IconButton
                  onClick={(e) =>
                    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [
                      edited.uuid,
                    ])
                  }
                >
                  <PeopleIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          <Grid item xs={12}>
            <PublishedComponent
              pubRef="location.DetailedLocation"
              withNull={true}
              readOnly={readOnly}
              required
              value={!edited ? null : edited.location}
              onChange={(v) => this.updateAttribute("location", v)}
              filterLabels={false}
            />
          </Grid>
          {!!overview && this.headSummary()}
          <Grid item xs={2} className={classes.item}>
            <PublishedComponent
              pubRef="insuree.FamilyTypePicker"
              withNull={false}
              readOnly={readOnly}
              value={!!edited && !!edited.familyType ? edited.familyType.code : null}
              onChange={(v) => this.updateAttribute("familyType", { code: v })}
            />
          </Grid>
          <Grid item xs={2} className={classes.item}>
            <PublishedComponent
              pubRef="insuree.ConfirmationTypePicker"
              withNull={false}
              readOnly={readOnly}
              value={edited?.confirmationType ?? null}
              onChange={(v) => this.updateAttribute("confirmationType", v)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="insuree"
              label="Family.confirmationNo"
              readOnly={readOnly}
              value={!edited ? "" : edited.confirmationNo}
              onChange={(v) => this.updateAttribute("confirmationNo", v)}
              required={edited?.confirmationType?.isConfirmationNumberRequired ?? false}
            />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module="insuree"
              label="Family.address"
              multiline
              readOnly={readOnly}
              value={!edited ? "" : edited.address}
              onChange={(v) => this.updateAttribute("address", v)}
            />
          </Grid>
          <Grid item xs={1} className={classes.item}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={!!edited && !!edited.poverty}
                  disabled={readOnly}
                  onChange={(e) => this.updateAttribute("poverty", !edited.poverty)}
                />
              }
              label={formatMessage(intl, "insuree", "Family.poverty")}
            />
          </Grid>
          <Divider />
        </Grid>
        <Contributions
          {...this.props}
          updateAttribute={this.updateContribution}
          formData={this.getAttributes()}
          formContribution={this.getAttribute("contribution")}
          edited={this.props.edited}
          contributionKey={FAMILY_MASTER_PANEL_CONTRIBUTION_KEY}
        />
      </Fragment>
    );
  }
}

export default withModulesManager(withHistory(injectIntl(withTheme(withStyles(styles)(FamilyMasterPanel)))));
