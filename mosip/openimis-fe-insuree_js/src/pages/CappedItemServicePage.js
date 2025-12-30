import React, { Component } from "react";
import { ProxyPage } from "@openimis/fe-core";

class CappedItemServicePage extends Component {
  render() {
    return <ProxyPage url={`/CappedItemService.aspx${window.location.search}`} />;
  }
}

export { CappedItemServicePage };
