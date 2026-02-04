import React, { Component } from "react";
import { injectIntl } from "react-intl";
import _debounce from "lodash/debounce";

import { Checkbox, FormControlLabel, Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  withModulesManager,
  formatMessage,
  Contributions,
  PublishedComponent,
  ControlledField,
  TextInput,
} from "@openimis/fe-core";
import { DEFAULT, WITHOUT_STR } from "../constants";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
  paperDivider: theme.paper.divider,
});

const INSUREE_FILTER_CONTRIBUTION_KEY = "insuree.Filter";

class InsureeFilter extends Component {
  constructor(props) {
    super(props);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-insuree", "debounceTime", 200),
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _filterTextFieldValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : "";
  };

  _onChangeCheckbox = (key, value) => {
    let filters = [
      {
        id: key,
        value: value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
  };

  renderLastNameField = () => {
    const { classes } = this.props;
    return (
      <ControlledField
        module="insuree"
        id="InsureeFilter.lastName"
        field={
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="insuree"
              label="Insuree.lastName"
              name="lastName"
              value={this._filterTextFieldValue("lastName")}
              onChange={(v) =>
                this.debouncedOnChangeFilter([
                  {
                    id: "lastName",
                    value: v,
                    filter: `lastName_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />
    );
  };

  renderGivenNameField = () => {
    const { classes } = this.props;
    return (
      <ControlledField
        module="insuree"
        id="InsureeFilter.givenName"
        field={
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="insuree"
              label="Insuree.otherNames"
              name="givenName"
              value={this._filterTextFieldValue("givenName")}
              onChange={(v) =>
                this.debouncedOnChangeFilter([
                  {
                    id: "givenName",
                    value: v,
                    filter: `otherNames_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />
    );
  };

  render() {
    const { intl, classes, filters, onChangeFilters } = this.props;
    return (
      <Grid container className={classes.form}>
        <ControlledField
          module="insuree"
          id="InsureeFilter.location"
          field={
            <Grid item xs={12}>
              <PublishedComponent
                pubRef="location.DetailedLocationFilter"
                withNull={true}
                filters={filters}
                onChangeFilters={onChangeFilters}
                anchor="parentLocation"
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="InsureeFilter.chfId"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.chfId"
                name="chfId"
                value={this._filterTextFieldValue("chfId")}
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "chfId",
                      value: v,
                      filter: `chfId_Istartswith: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField()}
            {this.renderGivenNameField()}
          </>
        ) : (
          <>
            {this.renderGivenNameField()}
            {this.renderLastNameField()}
          </>
        )}
        <Grid item xs={3}>
          <Grid container>
            <ControlledField
              module="insuree"
              id="InsureeFilter.gender"
              field={
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="insuree.InsureeGenderPicker"
                    withNull={true}
                    value={this._filterValue("gender")}
                    onChange={(v) =>
                      onChangeFilters([
                        {
                          id: "gender",
                          value: v,
                          filter: !!v ? `gender_Code: "${v}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
              }
            />
            <ControlledField
              module="insuree"
              id="InsureeFilter.maritalStatus"
              field={
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="insuree.InsureeMaritalStatusPicker"
                    value={this._filterValue("maritalStatus")}
                    onChange={(v) =>
                      onChangeFilters([
                        {
                          id: "maritalStatus",
                          value: v,
                          filter: `marital: "${v}"`,
                        },
                      ])
                    }
                  />
                </Grid>
              }
            />
          </Grid>
        </Grid>
        <ControlledField
          module="insuree"
          id="InsureeFilter.email"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.email"
                name="email"
                value={this._filterTextFieldValue("email")}
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "email",
                      value: v,
                      filter: `email_Icontains: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="InsureeFilter.phone"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.phone"
                name="phone"
                value={this._filterTextFieldValue("phone")}
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "phone",
                      value: v,
                      filter: `phone_Icontains: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="InsureeFilter.familyStatus"
          field={
            <Grid item xs={6} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.FamilyStatusPicker"
                value={this._filterValue("familyStatus")}
                onChange={(s) =>
                  onChangeFilters([
                    {
                      id: "familyStatus",
                      value: s,
                      filter: `family_Isnull: ${s === WITHOUT_STR}`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="InsureeFilter.dob"
          field={
            <Grid item xs={3}>
              <Grid container>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue("dobFrom")}
                    module="insuree"
                    label="Insuree.dobFrom"
                    {...(filters.dobTo ? { maxDate: filters.dobTo.value } : null)}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: "dobFrom",
                          value: d,
                          filter: `dob_Gte: "${d}"`,
                        },
                      ])
                    }
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue("dobTo")}
                    module="insuree"
                    label="Insuree.dobTo"
                    {...(filters.dobFrom ? { minDate: filters.dobFrom.value } : null)}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: "dobTo",
                          value: d,
                          filter: `dob_Lte: "${d}"`,
                        },
                      ])
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          }
        />
        <Grid item xs={3}>
          <Grid container>
            <ControlledField
              module="insuree"
              id="InsureeFilter.photoStatus"
              field={
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="insuree.PhotoStatusPicker"
                    value={this._filterValue("photoStatus")}
                    onChange={(s) =>
                      onChangeFilters([
                        {
                          id: "photoStatus",
                          value: s,
                          filter: `photo_Isnull: ${s === WITHOUT_STR}`,
                        },
                      ])
                    }
                  />
                </Grid>
              }
            />
            <ControlledField
              module="insuree"
              id="InsureeFilter.showHistory"
              field={
                <Grid item xs={6} className={classes.item}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={!!this._filterValue("showHistory")}
                        onChange={(event) => this._onChangeCheckbox("showHistory", event.target.checked)}
                      />
                    }
                    label={formatMessage(intl, "insuree", "InsureeFilter.showHistory")}
                  />
                </Grid>
              }
            />
          </Grid>
        </Grid>
        <Contributions
          filters={filters}
          onChangeFilters={onChangeFilters}
          contributionKey={INSUREE_FILTER_CONTRIBUTION_KEY}
        />
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(InsureeFilter))));
