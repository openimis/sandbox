import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { AssignmentInd, GroupAdd, People, Person } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import { DEFAULT, RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_INSUREE } from "../constants";

const INSUREE_MAIN_MENU_CONTRIBUTION_KEY = "insuree.MainMenu";
const WORKER_MAIN_MENU_CONTRIBUTION_KEY = "worker.MainMenu";

class InsureeMainMenu extends Component {
  constructor(props) {
    super(props);
    this.isWorker = props.modulesManager.getConf("fe-core", "isWorker", DEFAULT.IS_WORKER);
    this.genericVoucherEnabled = props.modulesManager.getConf(
      "fe-worker_voucher",
      "genericVoucherEnabled",
      DEFAULT.GENERIC_VOUCHER_ENABLED,
    );
  }

  render() {
    const { modulesManager, rights } = this.props;
    let entries = [];

    if (this.isWorker) {
      const config = { genericVoucherEnabled: this.genericVoucherEnabled };

      entries.push(
        ...this.props.modulesManager
          .getContribs(WORKER_MAIN_MENU_CONTRIBUTION_KEY)
          .filter((c) => !c.filter || c.filter(rights, config)),
      );

      if (!entries) return null;

      return (
        <MainMenuContribution
          {...this.props}
          header={formatMessage(this.props.intl, "insuree", "workersMainMenu")}
          icon={<AssignmentInd />}
          entries={entries}
          menuId="InsureeMainMenu"
        />
      );
    }

    if (rights.includes(RIGHT_FAMILY_ADD)) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.addFamilyOrGroup"),
        icon: <GroupAdd />,
        route: "/" + modulesManager.getRef("insuree.route.family"),
        withDivider: true,
        id: "insuree.addFamilyOrGroup", 
      });
    }
    if (rights.includes(RIGHT_FAMILY)) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.familiesOrGroups"),
        icon: <People />,
        route: "/" + modulesManager.getRef("insuree.route.families"),
        id: "insuree.familiesOrGroups", 
      });
    }
    if (rights.includes(RIGHT_INSUREE)) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.insurees"),
        icon: <Person />,
        route: "/" + modulesManager.getRef("insuree.route.insurees"),
        id: "insuree.insurees", 
      });
    }
    
      entries.push({
        text: "ODK workfow",
        icon: <Person />,
        route: "odk/importflow",
        id: "insuree.insurees", 
      });
    
    console.log("entries", entries);
    entries.push(
      ...this.props.modulesManager
        .getContribs(INSUREE_MAIN_MENU_CONTRIBUTION_KEY)
        .filter((c) => !c.filter || c.filter(rights)),
    );

    if (!entries.length) return null;
    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "insuree", "mainMenu")}
        icon={<AssignmentInd />}
        entries={entries}
        menuId="InsureeMainMenu"
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(InsureeMainMenu)));
