import React from "react";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Button, Divider, Checkbox, FormControlLabel, CircularProgress } from "@material-ui/core";
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'

import {
  formatMessage,
  withTooltip,
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  Contributions,
  withModulesManager,
  ProgressOrError,
} from "@openimis/fe-core";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});
import { DEFAULT, INSUREE_ACTIVE_STRING } from "../constants";
import { generateSignInUrl, handleVerifyInsuree, populateInsureeFromAuthCode } from "../utils/mosipAuth.utils";
import { sendVerificationEmail } from "../actions";

const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";

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
    this.state = {
      verifying: false,
      verifyError: null,
      qrOpen: false,
      isSendingEmail: false,
    };
  }

  async componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      this.setState({ verifying: true, verifyError: null });
      try {
        const { patch } = await populateInsureeFromAuthCode(
          this.props.dispatch,
          code,
          this.props.edited
        );
        this.updateAttributes(patch);
      } catch (e) {
        this.setState({ verifyError: e?.message || "Verification failed" });
        // console.error(e);
      } finally {
        this.setState({ verifying: false });
      }
    }
  }

  handleSendEmail = async () => {
    const { edited, intl, dispatch } = this.props;

    if (!edited?.email) {
      const errorMsg = formatMessage(intl, "insuree", "InsureeMasterPanel.error.noEmail");
      alert(errorMsg || "Insuree does not have an email address.");
      return;
    }
    
    // MODIFICATION: Set sending state to true
    this.setState({ isSendingEmail: true });

    try {
      const signInUrl = generateSignInUrl(edited.uuid);
      const clientMutationLabel = `Send verification email to ${edited.chfId}`;
      const response = await dispatch(sendVerificationEmail(edited.uuid, signInUrl, clientMutationLabel));

      if (response && response.error) {
        throw new Error(response.error.message || "Unknown error from server");
      }
      
      if (response?.data?.errors) {
        throw new Error(response.data.errors[0].message || "GraphQL mutation failed");
      }

      const successMsg = formatMessage(intl, "insuree", "InsureeMasterPanel.emailSent", { email: edited.email });
      alert(successMsg || `Email successfully sent to ${edited.email}`);

    } catch (error) {
      console.error("Failed to send verification email:", error);
      const errorMsg = formatMessage(intl, "insuree", "InsureeMasterPanel.error.emailFailed");
      alert(errorMsg || "Failed to send email. Please check the console for details.");
    } finally {
      // MODIFICATION: Set sending state back to false
      this.setState({ isSendingEmail: false });
    }
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

  openQr = () => this.setState({ qrOpen: true });
  closeQr = () => this.setState({ qrOpen: false });




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
    const insureeUuid = edited?.uuid || null;
    const showPassportQr = Boolean(insureeUuid) && edited?.typeOfId?.code === "N" && !!edited?.passport;
    const signInUrl = showPassportQr ? generateSignInUrl(insureeUuid) : "";



    if(this.state.verifying) {
      return <ProgressOrError progress={this.state.verifying} error={this.state.verifyError} />
    }

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
            <Grid container justify="space-between" alignItems="center">
              <div>
                <Typography variant="h5">
                  <FormattedMessage module="insuree" id={title} values={titleParams} />
                </Typography>
              </div>
              
              <Dialog open={this.state.qrOpen} onClose={this.closeQr} maxWidth="xs" fullWidth>
  <DialogTitle>Verify Insuree</DialogTitle>
  <DialogContent style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
    <QRCodeSVG
      value={signInUrl || ''}
      size={320}          // BIG and easy to scan
      level="H"
      includeMargin
      bgColor="#fff"
      fgColor="#000"
      aria-label="Verify via MOSIP (QR)"
    />
  </DialogContent>
  <DialogActions style={{ justifyContent: 'space-between' }}>
    <Button onClick={this.closeQr}>
      Close
    </Button>
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        this.closeQr();
        handleVerifyInsuree(edited.uuid);   // same link action as before
      }}
    >
      Verify now
    </Button>
  </DialogActions>
</Dialog>

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
                      value={edited?.typeOfId?.code ?? ""}                    // use '' instead of null
                      readOnly={readOnly}
                      withNull                                                // allow clearing
                      nullLabel={formatMessage(intl, "insuree", "IdentificationType.none")}
                      onChange={(v) => this.updateAttribute("typeOfId", v ? { code: v } : null)} // store null when cleared
                    />
                  </Grid>
                  <Grid item xs={showPassportQr ? 2 : 3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.passport"
                      readOnly={readOnly}
                      value={edited?.passport || ""}
                      onChange={(v) => this.updateAttribute("passport", v || null)}
                    />
                  </Grid>

                  {showPassportQr && (
                    <Grid item xs={1} className={classes.item} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        // MODIFICATION: Disable button while sending
                        disabled={this.state.isSendingEmail}
                        onClick={this.handleSendEmail}
                        style={{ height: '36px', width: '100%' }}
                      >
                        Email
                      </Button>
                      {/* MODIFICATION: Conditionally render the progress spinner */}
                      {this.state.isSendingEmail && (
                        <CircularProgress
                          size={24}
                          style={{
                            color: "primary",
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px',
                          }}
                        />
                      )}
                    </Grid>
                  )}
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
                  required={this.isPhotoRequired ==  true ? true : false}
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

export default connect()(
  withModulesManager(withTheme(withStyles(styles)(InsureeMasterPanel)))
);
