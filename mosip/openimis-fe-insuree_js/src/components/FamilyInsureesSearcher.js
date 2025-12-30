import React, { Fragment } from 'react';
import _debounce from "lodash/debounce";

import { Typography, Grid, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { YoutubeSearchedFor as ResetFilterIcon } from "@material-ui/icons";

import {
  useTranslations,
  useModulesManager,
  ControlledField,
  TextInput,
  withTooltip,
  PublishedComponent
} from "@openimis/fe-core";
import { EMPTY_STRING } from "../constants";

const useStyles = makeStyles((theme) => ({
  item: theme.paper.item,
  tableTitle: theme.table.title,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
}));

const FamilyInsureesSearcher = ({ filters, onChangeFilters, resetFilters }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  const debouncedOnChangeFilter = _debounce(
    onChangeFilters, modulesManager.getConf("fe-insuree", "debounceTime", 200),
  );

  const filterValue = (key) => filters?.[key]?.value ?? null;

  const filterTextFieldValue = (key) => filters?.[key]?.value ?? EMPTY_STRING;

  const actions = [
    {
      button: (
        <IconButton onClick={resetFilters}>
          <ResetFilterIcon />
        </IconButton>
      ),
      tooltip: formatMessage("resetFilters.tooltip"),
    },
  ]

  return (
    <Fragment>
      <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
        <Grid item xs={8}>
          <Typography className={classes.tableTitle}>
            {formatMessage('Insuree.searchCriteria')}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Grid container justify="flex-end">
            {actions.map((a, idx) => {
              return (
                <Grid item key={`searcher-action-${idx}`} className={classes.paperHeaderAction}>
                  {withTooltip(a.button, a.tooltip)}
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
      <Grid container className={classes.item}>
        <ControlledField
          module="insuree"
          id="FamilyInsureesSearch.chfId"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.chfId"
                name="chfId"
                value={filterTextFieldValue("chfId")}
                onChange={(chfId) =>
                  debouncedOnChangeFilter([
                    {
                      id: "chfId",
                      value: chfId,
                      filter: `chfId_Istartswith: "${chfId}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="FamilyInsureesSearch.lastName"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.lastName"
                name="lastName"
                value={filterTextFieldValue("lastName")}
                onChange={(name) =>
                  debouncedOnChangeFilter([
                    {
                      id: "lastName",
                      value: name,
                      filter: `lastName_Icontains: "${name}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="FamilyInsureesSearch.givenName"
          field={
            <Grid item xs={3} className={classes.item}>
              <TextInput
                module="insuree"
                label="Insuree.otherNames"
                name="givenName"
                value={filterTextFieldValue("givenName")}
                onChange={(name) =>
                  debouncedOnChangeFilter([
                    {
                      id: "givenName",
                      value: name,
                      filter: `otherNames_Icontains: "${name}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id="FamilyInsureesSearch.gender"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.InsureeGenderPicker"
                withNull={true}
                value={filterValue("gender")}
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
          id="FamilyInsureesSearch.dob"
          field={
            <Grid container>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={filterValue("dobFrom")}
                  module="insuree"
                  label="Insuree.dobFrom"
                  onChange={(dateFrom) =>
                    onChangeFilters([
                      {
                        id: "dobFrom",
                        value: dateFrom,
                        filter: `dob_Gte: "${dateFrom}"`,
                      },
                    ])
                  }
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={filterValue("dobTo")}
                  module="insuree"
                  label="Insuree.dobTo"
                  minDate={filters?.dobFrom}
                  onChange={(dateTo) =>
                    onChangeFilters([
                      {
                        id: "dobTo",
                        value: dateTo,
                        filter: `dob_Lte: "${dateTo}"`,
                      },
                    ])
                  }
                />
              </Grid>
            </Grid>
          }
        />
      </Grid>
    </Fragment>
  )
}

export default FamilyInsureesSearcher;
