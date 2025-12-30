import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";

import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import { TextInput, Picker, withModulesManager } from "@openimis/fe-core";
import { fetchInsureesForPicker, checkIfHeadSelected } from "../actions";
import { DEFAULT } from "../constants";

const styles = (theme) => ({
  label: {
    color: theme.palette.primary.main,
  },
  item: {
    padding: theme.spacing(1),
  },
});

class RawFilter extends Component {
  constructor(props) {
    super(props);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  state = {
    chfId: "",
    lastName: "",
    otherNames: "",
  };

  stateToFilters = () => {
    let filters = [];
    if (!!this.state.chfId) {
      filters.push(`chfId_Istartswith: "${this.state.chfId}"`);
    }
    if (!!this.state.lastName) {
      filters.push(`lastName_Istartswith: "${this.state.lastName}"`);
    }
    if (!!this.state.otherNames) {
      filters.push(`otherNames_Istartswith: "${this.state.otherNames}"`);
    }
    return filters;
  };

  _onChange = (a, v) => {
    this.setState({ [a]: v }, (e) => this.props.onChange(this.stateToFilters()));
  };

  renderLastNameField = (classes) => (
    <Grid item xs={4} className={classes.item}>
      <TextInput
        module="insuree"
        label="Insuree.lastName"
        value={this.state.lastName}
        onChange={(v) => this._onChange("lastName", v)}
      />
    </Grid>
  );

  renderGivenNameField = (classes) => (
    <Grid item xs={4} className={classes.item}>
      <TextInput
        module="insuree"
        label="Insuree.otherNames"
        value={this.state.otherNames}
        onChange={(v) => this._onChange("otherNames", v)}
      />
    </Grid>
  );

  render() {
    const { classes } = this.props;
    return (
      <Grid container>
        <Grid item xs={4} className={classes.item}>
          <TextInput
            autoFocus={true}
            module="insuree"
            label="Insuree.chfId"
            value={this.state.chfId}
            onChange={(v) => this._onChange("chfId", v)}
          />
        </Grid>
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField(classes)}
            {this.renderGivenNameField(classes)}
          </>
        ) : (
          <>
            {this.renderGivenNameField(classes)}
            {this.renderLastNameField(classes)}
          </>
        )}
      </Grid>
    );
  }
}

const Filter = withModulesManager(withTheme(withStyles(styles)(RawFilter)));

const INIT_STATE = {
  page: 0,
  pageSize: 10,
  afterCursor: null,
  beforeCursor: null,
  filters: [],
  selected: null,
};

class InsureePicker extends Component {
  constructor(props) {
    super(props);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  state = INIT_STATE;

  componentDidMount() {
    if (this.props.value) {
      this.setState((state, props) => ({ selected: props.value }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.reset !== this.props.reset) {
      this.setState((state, props) => ({
        ...INIT_STATE,
        selected: props.value,
      }));
    } else if (!_.isEqual(prevProps.value, this.props.value)) {
      this.setState((state, props) => ({ selected: props.value }));
    }
  }

  formatSuggestion = (a) => {
    if (!a) return "";

    const fullName = this.renderLastNameFirst
      ? `${a.lastName} ${a.otherNames}`.trim()
      : `${a.otherNames} ${a.lastName}`.trim();

    return `${fullName} (${a.chfId})`.trim();
  };

  filtersToQueryParams = () => {
    let prms = [...(this.props.forcedFilter || []), ...this.state.filters];
    if (!this.state.beforeCursor && !this.state.afterCursor) {
      prms.push(`first: ${this.state.pageSize}`);
    }
    if (!!this.state.afterCursor) {
      prms.push(`after: "${this.state.afterCursor}"`);
      prms.push(`first: ${this.state.pageSize}`);
    }
    if (!!this.state.beforeCursor) {
      prms.push(`before: "${this.state.beforeCursor}"`);
      prms.push(`last: ${this.state.pageSize}`);
    }
    return prms;
  };

  getSuggestions = (filters) => {
    this.setState({ filters }, (e) =>
      this.props.fetchInsureesForPicker(this.props.modulesManager, this.filtersToQueryParams()),
    );
  };

  debouncedGetSuggestion = _.debounce(
    this.getSuggestions,
    this.props.modulesManager.getConf("fe-insuree", "debounceTime", 800),
  );

  onChangeRowsPerPage = (cnt) => {
    this.setState(
      {
        pageSize: cnt,
        page: 0,
        afterCursor: null,
        beforeCursor: null,
      },
      (e) => this.props.fetchInsureesForPicker(this.props.modulesManager, this.filtersToQueryParams()),
    );
  };

  onSelect = (v) => {
    this.props.checkIfHeadSelected(v);
    this.setState({ selected: v }, this.props.onChange(v, this.formatSuggestion(v)));
  };

  onChangePage = (page, nbr) => {
    if (nbr > this.state.page) {
      this.setState(
        (state, props) => ({
          page: state.page + 1,
          beforeCursor: null,
          afterCursor: props.insureesPageInfo.endCursor,
        }),
        (e) => this.props.fetchInsureesForPicker(this.props.modulesManager, this.filtersToQueryParams()),
      );
    } else if (nbr < this.state.page) {
      this.setState(
        (state, props) => ({
          page: state.page - 1,
          beforeCursor: props.insureesPageInfo.startCursor,
          afterCursor: null,
        }),
        (e) => this.props.fetchInsureesForPicker(this.props.modulesManager, this.filtersToQueryParams()),
      );
    }
  };

  render() {
    const {
      insurees,
      insureesPageInfo,
      readOnly = false,
      required = false,
      withLabel = true,
      IconRender = null,
      title,
      check,
      checked,
    } = this.props;
    return (
      <Picker
        module="insuree"
        label={!!withLabel ? "Insuree.label" : null}
        title={title}
        dialogTitle="Insuree.picker.dialog.title"
        IconRender={IconRender}
        check={check}
        checked={checked}
        filter={<Filter onChange={this.debouncedGetSuggestion} />}
        suggestions={insurees}
        suggestionFormatter={this.formatSuggestion}
        page={this.state.page}
        pageSize={this.state.pageSize}
        count={insureesPageInfo.totalCount}
        onChangePage={this.onChangePage}
        onChangeRowsPerPage={this.onChangeRowsPerPage}
        onSelect={this.onSelect}
        value={this.state.selected}
        readOnly={readOnly}
        required={required}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  insurees: state.insuree.insurees,
  insureesPageInfo: state.insuree.insureesPageInfo,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchInsureesForPicker, checkIfHeadSelected }, dispatch);
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureePicker)))),
);
