import React from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";

import { withModulesManager, useModulesManager, ValidatedTextInput } from "@openimis/fe-core";
import { insureeNumberValidationCheck, insureeNumberValidationClear, insureeNumberSetValid } from "../actions";

const InsureeNumberInput = (props) => {
  const {
    value,
    onChange,
    className,
    label,
    placeholder,
    readOnly,
    required,
    isInsureeNumberValid,
    isInsureeNumberValidating,
    insureeNumberValidationError,
    insureeNumberValidationErrorMessage,
  } = props;
  const modulesManager = useModulesManager();
  const numberMaxLength = modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12);

  const shouldValidate = (inputValue) => {
    const { savedInsureeNumber, headSelected } = props;

    if (headSelected && savedInsureeNumber && inputValue === savedInsureeNumber) return false;

    if (!headSelected || (headSelected && savedInsureeNumber)) return inputValue !== savedInsureeNumber;
  };

  return (
    <ValidatedTextInput
      itemQueryIdentifier="insuranceNumber"
      codeTakenLabel={insureeNumberValidationErrorMessage}
      shouldValidate={shouldValidate}
      isValid={isInsureeNumberValid}
      isValidating={isInsureeNumberValidating}
      validationError={insureeNumberValidationError}
      action={insureeNumberValidationCheck}
      clearAction={insureeNumberValidationClear}
      setValidAction={insureeNumberSetValid}
      module="insuree"
      className={className}
      readOnly={readOnly}
      required={required}
      label={label}
      placeholder={placeholder}
      value={value}
      inputProps={{ maxLength: numberMaxLength }}
      onChange={onChange}
    />
  );
};

const mapStateToProps = (state) => ({
  isInsureeNumberValid: state.insuree.validationFields?.insureeNumber?.isValid,
  isInsureeNumberValidating: state.insuree.validationFields?.insureeNumber?.isValidating,
  insureeNumberValidationError: state.insuree.validationFields?.insureeNumber?.validationError,
  insureeNumberValidationErrorMessage: state.insuree.validationFields?.insureeNumber?.validationErrorMessage,
  savedInsureeNumber: state.insuree?.insuree?.chfId,
  headSelected: state.insuree?.headSelected,
});

export default withModulesManager(connect(mapStateToProps)(injectIntl(InsureeNumberInput)));
