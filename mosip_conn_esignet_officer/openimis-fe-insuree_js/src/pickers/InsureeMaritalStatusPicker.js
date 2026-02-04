import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { INSUREE_MARITAL_STATUS } from "../constants";

class InsureeMaritalStatusPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="insuree"
        label="InsureeMaritalStatus"
        constants={INSUREE_MARITAL_STATUS}
        {...this.props}
      />
    );
  }
}

export default InsureeMaritalStatusPicker;
