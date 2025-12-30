import React from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { FAMILY_STATUS } from "../constants";

const FamilyStatusPicker = (props) => {
  return <ConstantBasedPicker module="insuree" label="FamilyStatus" constants={FAMILY_STATUS} {...props} />;
};

export default FamilyStatusPicker;
