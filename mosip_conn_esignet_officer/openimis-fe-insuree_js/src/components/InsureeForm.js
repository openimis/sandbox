import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import _ from "lodash";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";

import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  journalize,
  Form,
  parseData,
  ProgressOrError,
  Helmet,
} from "@openimis/fe-core";
import { fetchInsureeFull, fetchFamily, clearInsuree, fetchInsureeMutation } from "../actions";
import { DEFAULT, INSUREE_ACTIVE_STRING, RIGHT_INSUREE } from "../constants";
import { insureeLabel, isValidInsuree } from "../utils/utils";
import FamilyDisplayPanel from "./FamilyDisplayPanel";
import InsureeMasterPanel from "../components/InsureeMasterPanel";

const styles = (theme) => ({
  page: theme.page,
  lockedPage: theme.page.locked,
});

const INSUREE_INSUREE_FORM_CONTRIBUTION_KEY = "insuree.InsureeForm";

class InsureeForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lockNew: false,
      reset: 0,
      insuree: this._newInsuree(),
      newInsuree: true,
      isSaved: false,
    };
  }

  _newInsuree() {
    let insuree = {};
    insuree.jsonExt = {};
    insuree.status = INSUREE_ACTIVE_STRING;
    insuree.statusReason = null;
    return insuree;
  }

  componentDidMount() {
    if (!!this.props.insuree_uuid) {
      if (!!this.props.family_uuid) {
        this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
      }

      this.setState(
        (state, props) => ({ insuree_uuid: props.insuree_uuid }),
        (e) => this.props.fetchInsureeFull(this.props.modulesManager, this.props.insuree_uuid),
      );
    } else if (!!this.props.family_uuid && (!this.props.family || this.props.family.uuid !== this.props.family_uuid)) {
      this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
    } else if (!!this.props.family_uuid) {
      let insuree = { ...this.state.insuree };
      insuree.family = { ...this.props.family };
      this.setState({ insuree });
    }
  }

  back = (e) => {
    const { modulesManager, history, family_uuid, insuree_uuid } = this.props;
    if (family_uuid) {
      historyPush(modulesManager, history, "insuree.route.familyOverview", [family_uuid]);
    } else {
      historyPush(modulesManager, history, "insuree.route.insurees");
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.fetchedInsuree !== this.props.fetchedInsuree && !!this.props.fetchedInsuree) {
      var insuree = this.props.insuree || {};
      insuree.ext = !!insuree.jsonExt ? JSON.parse(insuree.jsonExt) : {};
      this.setState({ insuree, insuree_uuid: insuree.uuid, lockNew: false, newInsuree: false });
    } else if (prevProps.insuree_uuid && !this.props.insuree_uuid) {
      this.setState({ insuree: this._newInsuree(), newInsuree: true, lockNew: false, insuree_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => {
        return {
          ...state.insuree,
          reset: this.state.reset + 1,
          clientMutationId: props.mutation.clientMutationId,
        };
      });
    }

    if (!this.state.insuree.family && this.props.family) {
      const updatedInsuree = { ...this.state.insuree, family: this.props.family };
      this.setState({ insuree: updatedInsuree });
    }
  }

  componentWillUnmount = () => {
    this.props.clearInsuree();
  };

  _add = () => {
    this.setState(
      (state) => ({
        insuree: this._newInsuree(),
        newInsuree: true,
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
    const {
      modulesManager,
      history,
      mutation,
      fetchInsureeMutation,
      insuree_uuid: insureeUuid,
      family_uuid: familyUuid,
      fetchInsureeFull,
    } = this.props;

    if (insureeUuid) {
      try {
        await fetchInsureeFull(modulesManager, insureeUuid);
      } catch (error) {
        console.error(`[RELOAD_INSUREE]: Fetching insuree details failed. ${error}`);
      } finally {
        this.setState((state) => ({
          ...state,
          clientMutationId: false,
        }));
      }
      return;
    }

    if (isSaved) {
      try {
        const { clientMutationId } = mutation;
        const response = await fetchInsureeMutation(modulesManager, clientMutationId);
        const createdInsureeUuid = parseData(response.payload.data.mutationLogs)[0].insurees[0].insuree.uuid;

        await fetchInsureeFull(modulesManager, createdInsureeUuid);
        historyPush(modulesManager, history, "insuree.route.insuree", [
          createdInsureeUuid,
          familyUuid ? familyUuid : null,
        ]);
      } catch (error) {
        console.error(`[RELOAD_INSUREE]: Error fetching insuree mutation: ${error}`);
      } finally {
        this.setState((state) => ({
          ...state,
          clientMutationId: false,
        }));
      }
      return;
    }

    this.setState({
      lockNew: false,
      reset: 0,
      insuree: this._newInsuree(),
      newInsuree: true,
      isSaved: false,
      clientMutationId: false,
    });
  };

  doesInsureeChange = () => {
    const { insuree } = this.props;
    if (_.isEqual(insuree, this.state.insuree)) {
      return false;
    }
    return true;
  };

  doesPhotoChange = () => {
    const { insuree } = this.props;
    if (_.isEqual(insuree.photo, this.state.insuree.photo)) {
      return false;
    }
    return true;
  };

  canSave = () => {
    const doesInsureeChange = this.doesInsureeChange();
    if (!doesInsureeChange) return false;
    if (this.state.lockNew) return false;
    if (!this.props.isChfIdValid) return false;

    return isValidInsuree(this.state.insuree, this.props.modulesManager);
  };

  _save = (insuree) => {
    if (insuree.uuid) {
      if (!this.doesPhotoChange()) delete insuree.photo
    }
    this.setState({ lockNew: !insuree.id, isSaved: true }, 
    (e) => this.props.save(insuree));
  };

  onEditedChanged = (insuree) => {
    this.setState({ insuree, newInsuree: false });
  };

  render() {
    const {
      rights,
      insuree_uuid,
      fetchingInsuree,
      fetchedInsuree,
      errorInsuree,
      family,
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      readOnly = false,
      classes,
      add,
      save,
    } = this.props;
    const { insuree, clientMutationId } = this.state;
    if (!rights.includes(RIGHT_INSUREE)) return null;
    let runningMutation = !!insuree && !!clientMutationId;
    let actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation && !this.state.isSaved,
      },
    ];
    const shouldBeLocked = !!runningMutation || insuree?.validityTo;
    return (
      <div className={shouldBeLocked ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(this.props.intl, "insuree", "Insuree.title", {
            label: insureeLabel(this.state.insuree),
          })}
        />
        <ProgressOrError progress={fetchingInsuree} error={errorInsuree} />
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedInsuree && !!insuree && insuree.uuid === insuree_uuid) || !insuree_uuid) &&
          ((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
            <Form
              module="insuree"
              title="Insuree.title"
              titleParams={{ label: insureeLabel(this.state.insuree) }}
              edited_id={insuree_uuid}
              edited={this.state.insuree}
              reset={this.state.reset}
              back={this.back}
              add={!!add && !this.state.newInsuree ? this._add : null}
              readOnly={readOnly || runningMutation || !!insuree.validityTo}
              actions={actions}
              HeadPanel={FamilyDisplayPanel}
              Panels={[InsureeMasterPanel]}
              contributedPanelsKey={INSUREE_INSUREE_FORM_CONTRIBUTION_KEY}
              insuree={this.state.insuree}
              onEditedChanged={this.onEditedChanged}
              canSave={this.canSave}
              save={!!save ? this._save : null}
              openDirty={save}
            />
          )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingInsuree: state.insuree.fetchingInsuree,
  errorInsuree: state.insuree.errorInsuree,
  fetchedInsuree: state.insuree.fetchedInsuree,
  insuree: state.insuree.insuree,
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, {
      fetchInsureeFull,
      fetchFamily,
      clearInsuree,
      fetchInsureeMutation,
      journalize,
    })(injectIntl(withTheme(withStyles(styles)(InsureeForm)))),
  ),
);
