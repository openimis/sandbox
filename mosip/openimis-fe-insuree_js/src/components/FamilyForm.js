import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";

import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  parseData,
  Helmet,
} from "@openimis/fe-core";
import { fetchFamily, newFamily, createFamily, fetchFamilyMutation } from "../actions";
import { INSUREE_ACTIVE_STRING, RIGHT_FAMILY } from "../constants";
import { insureeLabel, isValidInsuree } from "../utils/utils";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";
import FamilyMasterPanel from "./FamilyMasterPanel";
import FamilyInsureesOverview from "./FamilyInsureesOverview";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY = "insuree.FamilyOverview.mutations";

class FamilyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    family: this._newFamily(),
    newFamily: true,
    confirmedAction: null,
    isSaved: false,
  };

  _newFamily() {
    let family = {
      jsonExt: {},
      headInsuree: {
        status: INSUREE_ACTIVE_STRING,
      },
    };
    return family;
  }

  componentDidMount() {
    if (this.props.family_uuid) {
      this.setState(
        (state, props) => ({ family_uuid: props.family_uuid }),
        (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
      );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.fetchedFamily && !!this.props.fetchedFamily) {
      var family = this.props.family;
      if (family) {
        family.ext = !!family.jsonExt ? JSON.parse(family.jsonExt) : {};
        this.setState({ family, family_uuid: family.uuid, lockNew: false, newFamily: false });
      }
    } else if (prevProps.family_uuid && !this.props.family_uuid) {
      this.setState({ family: this._newFamily(), newFamily: true, lockNew: false, family_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        family: { ...state.family, clientMutationId: props.mutation.clientMutationId },
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  _add = () => {
    this.setState(
      (state) => ({
        family: this._newFamily(),
        newFamily: true,
        lockNew: false,
        reset: state.reset + 1,
      }),
      (e) => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  reload = async () => {
    const { isSaved } = this.state;
    const { modulesManager, history, mutation, fetchFamilyMutation, family_uuid: familyUuid, fetchFamily } = this.props;

    if (familyUuid) {
      try {
        await fetchFamily(modulesManager, familyUuid);
      } catch (error) {
        console.error(`[RELOAD_FAMILY]: Fetching family details failed. ${error}`);
      }
      return;
    }

    if (isSaved) {
      try {
        const { clientMutationId } = mutation;
        const response = await fetchFamilyMutation(modulesManager, clientMutationId);
        const createdFamilyUuid = parseData(response.payload.data.mutationLogs)[0].families[0].family.uuid;

        await fetchFamily(modulesManager, createdFamilyUuid);
        historyPush(modulesManager, history, "insuree.route.familyOverview", [createdFamilyUuid]);
      } catch (error) {
        console.error(`[RELOAD_FAMILY]: Fetching family details failed. ${error}`);
      }
      return;
    }

    this.setState({
      lockNew: false,
      reset: 0,
      family: this._newFamily(),
      newFamily: true,
      confirmedAction: null,
      isSaved: false,
    });
  };

  canSave = () => {
    if (!this.state.family.location) return false;
    if (!this.state.family.uuid && !this.props.isChfIdValid) return false;
    if (this.state.family.validityTo) return false;
    if (this.state.family.confirmationType?.isConfirmationNumberRequired && !this.state.family.confirmationNo)
      return false;
    return this.state.family.headInsuree && isValidInsuree(this.state.family.headInsuree, this.props.modulesManager);
  };

  _save = (family) => {
    this.setState({ lockNew: !family.uuid, isSaved: true }, (e) => this.props.save(family));
  };

  onEditedChanged = (family) => {
    this.setState({ family, newFamily: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  render() {
    const {
      modulesManager,
      classes,
      state,
      rights,
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      insuree,
      overview = false,
      openFamilyButton,
      readOnly = false,
      add,
      save,
      back,
    } = this.props;
    const { family, newFamily, isSaved } = this.state;
    if (!rights.includes(RIGHT_FAMILY)) return null;
    let runningMutation = !!family && !!family.clientMutationId;
    let contributedMutations = modulesManager.getContribs(INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY);
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    let actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation && !isSaved,
      },
    ];
    const shouldBeLocked = !!runningMutation || family?.validityTo;
    return (
      <div className={shouldBeLocked ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "insuree",
            !!this.props.overview ? "FamilyOverview.title" : "Family.title",
            { label: insureeLabel(this.state.family.headInsuree) },
          )}
        />
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
          <Form
            module="insuree"
            title="FamilyOverview.title"
            titleParams={{ label: insureeLabel(this.state.family.headInsuree) }}
            edited_id={family_uuid}
            edited={family}
            reset={this.state.reset}
            back={back}
            add={!!add && !newFamily ? this._add : null}
            readOnly={readOnly || runningMutation || !!family.validityTo}
            actions={actions}
            openFamilyButton={openFamilyButton}
            overview={overview}
            HeadPanel={FamilyMasterPanel}
            Panels={overview ? [FamilyInsureesOverview] : [HeadInsureeMasterPanel]}
            contributedPanelsKey={
              overview ? INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY : INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY
            }
            family={family}
            insuree={insuree}
            onEditedChanged={this.onEditedChanged}
            canSave={this.canSave}
            save={!!save ? this._save : null}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, journalize, coreConfirm },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyForm)))),
  ),
);
