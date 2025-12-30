import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { fetchEducations } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class EducationPicker extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-insuree", "EducationPicker.selectThreshold", 10);
  }

  componentDidMount() {
    if (!this.props.educations) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchEducations(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `Education.null`);

  formatSuggestion = (i) => `${formatMessage(this.props.intl, "insuree", `Education.${i}`)}`;

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      educations,
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
        items={educations}
        label={!!withLabel && (label || formatMessage(intl, "insuree", "EducationPicker.label"))}
        placeholder={
          !!withPlaceholder ? placeholder || formatMessage(intl, "insuree", "EducationPicker.placehoder") : null
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
  educations: state.insuree.educations,
  fetching: state.insuree.fetchingEducations,
  fetched: state.medical.fetchedEducations,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchEducations }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(EducationPicker)));
