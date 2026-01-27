import React, { useState } from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const InsureeStatusReasonPicker = ({
  onChange,
  readOnly,
  required,
  value,
  filterOptions,
  filterSelectedOptions,
  multiple,
  extraFragment,
  statusType
}) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const [variables, setVariables] = useState({});

  const { isLoading, data, error } = useGraphqlQuery(
    `
    query InsureeStatusReasonPicker ($search: String, $statusType: String) {
        insureeStatusReasons(str: $search, statusType: $statusType, first: 20) {
        edges {
            node {
            id
            code
            insureeStatusReason
            statusType
            ${extraFragment ?? ""}
            }
        }
        }
    }
    `,
    variables,
    { skip: true },
  );

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      placeholder={formatMessage("InsureeReasonPicker.placeholder")}
      label={formatMessage("insuree.Insuree.statusReason")}
      error={error}
      withPlaceholder={true}
      readOnly={readOnly}
      options={data?.insureeStatusReasons?.edges.map((edge) => edge.node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => `${option.code} ${option.insureeStatusReason}`}
      onChange={(currentValue) => onChange(currentValue, currentValue ? `${currentValue.code} ${currentValue.insureeStatusReason}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(search) => setVariables({ search, statusType: statusType })}
    />
  );
};

export default InsureeStatusReasonPicker;
