import { Grid } from "@material-ui/core";
import { PublishedComponent } from "@openimis/fe-core";
import React from "react";

const EnrolledFamiliesReport = (props) => {
  const { values, setValues } = props;

  return (
    <Grid container direction="column" spacing={1}>
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
          locationLevel={2}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateFrom}
          module="insuree"
          required
          label="EnrolledFamiliesReport.dateFrom"
          onChange={(dateFrom) => setValues({ ...values, dateFrom })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateTo}
          module="insuree"
          required
          label="EnrolledFamiliesReport.dateTo"
          onChange={(dateTo) => setValues({ ...values, dateTo })}
        />
      </Grid>
    </Grid>
  );
};

export default EnrolledFamiliesReport;
