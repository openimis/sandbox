import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withModulesManager, ProgressOrError } from "@openimis/fe-core";
import FamilyMasterPanel from "./FamilyMasterPanel";
import { fetchFamily } from "../actions";

class FamilyDisplayPanel extends Component {
  state = {
    family: null,
  };

  componentDidMount() {
    if (!!this.props.family_uuid) {
      this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
    } else {
      this.setState({ family: this.props.family });
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.family_uuid !== this.props.family_uuid) {
      this.setState({ family: null }, (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid));
    } else if (!prevProps.fetchedFamily && !!this.props.fetchedFamily) {
      this.setState({ family: this.props.family });
    }
  }

  render() {
    const { fetchingFamily, errorFamily } = this.props;
    return (
      <Fragment>
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {!!this.state.family && (
          <FamilyMasterPanel
            {...this.props}
            readOnly={true}
            edited={this.state.family}
            overview={true}
            openFamilyButton={true}
          />
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state, props) => ({
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree?.insuree?.family,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchFamily }, dispatch);
};

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(FamilyDisplayPanel));
