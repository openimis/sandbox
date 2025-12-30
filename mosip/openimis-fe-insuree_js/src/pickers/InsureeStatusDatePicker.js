import React from "react";
import {
  PublishedComponent
} from "@openimis/fe-core";

const InsureeStatusDatePicker = (props) => {
  const {
    readOnly,
    value,
  } = props;

  return (
    <PublishedComponent
      pubRef="core.DatePicker"
      value={value}
      module="insuree"
      label="Insuree.statusDate"
      readOnly={readOnly}
      onChange={(date) => updateAttribute("insureeStatusDate", date)}
    />
  )
};

export default InsureeStatusDatePicker;
