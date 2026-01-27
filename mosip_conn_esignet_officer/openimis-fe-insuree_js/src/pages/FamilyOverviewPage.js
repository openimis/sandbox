import React, { Component } from "react";
import { connect } from "react-redux";
import { Edit as EditIcon } from "@material-ui/icons";
import { historyPush, withModulesManager, withHistory } from "@openimis/fe-core";
import FamilyPage from "./FamilyPage";

class FamilyOverviewPage extends Component {
  render() {
    const { history, modulesManager, family_uuid } = this.props;
    var actions = [
      {
        doIt: (e) => historyPush(modulesManager, history, "insuree.route.family", [family_uuid]),
        icon: <EditIcon />,
        onlyIfDirty: false,
      },
    ];
    return <FamilyPage {...this.props} readOnly={true} overview={true} actions={actions} />;
  }
}

const mapStateToProps = (state, props) => ({
  family_uuid: props.match.params.family_uuid,
});

export default withHistory(withModulesManager(connect(mapStateToProps)(FamilyOverviewPage)));
