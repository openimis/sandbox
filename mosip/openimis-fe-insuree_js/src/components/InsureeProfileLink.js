import React from "react";

import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Person } from "@material-ui/icons";

import { useModulesManager, useTranslations, useHistory, historyPush } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const useStyles = makeStyles(() => ({
  label: {
    marginLeft: "8px",
  },
}));

const InsureeProfileLink = ({ insureeUuid }) => {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME);

  const goToInsureeProfile = (modulesManager, history, uuid, showInAnotherTab = false) =>
    historyPush(modulesManager, history, "insuree.route.insureeProfile", [uuid], showInAnotherTab);

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => goToInsureeProfile(modulesManager, history, insureeUuid)}
    >
      <Person />
      <span className={classes.label}> {formatMessage("insureeSummaries.goToTheProfile")} </span>
    </Button>
  );
};

export default InsureeProfileLink;
