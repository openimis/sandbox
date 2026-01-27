import React, { useState } from "react";

import {
  Grid,
  FormControlLabel,
  Checkbox
} from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  PublishedComponent,
  TextInput,
  useTranslations,
  useModulesManager
} from "@openimis/fe-core";
import { EMPTY_STRING, MODULE_NAME } from "../constants";

const useStyles = makeStyles((theme) => ({
  item: theme.paper.item,
}));

const InsureeAddress = ({
  onChangeLocation,
  onChangeAddress,
  readOnly,
  value,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const [location, setLocation] = useState(true);
  const [address, setAddress] = useState(true);

  return (
    <Grid container>
      <Grid item xs={6} className={classes.item}>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={location}
              disabled={readOnly}
              onChange={(e) => setLocation((prevState) => !prevState)}
            />
          }
          label={formatMessage("Insuree.currentVillage.sameAsFamily")}
        />
        {!location &&
          <PublishedComponent
            pubRef="location.DetailedLocation"
            withNull={true}
            value={value?.currentVillage ?? null}
            split={true}
            readOnly={readOnly}
            onChange={onChangeLocation}
            filterLabels={false}
          />
        }
      </Grid>
      <Grid item xs={6} className={classes.item}>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={address}
              disabled={readOnly}
              onChange={(e) => setAddress((prevState) => !prevState)}
            />
          }
          label={formatMessage("Insuree.currentAddress.sameAsFamily")}
        />
        {!address &&
          <TextInput
            module="insuree"
            label="Insuree.currentAddress"
            multiline
            rows={4}
            readOnly={readOnly}
            value={value?.currentAddress ?? EMPTY_STRING}
            onChange={onChangeAddress}
          />
        }
      </Grid>
    </Grid>
  )
}

export default InsureeAddress;
