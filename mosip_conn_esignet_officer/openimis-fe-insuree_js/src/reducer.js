import {
  parseData,
  pageInfo,
  formatServerError,
  formatGraphQLError,
  dispatchMutationReq,
  dispatchMutationResp,
  dispatchMutationErr,
} from "@openimis/fe-core";

function reducer(
  state = {
    fetchingInsuree: false,
    fetchedInsuree: false,
    errorInsuree: null,
    insuree: null,
    fetchingInsureeFamilyMembers: false,
    fetchedInsureeFamilyMembers: false,
    errorInsureeFamilyMembers: null,
    insureeFamilyMembers: null,
    fetchingFamilyMembers: false,
    fetchedFamilyMembers: false,
    errorFamilyMembers: null,
    familyMembers: null,
    familyMembersPageInfo: { totalCount: 0 },
    fetchingInsurees: false,
    fetchedInsurees: false,
    errorInsurees: null,
    insurees: [],
    fetchedInsureeOfficers: false,
    errorInsureeOfficers: null,
    insureeOfficers: null,
    insureesPageInfo: { totalCount: 0 },
    fetchingFamilies: false,
    fetchedFamilies: false,
    errorFamilies: null,
    families: [],
    familiesPageInfo: { totalCount: 0 },
    family: null,
    fetchingFamily: false,
    errorFamily: null,
    fetchingEducations: false,
    fetchedEducations: false,
    educations: null,
    errorEducations: null,
    fetchingProfessions: false,
    fetchedProfessions: false,
    professions: null,
    errorProfessions: null,
    fetchingRelations: false,
    fetchedRelations: false,
    relations: null,
    errorRelations: null,
    fetchingIdentificationTypes: false,
    fetchedIdentificationTypes: false,
    identificationTypes: null,
    errorIdentificationTypes: null,
    checkingCanAddInsuree: false,
    checkedCanAddInsuree: false,
    canAddInsureeWarnings: [],
    errorCanAddInsuree: null,
    submittingMutation: false,
    headSelected: false,
    mutation: {},
    fetchingWorkersExport: false,
    fetchedWorkersExport: false,
    workersExport: null,
    workersExportPageInfo: {},
    errorWorkersExport: null,

    fetchingCRVS: false,
    crvsData: null,
    errorCRVS: null,
  },
  action,
) {
  switch (action.type) {
    case "INSUREE_CRVS_VERIFY_REQ":
    return {
        ...state,
        fetchingCRVS: true,
        crvsData: null,
        errorCRVS: null,
    };
case "INSUREE_CRVS_VERIFY_RESP":
    return {
        ...state,
        fetchingCRVS: false,
        crvsData: action.payload.data.syncSearch,
        errorCRVS: formatGraphQLError(action.payload),
    };
case "INSUREE_CRVS_VERIFY_ERR":
    return {
        ...state,
        fetchingCRVS: false,
        errorCRVS: formatServerError(action.payload),
    };
case "INSUREE_CRVS_VERIFY_CLEAR":
    return {
        ...state,
        crvsData: null,
        errorCRVS: null,
    };

    case "INSUREE_INSUREE_REQ":
      return {
        ...state,
        fetchingInsuree: true,
        fetchedInsuree: false,
        insuree: null,
        errorInsuree: null,
      };
    case "INSUREE_INSUREE_RESP":
      return {
        ...state,
        fetchingInsuree: false,
        fetchedInsuree: true,
        insuree: parseData(action.payload.data.insurees)[0],
        errorInsuree: formatGraphQLError(action.payload),
      };
    case "INSUREE_INSUREE_ERR":
      return {
        ...state,
        fetchingInsuree: false,
        errorInsuree: formatServerError(action.payload),
      };
    case "INSUREE_INSUREE_CLEAR":
      return {
        ...state,
        fetchingInsuree: false,
        fetchedInsuree: false,
        insuree: null,
        errorInsuree: null,
      };
    case "INSUREE_FAMILY_NEW":
      return {
        ...state,
        familyMembers: null,
        familyMembersPageInfo: { totalCount: 0 },
        family: null,
        insuree: null,
      };
    case "INSUREE_FAMILY_REQ":
      return {
        ...state,
        fetchingInsureeFamilyMembers: true,
        fetchedInsureeFamilyMembers: false,
        insureeFamilyMembers: null,
        errorInsureeFamilyMembers: null,
        insuree: null,
      };
    case "INSUREE_FAMILY_RESP":
      return {
        ...state,
        fetchingInsureeFamilyMembers: false,
        fetchedInsureeFamilyMembers: true,
        insureeFamilyMembers: action.payload.data.insureeFamilyMembers,
        errorInsureeFamilyMembers: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_ERR":
      return {
        ...state,
        fetchingInsureeFamilyMembers: false,
        errorInsureeFamilyMembers: formatServerError(action.payload),
      };
    case "INSUREE_FAMILY_MEMBERS_REQ":
      return {
        ...state,
        fetchingFamilyMembers: true,
        fetchedFamilyMembers: false,
        insureeFamilyMembers: null,
        errorFamilyMembers: null,
      };
    case "INSUREE_FAMILY_MEMBERS_RESP":
      return {
        ...state,
        fetchingFamilyMembers: false,
        fetchedFamilyMembers: true,
        familyMembers: parseData(action.payload.data.familyMembers),
        familyMembersPageInfo: pageInfo(action.payload.data.familyMembers),
        errorFamilyMembers: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_CAN_ADD_INSUREE_REQ":
      return {
        ...state,
        checkingCanAddInsuree: true,
        checkedCanAddInsuree: false,
        canAddInsureeWarnings: [],
        errorCanAddInsuree: null,
      };
    case "INSUREE_FAMILY_CAN_ADD_INSUREE_RESP":
      return {
        ...state,
        checkingCanAddInsuree: false,
        checkedCanAddInsuree: true,
        canAddInsureeWarnings: action.payload.data.canAddInsuree,
        errorCanAddInsuree: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_CAN_ADD_INSUREE_ERR":
      return {
        ...state,
        checkingCanAddInsuree: false,
        checkedCanAddInsuree: false,
        errorCanAddInsuree: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_MEMBERS_ERR":
      return {
        ...state,
        fetchingFamilyMembers: false,
        errorFamilyMembers: formatServerError(action.payload),
      };
    case "INSUREE_FAMILY_MEMBER":
      return {
        ...state,
        insuree: action.payload,
      };
    case "INSUREE_INSUREE_OFFICERS_REQ":
      return {
        ...state,
        fetchingInsureeOfficers: true,
        fetchedInsureeOfficers: false,
        insureeOfficers: null,
        errorInsureeOfficers: null,
      };
    case "INSUREE_INSUREE_OFFICERS_RESP":
      return {
        ...state,
        fetchingInsureeOfficers: false,
        fetchedInsureeOfficers: true,
        insureeOfficers: parseData(action.payload.data.insureeOfficers),
        errorInsureeOfficers: formatGraphQLError(action.payload),
      };
    case "INSUREE_INSUREE_OFFICERS_ERR":
      return {
        ...state,
        fetchingInsureeOfficers: false,
        errorInsureeOfficers: formatServerError(action.payload),
      };
    case "INSUREE_GENDERS_REQ":
      return {
        ...state,
        fetchingInsureeGenders: true,
        fetchedInsureeGenders: false,
        insureeGenders: null,
        errorInsureeGenders: null,
      };
    case "INSUREE_GENDERS_RESP":
      return {
        ...state,
        fetchingInsureeGenders: false,
        fetchedInsureeGenders: true,
        insureeGenders: action.payload.data.insureeGenders.map((g) => g.code),
        errorInsureeGenders: formatGraphQLError(action.payload),
      };
    case "INSUREE_GENDERS_ERR":
      return {
        ...state,
        fetchingInsureeGenders: false,
        errorInsureeGenders: formatServerError(action.payload),
      };
    case "INSUREE_INSUREES_REQ":
      return {
        ...state,
        fetchingInsurees: true,
        fetchedInsurees: false,
        insurees: [],
        errorInsurees: null,
      };
    case "INSUREE_INSUREES_RESP":
      return {
        ...state,
        fetchingInsurees: false,
        fetchedInsurees: true,
        insurees: parseData(action.payload.data.insurees),
        insureesPageInfo: pageInfo(action.payload.data.insurees),
        errorInsurees: formatGraphQLError(action.payload),
      };
    case "INSUREE_INSUREES_ERR":
      return {
        ...state,
        fetching: false,
        error: formatServerError(action.payload),
      };
    case "INSUREE_FAMILIES_REQ":
      return {
        ...state,
        fetchingFamilies: true,
        fetchedFamilies: false,
        families: null,
        familiesPageInfo: { totalCount: 0 },
        errorFamilies: null,
      };
    case "INSUREE_FAMILIES_RESP":
      return {
        ...state,
        fetchingFamilies: false,
        fetchedFamilies: true,
        families: parseData(action.payload.data.families),
        familiesPageInfo: pageInfo(action.payload.data.families),
        errorFamilies: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILIES_ERR":
      return {
        ...state,
        fetchingFamilies: false,
        errorFamilies: formatServerError(action.payload),
      };
    case "INSUREE_CONFIRMATION_TYPES_REQ":
      return {
        ...state,
        fetchingConfirmationTypes: true,
        fetchedConfirmationTypes: false,
        confirmationTypes: null,
        errorConfirmationTypes: null,
      };
    case "INSUREE_CONFIRMATION_TYPES_RESP":
      return {
        ...state,
        fetchingConfirmationTypes: false,
        fetchedConfirmationTypes: true,
        confirmationTypes: action.payload.data.confirmationTypes,
        errorConfirmationTypes: formatGraphQLError(action.payload),
      };
    case "INSUREE_CONFIRMATION_TYPES_ERR":
      return {
        ...state,
        fetchingConfirmationTypes: false,
        errorConfirmationTypes: formatServerError(action.payload),
      };
    case "INSUREE_FAMILY_TYPES_REQ":
      return {
        ...state,
        fetchingFamilyTypes: true,
        fetchedFamilyTypes: false,
        familyTypes: null,
        errorFamilyTypes: null,
      };
    case "INSUREE_FAMILY_TYPES_RESP":
      return {
        ...state,
        fetchingFamilyTypes: false,
        fetchedFamilyTypes: true,
        familyTypes: action.payload.data.familyTypes.map((t) => t.code),
        errorFamilyTypes: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_TYPES_ERR":
      return {
        ...state,
        fetchingFamilyTypes: false,
        errorFamilyTypes: formatServerError(action.payload),
      };
    case "INSUREE_FAMILY_OVERVIEW_REQ":
      return {
        ...state,
        fetchingFamily: true,
        fetchedFamily: false,
        family: null,
        errorFamily: null,
      };
    case "INSUREE_FAMILY_OVERVIEW_RESP":
      var families = parseData(action.payload.data.families);
      return {
        ...state,
        fetchingFamily: false,
        fetchedFamily: true,
        family: !!families && families.length > 0 ? families[0] : null,
        errorFamily: formatGraphQLError(action.payload),
      };
    case "INSUREE_FAMILY_OVERVIEW_ERR":
      return {
        ...state,
        fetchingFamily: false,
        errorFamily: formatServerError(action.payload),
      };
    case "INSUREE_EDUCATIONS_REQ":
      return {
        ...state,
        fetchingEducations: true,
        fetchedEducations: false,
        educations: null,
        errorEducations: null,
      };
    case "INSUREE_EDUCATIONS_RESP":
      return {
        ...state,
        fetchingEducations: false,
        fetchedEducations: true,
        educations: action.payload.data.educations.map((e) => e.id),
        errorEducations: formatGraphQLError(action.payload),
      };
    case "INSUREE_EDUCATIONS_ERR":
      return {
        ...state,
        fetchingEducations: false,
        errorEducations: formatServerError(action.payload),
      };
    case "INSUREE_PROFESSIONS_REQ":
      return {
        ...state,
        fetchingProfessions: true,
        fetchedProfessions: false,
        professions: null,
        errorProfessions: null,
      };
    case "INSUREE_PROFESSIONS_RESP":
      return {
        ...state,
        fetchingProfessions: false,
        fetchedProfessions: true,
        professions: action.payload.data.professions.map((p) => p.id),
        errorProfessions: formatGraphQLError(action.payload),
      };
    case "INSUREE_PROFESSIONS_ERR":
      return {
        ...state,
        fetchingProfessions: false,
        errorProfessions: formatServerError(action.payload),
      };
    case "INSUREE_RELATIONS_REQ":
      return {
        ...state,
        fetchingRelations: true,
        fetchedRelations: false,
        relations: null,
        errorRelations: null,
      };
    case "INSUREE_RELATIONS_RESP":
      return {
        ...state,
        fetchingRelations: false,
        fetchedRelations: true,
        relations: action.payload.data.relations.map((p) => p.id),
        errorRelations: formatGraphQLError(action.payload),
      };
    case "INSUREE_RELATIONS_ERR":
      return {
        ...state,
        fetchingRelations: false,
        errorRelations: formatServerError(action.payload),
      };
    case "INSUREE_IDENTIFICATION_TYPES_REQ":
      return {
        ...state,
        fetchingIdentificationTypes: true,
        fetchedIdentificationTypes: false,
        identificationTypes: null,
        errorIdentificationTypes: null,
      };
    case "INSUREE_IDENTIFICATION_TYPES_RESP":
      return {
        ...state,
        fetchingIdentificationTypes: false,
        fetchedIdentificationTypes: true,
        identificationTypes: action.payload.data.identificationTypes.map((t) => t.code),
        errorIdentificationTypes: formatGraphQLError(action.payload),
      };
    case "INSUREE_IDENTIFICATION_TYPES_ERR":
      return {
        ...state,
        fetchingIdentificationTypes: false,
        errorIdentificationTypes: formatServerError(action.payload),
      };
    case "INSUREE_NUMBER_VALIDATION_FIELDS_REQ":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          insureeNumber: {
            isValidating: true,
            isValid: false,
            validationErrorMessage: null,
            validationError: null,
          },
        },
      };
    case "INSUREE_NUMBER_VALIDATION_FIELDS_RESP":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          insureeNumber: {
            isValidating: false,
            isValid: action.payload?.data.insureeNumberValidity.isValid,
            validationErrorMessage: action.payload?.data.insureeNumberValidity.errorMessage,
            validationError: formatGraphQLError(action.payload),
          },
        },
      };
    case "INSUREE_NUMBER_VALIDATION_FIELDS_ERR":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          insureeNumber: {
            isValidating: false,
            isValid: false,
            validationError: formatServerError(action.payload),
          },
        },
      };
    case "INSUREE_NUMBER_VALIDATION_FIELDS_CLEAR":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          insureeNumber: {
            isValidating: true,
            isValid: false,
            validationErrorMessage: null,
            validationError: null,
          },
        },
      };
    case "INSUREE_NUMBER_VALIDATION_FIELDS_SET_VALID":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          insureeNumber: {
            isValidating: false,
            isValid: true,
            validationErrorMessage: null,
            validationError: null,
          },
        },
      };
    case "INSUREE_CHECK_IS_HEAD_SELECTED":
      return {
        ...state,
        headSelected: action.payload?.headSelected,
      };
    case "WORKERS_EXPORT_REQ":
      return {
        ...state,
        fetchingWorkersExport: true,
        fetchedWorkersExport: false,
        workersExport: null,
        workersExportPageInfo: {},
        errorWorkersExport: null,
      };
    case "WORKERS_EXPORT_RESP":
      return {
        ...state,
        fetchingWorkersExport: false,
        fetchedWorkersExport: true,
        workersExport: action.payload.data.insureesExport,
        workersExportPageInfo: pageInfo(action.payload.data.insureesExportPageInfo),
        errorWorkersExport: formatGraphQLError(action.payload),
      };
    case "WORKERS_EXPORT_ERR":
      return {
        ...state,
        fetchingWorkersExport: false,
        errorWorkersExport: formatServerError(action.payload),
      };
    case "WORKERS_EXPORT_CLEAR":
      return {
        ...state,
        fetchingWorkersExport: false,
        fetchedWorkersExport: false,
        workersExport: null,
        workersExportPageInfo: {},
        errorWorkersExport: null,
      };
      case "INSUREE_SR_VERIFY_REQ":  return { ...state, fetchingSR: true };
      case "INSUREE_SR_VERIFY_RESP": return { ...state, fetchingSR: false, srData: action.payload?.data?.socialRegistrySearch };
      case "INSUREE_SR_VERIFY_ERR":  return { ...state, fetchingSR: false };
      case "INSUREE_SR_VERIFY_CLEAR": return { ...state, srData: null };
    case "INSUREE_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "INSUREE_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "INSUREE_CREATE_FAMILY_RESP":
      return dispatchMutationResp(state, "createFamily", action);
    case "INSUREE_UPDATE_FAMILY_RESP":
      return dispatchMutationResp(state, "updateFamily", action);
    case "INSUREE_DELETE_FAMILY_RESP":
      return dispatchMutationResp(state, "deleteFamilies", action);
    case "INSUREE_CREATE_INSUREE_RESP":
      return dispatchMutationResp(state, "createInsuree", action);
    case "INSUREE_UPDATE_INSUREE_RESP":
      return dispatchMutationResp(state, "updateInsuree", action);
    case "INSUREE_DELETE_INSUREES_RESP":
      return dispatchMutationResp(state, "deleteInsurees", action);
    case "INSUREE_REMOVE_INSUREES_RESP":
      return dispatchMutationResp(state, "removeInsurees", action);
    case "INSUREE_SET_FAMILY_HEAD_RESP":
      return dispatchMutationResp(state, "setFamilyHead", action);
    case "INSUREE_CHANGE_FAMILY_HEAD_RESP":
      return dispatchMutationResp(state, "changeInsureeFamily", action);
    default:
      return state;
  }
}

export default reducer;
