import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { FAMILY_POVERTY_STATUS } from "../constants";

class FamilyPovertyStatusPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="insuree"
        label="Family.povertyStatus"
        constants={FAMILY_POVERTY_STATUS}
        {...this.props}
      />
    );
  }
}

export default FamilyPovertyStatusPicker;
