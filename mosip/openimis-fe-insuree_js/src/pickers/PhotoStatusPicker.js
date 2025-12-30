import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PHOTO_STATUS } from "../constants";

class PhotoStatusPicker extends Component {
  render() {
    return <ConstantBasedPicker module="insuree" label="PhotoStatus" constants={PHOTO_STATUS} {...this.props} />;
  }
}

export default PhotoStatusPicker;
