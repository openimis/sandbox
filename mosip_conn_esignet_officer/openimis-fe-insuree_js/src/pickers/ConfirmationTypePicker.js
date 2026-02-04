import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, SelectInput, withModulesManager } from "@openimis/fe-core";
import { fetchConfirmationTypes } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class ConfirmationTypePicker extends Component {
  componentDidMount() {
    if (!this.props.confirmationTypes) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchConfirmationTypes(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `ConfirmationType.null`);

  formatSuggestion = (i) =>
    !!i ? `${formatMessage(this.props.intl, "insuree", `ConfirmationType.${i.code}`)}` : this.nullDisplay;

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      confirmationTypes,
      module = "insuree",
      withLabel = true,
      label = "ConfirmationTypePicker.label",
      withPlaceholder = false,
      placeholder,
      value,
      reset,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
    } = this.props;
    let options = !!confirmationTypes
      ? confirmationTypes.map((v) => ({ value: v, label: this.formatSuggestion(v) }))
      : [];
    if (withNull) {
      options.unshift({ value: null, label: this.formatSuggestion(null) });
    }
    return (
      <SelectInput
        module={module}
        options={options}
        label={!!withLabel ? label : null}
        placeholder={
          !!withPlaceholder ? placeholder || formatMessage(intl, "insuree", "ConfirmationTypePicker.placehoder") : null
        }
        onChange={this.onSuggestionSelected}
        value={value}
        reset={reset}
        readOnly={readOnly}
        required={required}
        withNull={withNull}
        nullLabel={this.nullDisplay}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  confirmationTypes: state.insuree.confirmationTypes,
  fetching: state.insuree.fetchingConfirmationTypes,
  fetched: state.medical.fetchedConfirmationTypes,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchConfirmationTypes }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(ConfirmationTypePicker)));
