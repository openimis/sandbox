import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const InsureePendingEnrollmentReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateFrom}
          module="insuree"
          required
          label="InsureePendingEnrollmentReport.dateFrom"
          onChange={(dateFrom) => setValues({ ...values, dateFrom })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateTo}
          module="insuree"
          required
          label="InsureePendingEnrollmentReport.dateTo"
          onChange={(dateTo) => setValues({ ...values, dateTo })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="insuree.InsureeOfficerPicker"
          value={values.officer}
          module="insuree"
          required
          label={formatMessage("InsureePendingEnrollmentReport.officer")}
          onChange={(officer) => setValues({ ...values, officer })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(location) =>
            setValues({
              ...values,
              location,
            })
          }
          required
          value={values.location}
          locationLevel={1}
        />
      </Grid>
    </Grid>
  );
};

export default InsureePendingEnrollmentReport;
