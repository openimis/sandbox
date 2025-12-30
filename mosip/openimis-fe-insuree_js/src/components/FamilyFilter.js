import React, { Component, Fragment } from "react";
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
import { DEFAULT } from "../constants";

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

class FamilyFilter extends Component {
  state = {
    additionalFilters: {},
  };

  constructor(props) {
    super(props);
    this.filterFamiliesOnMembers = props.modulesManager.getConf("fe-insuree", "filterFamiliesOnMembers", true);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  debouncedOnChangeFilters = _debounce(
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

  renderLastNameField = (anchor, classes) => (
    <ControlledField
      module="insuree"
      id={`FamilyFilter.${anchor}.lastName`}
      field={
        <Grid item xs={2} className={classes.item}>
          <TextInput
            module="insuree"
            label={`Family.${anchor}.lastName`}
            name={`${anchor}_lastName`}
            value={this._filterTextFieldValue(`${anchor}.lastName`)}
            onChange={(v) =>
              this.debouncedOnChangeFilters([
                {
                  id: `${anchor}.lastName`,
                  value: v,
                  filter: !!v ? `${anchor}_LastName_Icontains: "${v}"` : null,
                },
              ])
            }
          />
        </Grid>
      }
    />
  );

  renderGivenNameField = (anchor, classes) => (
    <ControlledField
      module="insuree"
      id={`FamilyFilter.${anchor}.givenName`}
      field={
        <Grid item xs={2} className={classes.item}>
          <TextInput
            module="insuree"
            label={`Family.${anchor}.otherNames`}
            name={`${anchor}_givenName`}
            value={this._filterTextFieldValue(`${anchor}.givenName`)}
            onChange={(v) =>
              this.debouncedOnChangeFilters([
                {
                  id: `${anchor}.givenName`,
                  value: v,
                  filter: !!v ? `${anchor}_OtherNames_Icontains: "${v}"` : null,
                },
              ])
            }
          />
        </Grid>
      }
    />
  );

  personFilter = (anchor) => {
    const { classes, onChangeFilters } = this.props;
    return (
      <Fragment>
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.chfId`}
          field={
            <Grid item xs={1} className={classes.item}>
              <TextInput
                module="insuree"
                label={`Family.${anchor}.chfId`}
                name={`${anchor}_chfId`}
                value={this._filterTextFieldValue(`${anchor}.chfId`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.chfId`,
                      value: v,
                      filter: !!v ? `${anchor}_ChfId_Istartswith: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField(anchor, classes)}
            {this.renderGivenNameField(anchor, classes)}
          </>
        ) : (
          <>
            {this.renderGivenNameField(anchor, classes)}
            {this.renderLastNameField(anchor, classes)}
          </>
        )}
        <ControlledField
          module="insuree"
          id={`InsureeFilter.${anchor}.gender`}
          field={
            <Grid item xs={1} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.InsureeGenderPicker"
                withNull={true}
                label={`Family.${anchor}.gender`}
                value={this._filterValue(`${anchor}.gender`)}
                onChange={(v) =>
                  onChangeFilters([
                    {
                      id: `${anchor}.gender`,
                      value: v,
                      filter: !!v ? `${anchor}_Gender_Code: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.phone`}
          field={
            <Grid item xs={2} className={classes.item}>
              <TextInput
                module="insuree"
                label={`Family.${anchor}.phone`}
                name={`${anchor}_phone`}
                value={this._filterTextFieldValue(`${anchor}.phone`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.phone`,
                      value: v,
                      filter: !!v ? `${anchor}_Phone_Icontains: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.email`}
          field={
            <Grid item xs={2} className={classes.item}>
              <TextInput
                module="insuree"
                label={`Family.${anchor}.email`}
                name={`${anchor}_email`}
                value={this._filterTextFieldValue(`${anchor}.email`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.email`,
                      value: v,
                      filter: !!v ? `${anchor}_Email_Icontains: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.dob`}
          field={
            <Grid item xs={2}>
              <Grid container>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue(`${anchor}.dobFrom`)}
                    module="insuree"
                    label={`Family.${anchor}.dobFrom`}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: `${anchor}.dobFrom`,
                          value: d,
                          filter: !!d ? `${anchor}_Dob_Gte: "${d}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue(`${anchor}.dobTo`)}
                    module="insuree"
                    label={`Family.${anchor}.dobTo`}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: `${anchor}.dobTo`,
                          value: d,
                          filter: !!d ? `${anchor}_Dob_Lte: "${d}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          }
        />
      </Fragment>
    );
  };

  onChangeAdditionalFilters = (module, fltrs) => {
    const { onChangeFilters } = this.props;

    let filters = { ...this.state.additionalFilters };
    if (!("additionalFilters" in filters)) {
      filters.additionalFilters = {};
    }

    fltrs.forEach((filter) => {
      if (filter.value === null && module in filters.additionalFilters) {
        delete filters.additionalFilters[module][filter.id];
      } else {
        if (!(module in filters.additionalFilters)) {
          filters.additionalFilters[module] = {};
        }
        filters.additionalFilters[module][filter.id] = filter;
      }
    });
    let filterContent = !!JSON.stringify(filters.additionalFilters) ? JSON.stringify(filters.additionalFilters) : "{}";
    filterContent = filterContent.replaceAll('"', '\\"');

    onChangeFilters([
      {
        id: "additionalFilter",
        value: filters.additionalFilters,
        filter: `additionalFilter: "${filterContent}"`,
      },
    ]);
  };

  familyHeadFilter = () => this.personFilter("headInsuree");
  familyMemberFilter = () => this.personFilter("members");

  render() {
    const { intl, classes, filters, onChangeFilters, filterPaneContributionsKey } = this.props;
    return (
      <Grid container className={classes.form}>
        <ControlledField
          module="insuree"
          id="FamilyFilter.location"
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
        {this.familyHeadFilter()}
        {this.filterFamiliesOnMembers && this.familyMemberFilter()}
        <ControlledField
          module="insuree"
          id="FamilyFilter.poverty"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.FamilyPovertyStatusPicker"
                value={this._filterValue("poverty")}
                onChange={(v) =>
                  onChangeFilters([
                    {
                      id: "poverty",
                      value: v,
                      filter: v === null ? null : `nullAsFalsePoverty: ${v}`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="FamilyFilter.confirmationNo"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Family.confirmationNo"
                name="confirmationNo"
                value={this._filterTextFieldValue("confirmationNo")}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: "confirmationNo",
                      value: v,
                      filter: `confirmationNo_Istartswith: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="PolicyFilter.officer"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="policy.PolicyOfficerPicker"
                withNull={true}
                value={this._filterValue("officer")}
                onChange={(v) =>
                  onChangeFilters([
                    {
                      id: "officer",
                      value: v,
                      filter: v === null ? null : `officer: "${v.uuid}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {!!filterPaneContributionsKey && (
          <Contributions
            filters={filters}
            onChangeFilters={this.onChangeAdditionalFilters}
            contributionKey={filterPaneContributionsKey}
          />
        )}
        <ControlledField
          module="insuree"
          id="FamilyFilter.showHistory"
          field={
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!this._filterValue("showHistory")}
                    onChange={(event) => this._onChangeCheckbox("showHistory", event.target.checked)}
                  />
                }
                label={formatMessage(intl, "insuree", "FamilyFilter.showHistory")}
              />
            </Grid>
          }
        />
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(FamilyFilter))));
