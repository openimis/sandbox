import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { fetchRelations } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class RelationPicker extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-insuree", "RelationPicker.selectThreshold", 10);
  }

  componentDidMount() {
    if (!this.props.relations) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchRelations(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `Relation.null`);

  formatSuggestion = (i) => (!!i ? `${formatMessage(this.props.intl, "insuree", `Relation.${i}`)}` : this.nullDisplay);

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      relations,
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
        items={relations}
        label={!!withLabel && (label || formatMessage(intl, "insuree", "RelationPicker.label"))}
        placeholder={
          !!withPlaceholder ? placeholder || formatMessage(intl, "insuree", "RelationPicker.placehoder") : null
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
  relations: state.insuree.relations,
  fetching: state.insuree.fetchingRelations,
  fetched: state.medical.fetchedRelations,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchRelations }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(RelationPicker)));
