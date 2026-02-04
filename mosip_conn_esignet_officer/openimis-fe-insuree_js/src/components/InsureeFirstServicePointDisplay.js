import React from "react";
import { decodeId, FormattedMessage, PublishedComponent } from "@openimis/fe-core";
import { Typography } from "@material-ui/core";

const InsureeFirstServicePointDisplay = ({ insuree }) => {
  if (!insuree?.healthFacility) return <FormattedMessage module="insuree" id="insuree.noFSP" />;
  return (
    <div>
      <Typography variant="h6">
        <FormattedMessage module="insuree" id="FSP.title" />
      </Typography>
      <PublishedComponent pubRef="location.HealthFacilityFullPath" hfid={decodeId(insuree.healthFacility.id)} />
    </div>
  );
};

export default InsureeFirstServicePointDisplay;
