import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import InsureeForm from "../components/InsureeForm";
import { createInsuree, updateInsuree } from "../actions";
import { RIGHT_INSUREE, RIGHT_INSUREE_ADD, RIGHT_INSUREE_EDIT } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

class InsureePage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree");
  };

  save = (insuree) => {
    if (!insuree.uuid) {
      this.props.createInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "CreateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
    } else {
      this.props.updateInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
    }
  };

  render() {
    const { classes, modulesManager, history, rights, insuree_uuid, family_uuid } = this.props;
    if (!rights.includes(RIGHT_INSUREE)) return null;
    return (
      <div className={classes.page}>
        <InsureeForm
          insuree_uuid={insuree_uuid !== "_NEW_" ? insuree_uuid : null}
          family_uuid={family_uuid}
          back={(e) => historyPush(modulesManager, history, "insuree.route.insurees")}
          add={rights.includes(RIGHT_INSUREE_ADD) ? this.add : null}
          save={rights.includes(RIGHT_INSUREE_EDIT) ? this.save : null}
          readOnly={!rights.includes(RIGHT_INSUREE_EDIT) || !rights.includes(RIGHT_INSUREE_ADD)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  insuree_uuid: props.match.params.insuree_uuid,
  family_uuid: props.match.params.family_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createInsuree, updateInsuree }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureePage)))),
  ),
);
