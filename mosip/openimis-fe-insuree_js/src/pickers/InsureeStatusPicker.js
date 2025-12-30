import React from "react";

import { ConstantBasedPicker } from "@openimis/fe-core";

import { INSUREE_STATUS } from "../constants";

const InsureeStatusPicker = (props) => {
  return <ConstantBasedPicker module="insuree" label="Insuree.status" constants={INSUREE_STATUS} {...props} />;
};

export default InsureeStatusPicker;
