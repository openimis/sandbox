import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider, Checkbox, FormControlLabel } from "@material-ui/core";
// Make sure this path is correct based on your file structure
import ESignetVerification from "./ESignetVerification"; 
import FarmerRegistryVerification from "./FarmerRegistryVerification";

import {
  formatMessage,
  withTooltip,
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  Contributions,
  withModulesManager,
} from "@openimis/fe-core";

import {
  baseApiUrl,
} from "@openimis/fe-core";

import { DEFAULT, INSUREE_ACTIVE_STRING } from "../constants";

const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
  // Add styling for the verification section if needed
  verificationSection: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }
});

class InsureeMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.isInsureeStatusRequired = props.modulesManager.getConf(
      "fe-insuree",
      "insureeForm.isInsureeStatusRequired",
      false,
    );
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
    this.isPhotoRequired = props.modulesManager.getConf(
      "fe-insuree",
      "insureeForm.isPhotoRequired",
      false,
    );
    
    // eSignet configuration
    this.eSignetEnabled = props.modulesManager.getConf(
      "fe-insuree",
      "eSignetEnabled",
      false, // Defaults to false if not in config
    );
  }

  // Optimized Handler: Performs ONE state update instead of multiple
  handleESignetDataReceived = (userData) => {
    const { edited, onEditedChanged } = this.props;
    const genderMap = { male: "M", female: "F", other: "O" };

    // 1. Process Photo
    let photoFile = edited.photo; // Default to existing photo
    const rawPicture = userData.rawData?.picture || userData.picture;

    if (rawPicture && typeof rawPicture === "string") {
      const base64String = rawPicture.startsWith("data:")
        ? rawPicture.split(",")[1]
        : rawPicture;

      photoFile = {
        filename: `esignet_${userData.individualId || Date.now()}.jpg`,
        photo: base64String.trim(),
        date: new Date().toISOString().split("T")[0],
        officerId: null,
      };
    }

    // 2. Prepare the new state object
    // We prioritize eSignet data, but fall back to existing data if eSignet is empty
    const updates = {
      chfId: (userData.individualId || "").substring(0, 8), // Always update ID if present
      otherNames: userData.name?.split(" ")[0] || edited.otherNames || "",
      lastName: userData.name?.split(" ").slice(1).join(" ") || edited.lastName || "",
      email: userData.email || edited.email || "",
      phone: userData.phone || userData.rawData?.phone_number || edited.phone || "",
      dob: userData.birthdate ? userData.birthdate.replace(/\//g, "-") : (edited.dob || null),      gender: userData.gender ? { code: genderMap[userData.gender.toLowerCase()] || "O" } : edited.gender,
      photo: photoFile,
      passport : userData.individualId,
      head: true
    };

    // 3. Single Bulk Update to prevent race conditions
    onEditedChanged({
      ...edited,
      ...updates
    });
  };

  renderLastNameField = (edited, classes, readOnly) => {
    return (
      <Grid item xs={4} className={classes.item}>
        <TextInput
          module="insuree"
          label="Insuree.lastName"
          required={true}
          readOnly={readOnly}
          value={!!edited && !!edited.lastName ? edited.lastName : ""}
          onChange={(v) => this.updateAttribute("lastName", v)}
        />
      </Grid>
    );
  };

  renderGivenNameField = (edited, classes, readOnly) => (
    <Grid item xs={4} className={classes.item}>
      <TextInput
        module="insuree"
        label="Insuree.otherNames"
        required={true}
        readOnly={readOnly}
        value={!!edited && !!edited.otherNames ? edited.otherNames : ""}
        onChange={(v) => this.updateAttribute("otherNames", v)}
      />
    </Grid>
  );

  render() {
    const {
      intl,
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      actions,
      editedId,
    } = this.props;

    const existingVerification = edited?.jsonExt?.eSignetVerificationDate;

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={3} container alignItems="center" className={classes.item}>
                <Typography variant="h5">
                  <FormattedMessage module="insuree" id={title} values={titleParams} />
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container justify="flex-end">
                  {!!edited &&
                    !!edited.family &&
                    !!edited.family.headInsuree &&
                    edited.family.headInsuree.id !== edited.id && (
                      <Grid item xs={3}>
                        <PublishedComponent
                          pubRef="insuree.RelationPicker"
                          withNull={true}
                          nullLabel={formatMessage(this.props.intl, "insuree", `Relation.none`)}
                          readOnly={readOnly}
                          value={!!edited && !!edited.relationship ? edited.relationship.id : ""}
                          onChange={(v) => this.updateAttribute("relationship", { id: v })}
                        />
                      </Grid>
                    )}
                  {!!actions &&
                    actions.map((a, idx) => {
                      return (
                        <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                          {withTooltip(a.button, a.tooltip)}
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Divider />

            <div style={{ padding: '16px' }}>
                {edited?.uuid ? (
                    <FarmerRegistryVerification 
                         identifier={edited?.passport}
                         updateAttribute={this.updateAttribute}
                         disabled={readOnly}
                    />
                ) : (
                    <ESignetVerification 
                        onUserDataReceived={this.handleESignetDataReceived}
                        disabled={readOnly}
                        existingVerification={existingVerification}
                    />
                )}
            </div>
            <Grid container className={classes.item}>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.InsureeNumberInput"
                  module="insuree"
                  label="Insuree.chfId"
                  required={true}
                  readOnly={readOnly}
                  value={edited?.chfId}
                  editedId={editedId}
                  onChange={(v) => this.updateAttribute("chfId", v)}
                />
              </Grid>
              {this.renderLastNameFirst ? (
                <>
                  {this.renderLastNameField(edited, classes, readOnly)}
                  {this.renderGivenNameField(edited, classes, readOnly)}
                </>
              ) : (
                <>
                  {this.renderGivenNameField(edited, classes, readOnly)}
                  {this.renderLastNameField(edited, classes, readOnly)}
                </>
              )}
              <Grid item xs={8}>
                <Grid container>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={!!edited ? edited.dob : null}
                      module="insuree"
                      label="Insuree.dob"
                      readOnly={readOnly}
                      required={true}
                      maxDate={new Date()}
                      onChange={(v) => this.updateAttribute("dob", v)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeGenderPicker"
                      value={!!edited && !!edited.gender ? edited.gender.code : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={false}
                      required={true}
                      onChange={(v) => this.updateAttribute("gender", { code: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeMaritalStatusPicker"
                      value={!!edited && !!edited.marital ? edited.marital : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("marital", v)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={!!edited && !!edited.cardIssued}
                          disabled={readOnly}
                          onChange={(v) => this.updateAttribute("cardIssued", !edited || !edited.cardIssued)}
                        />
                      }
                      label={formatMessage(intl, "insuree", "Insuree.cardIssued")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <PublishedComponent
                      pubRef="insuree.InsureeAddress"
                      value={edited}
                      module="insuree"
                      readOnly={readOnly}
                      onChangeLocation={(v) => this.updateAttribute("currentVillage", v)}
                      onChangeAddress={(v) => this.updateAttribute("currentAddress", v)}
                    />
                  </Grid>
                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.phone"
                      readOnly={readOnly}
                      value={!!edited && !!edited.phone ? edited.phone : ""}
                      onChange={(v) => this.updateAttribute("phone", v)}
                    />
                  </Grid>
                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.email"
                      readOnly={readOnly}
                      value={!!edited && !!edited.email ? edited.email : ""}
                      onChange={(v) => this.updateAttribute("email", v)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.ProfessionPicker"
                      module="insuree"
                      value={!!edited && !!edited.profession ? edited.profession.id : null}
                      readOnly={readOnly}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("profession", { id: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.EducationPicker"
                      module="insuree"
                      value={!!edited && !!edited.education ? edited.education.id : ""}
                      readOnly={readOnly}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("education", { id: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.IdentificationTypePicker"
                      module="insuree"
                      value={!!edited && !!edited.typeOfId ? edited.typeOfId.code : null}
                      readOnly={readOnly}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("typeOfId", { code: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.passport"
                      readOnly={readOnly}
                      value={!!edited && !!edited.passport ? edited.passport : ""}
                      onChange={(v) => this.updateAttribute("passport", !!v ? v : null)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeStatusPicker"
                      label="Insuree.status"
                      value={edited?.status}
                      withNull={false}
                      module="insuree"
                      readOnly={!edited?.uuid || readOnly}
                      onChange={(v) => this.updateAttributes({ "status": v, "statusReason": null })}
                      required={this.isInsureeStatusRequired}
                    />
                  </Grid>
                  {!!edited?.status && edited?.status !== INSUREE_ACTIVE_STRING && (
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="core.DatePicker"
                        label="Insuree.statusDate"
                        value={edited?.statusDate}
                        module="insuree"
                        readOnly={readOnly}
                        required={true}
                        onChange={(v) => this.updateAttribute("statusDate", v)}
                      />
                    </Grid>
                  )}
                  {!!edited?.status && edited?.status !== INSUREE_ACTIVE_STRING && (
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="insuree.InsureeStatusReasonPicker"
                        label="Insuree.statusReason"
                        value={edited?.statusReason}
                        module="insuree"
                        readOnly={readOnly}
                        withNull={false}
                        statusType={edited.status}
                        required={true}
                        onChange={(v) => this.updateAttribute("statusReason", v)}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.Avatar"
                  photo={!!edited ? edited.photo : null}
                  readOnly={readOnly}
                  required={this.isPhotoRequired}
                  withMeta={true}
                  onChange={(v) => this.updateAttribute("photo", !!v ? v : null)}
                />
              </Grid>
              <Contributions
                {...this.props}
                updateAttribute={this.updateAttribute}
                contributionKey={INSUREE_INSUREE_CONTRIBUTION_KEY}
              />
            </Grid>
          </Paper>
          <Contributions
            {...this.props}
            updateAttribute={this.updateAttribute}
            contributionKey={INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(InsureeMasterPanel)));