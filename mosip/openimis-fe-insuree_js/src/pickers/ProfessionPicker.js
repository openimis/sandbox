import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { fetchProfessions } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class ProfessionPicker extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-insuree", "ProfessionPicker.selectThreshold", 10);
  }

  componentDidMount() {
    if (!this.props.professions) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchProfessions(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `Profession.null`);

  formatSuggestion = (i) => `${formatMessage(this.props.intl, "insuree", `Profession.${i}`)}`;

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      professions,
      withLabel = true,
      label,
      withPlaceholder = false,
      placeholder,
      value,
      reset,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
    } = this.props;
    return (
      <AutoSuggestion
        module="insuree"
        items={professions}
        label={!!withLabel && (label || formatMessage(intl, "insuree", "ProfessionPicker.label"))}
        placeholder={
          !!withPlaceholder ? placeholder || formatMessage(intl, "insuree", "ProfessionPicker.placehoder") : null
        }
        getSuggestionValue={this.formatSuggestion}
        onSuggestionSelected={this.onSuggestionSelected}
        value={value}
        reset={reset}
        readOnly={readOnly}
        required={required}
        selectThreshold={this.selectThreshold}
        withNull={withNull}
        nullLabel={this.nullDisplay}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  professions: state.insuree.professions,
  fetching: state.insuree.fetchingProfessions,
  fetched: state.medical.fetchedProfessions,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchProfessions }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(ProfessionPicker)));
