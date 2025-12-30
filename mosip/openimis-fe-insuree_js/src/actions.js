import {
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatJsonField,
  decodeId,
  formatMutation,
  formatGQLString,
  graphqlWithVariables,
} from "@openimis/fe-core";
import { INSUREE_ACTIVE_STRING } from "./constants";

//NOTE: Fetching all INSUREE_FULL_PROJECTION fields except family.
const FAMILY_HEAD_PROJECTION = (mm) => [
  "id",
  "uuid",
  "chfId",
  "lastName",
  "otherNames",
  "dob",
  "age",
  "validityFrom",
  "validityTo",
  `photo{id,uuid,date,folder,filename,officerId,photo}`,
  "gender{code, gender}",
  "education{id}",
  "profession{id}",
  "marital",
  "cardIssued",
  "currentVillage" + mm.getProjection("location.Location.FlatProjection"),
  "currentAddress",
  "typeOfId{code}",
  "passport",
  "relationship{id}",
  "head",
  "status",
  "statusDate",
  "statusReason{code,insureeStatusReason}",
  "email",
  "phone",
  "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
];

const FAMILY_FULL_PROJECTION = (mm) => [
  "id",
  "uuid",
  "poverty",
  "confirmationNo",
  "confirmationType{code, isConfirmationNumberRequired}",
  "familyType{code}",
  "address",
  "validityFrom",
  "validityTo",
  `headInsuree{${FAMILY_HEAD_PROJECTION(mm).join(",")}}`,
  "location" + mm.getProjection("location.Location.FlatProjection"),
  "clientMutationId",
];

export const FAMILY_PICKER_PROJECTION = ["id", "uuid", "headInsuree{id chfId uuid lastName otherNames}"];

const INSUREE_FULL_PROJECTION = (mm) => [
  "id",
  "uuid",
  "chfId",
  "lastName",
  "otherNames",
  "dob",
  "age",
  "validityFrom",
  "validityTo",
  `family{${FAMILY_FULL_PROJECTION(mm).join(",")}}`,
  `photo{id,uuid,date,folder,filename,officerId,photo}`,
  "gender{code, gender}",
  "education{id}",
  "profession{id}",
  "marital",
  "cardIssued",
  "currentVillage" + mm.getProjection("location.Location.FlatProjection"),
  "currentAddress",
  "typeOfId{code}",
  "passport",
  "relationship{id}",
  "head",
  "status",
  "jsonExt",
  "statusDate",
  "statusReason{code,insureeStatusReason}",
  "email",
  "phone",
  "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
];

export const INSUREE_PICKER_PROJECTION = ["id", "uuid", "chfId", "lastName", "otherNames", "dob"];

export function fetchInsureeGenders() {
  const payload = formatQuery("insureeGenders", null, ["code"]);
  return graphql(payload, "INSUREE_GENDERS");
}

export function fetchInsuree(mm, chfid) {
  let payload = formatPageQuery(
    "insurees",
    [`chfId:"${chfid}", ignoreLocation:true`],
    [
      "id",
      "uuid",
      "chfId",
      "lastName",
      "otherNames",
      "dob",
      "age",
      "validityFrom",
      "validityTo",
      "gender{code}",
      "status",
      `family{${FAMILY_FULL_PROJECTION(mm).join(",")}}`,
      "photo{folder,filename,photo}",
      "gender{code, gender, altLanguage}",
      "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
    ],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeEnquiry(mm, chfid) {
  let payload = formatPageQuery(
    "insurees",
    [`chfId:"${chfid}", ignoreLocation:true`],
    [
      "id",
      "uuid",
      "chfId",
      "lastName",
      "otherNames",
      "dob",
      "age",
      "validityFrom",
      "validityTo",
      "gender{code}",
      "status",
      `family{${FAMILY_FULL_PROJECTION(mm).join(",")}}`,
      "photo{folder,filename,photo}",
      "gender{code, gender, altLanguage}",
      "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
    ],
  );
  return graphql(payload, "ENQUIRY_INSUREE");
}

export function clearInsureeEnquiry() {
  return (dispatch) => {
    dispatch({ type: "ENQUIRY_INSUREE_CLEAR" });
  };
}

export function fetchInsureeFull(mm, uuid, ignoreLocation = false) {
  let args = [`uuid:"${uuid}"`];
  if (ignoreLocation) args.push("ignoreLocation: true");
  let payload = formatPageQuery("insurees", args, INSUREE_FULL_PROJECTION(mm), "clientMutationId");
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureesForPicker(mm, filters) {
  let payload = formatPageQueryWithCount("insurees", filters, INSUREE_FULL_PROJECTION(mm));
  return graphql(payload, "INSUREE_INSUREES");
}

export function clearInsuree() {
  return (dispatch) => {
    dispatch({ type: "INSUREE_INSUREE_CLEAR" });
  };
}

export function fetchFamilySummaries(mm, filters) {
  let projections = [
    "id",
    "uuid",
    "poverty",
    "confirmationNo",
    "validityFrom",
    "validityTo",
    "headInsuree{id,uuid,chfId,lastName,otherNames,email,phone, dob}",
    "location" + mm.getProjection("location.Location.FlatProjection"),
  ];
  const payload = formatPageQueryWithCount("families", filters, projections);
  return graphql(payload, "INSUREE_FAMILIES");
}

export function fetchFamilyMembers(mm, filters) {
  let projections = ["uuid", "chfId", "otherNames", "lastName", "head", "phone", "gender{code}", "dob", "cardIssued"];
  const payload = formatPageQueryWithCount("familyMembers", filters, projections);
  return graphql(payload, "INSUREE_FAMILY_MEMBERS");
}

export function checkCanAddInsuree(family) {
  let filters = [`familyId:${decodeId(family.id)}`];
  const payload = formatQuery("canAddInsuree", filters, null);
  return graphql(payload, "INSUREE_FAMILY_CAN_ADD_INSUREE");
}

export function selectFamilyMember(member) {
  return (dispatch) => {
    dispatch({ type: "INSUREE_FAMILY_MEMBER", payload: member });
  };
}

export function fetchConfirmationTypes() {
  const payload = formatQuery("confirmationTypes", null, ["code", "isConfirmationNumberRequired"]);
  return graphql(payload, "INSUREE_CONFIRMATION_TYPES");
}

export function fetchFamilyTypes() {
  const payload = formatQuery("familyTypes", null, ["code"]);
  return graphql(payload, "INSUREE_FAMILY_TYPES");
}

export function newFamily() {
  return (dispatch) => {
    dispatch({ type: "INSUREE_FAMILY_NEW" });
  };
}

export function fetchFamilyMutation(mm, clientMutationId) {
  let payload = formatPageQuery(
    "mutationLogs",
    [`clientMutationId:"${clientMutationId}"`],
    ["id", "families{family{uuid}}"],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeMutation(mm, clientMutationId) {
  let payload = formatPageQuery(
    "mutationLogs",
    [`clientMutationId:"${clientMutationId}"`],
    ["id", "status", "error", "clientMutationId", "insurees{insuree{uuid}}"],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeOfficers(mm) {
  const payload = formatPageQuery("insureeOfficers", null, mm.getRef("insuree.InsureeOfficerPicker.projection"));
  return graphql(payload, "INSUREE_INSUREE_OFFICERS");
}

export function fetchFamily(mm, familyUuid, headInsureeChfId) {
  let filters = [];
  if (!!familyUuid) {
    filters.push(`uuid: "${familyUuid}"`, "showHistory: true");
  } else {
    filters.push(`headInsuree_ChfId: "${headInsureeChfId}"`);
  }
  const payload = formatPageQuery("families", filters, FAMILY_FULL_PROJECTION(mm));
  return graphql(payload, "INSUREE_FAMILY_OVERVIEW");
}

export function fetchEducations(mm) {
  const payload = formatQuery("educations", null, ["id"]);
  return graphql(payload, "INSUREE_EDUCATIONS");
}

export function fetchProfessions(mm) {
  const payload = formatQuery("professions", null, ["id"]);
  return graphql(payload, "INSUREE_PROFESSIONS");
}

export function fetchIdentificationTypes(mm) {
  const payload = formatQuery("identificationTypes", null, ["code"]);
  return graphql(payload, "INSUREE_IDENTIFICATION_TYPES");
}

export function fetchRelations(mm) {
  const payload = formatQuery("relations", null, ["id"]);
  return graphql(payload, "INSUREE_RELATIONS");
}

export function fetchInsureeSummaries(mm, filters, ignoreLocation = false) {
  if (ignoreLocation) filters.push("ignoreLocation: true");
  var projections = [
    "id",
    "uuid",
    "validityFrom",
    "validityTo",
    "chfId",
    "otherNames",
    "lastName",
    "phone",
    "gender{code}",
    "dob",
    "marital",
    "status",
    "family{uuid,location" + mm.getProjection("location.Location.FlatProjection") + "}",
    "currentVillage" + mm.getProjection("location.Location.FlatProjection"),
  ];
  const payload = formatPageQueryWithCount("insurees", filters, projections);
  return graphql(payload, "INSUREE_INSUREES");
}

function formatInsureePhoto(photo) {
  return `{
    ${!!photo.id ? `id: ${decodeId(photo.id)}` : ""}
    ${!!photo.uuid ? `uuid: "${photo.uuid}"` : ""}
    ${!!photo.officerId ? `officerId: ${decodeId(photo.officerId)}` : ""}
    ${!!photo.date ? `date: "${photo.date}"` : ""}
    ${!!photo.photo ? `photo: "${photo.photo}"` : ""}
    ${!!photo.folder ? `folder: ${JSON.stringify(photo.folder)}` : ""}
    ${!!photo.folder ? `filename: ${JSON.stringify(photo.filename)}` : ""}
  }`;
}

export function formatInsureeGQL(mm, insuree) {
  return `
    ${insuree.uuid !== undefined && insuree.uuid !== null ? `uuid: "${insuree.uuid}"` : ""}
    ${!!insuree.chfId ? `chfId: "${formatGQLString(insuree.chfId)}"` : ""}
    ${!!insuree.lastName ? `lastName: "${formatGQLString(insuree.lastName)}"` : ""}
    ${!!insuree.otherNames ? `otherNames: "${formatGQLString(insuree.otherNames)}"` : ""}
    ${!!insuree.gender && !!insuree.gender.code ? `genderId: "${insuree.gender.code}"` : ""}
    ${!!insuree.dob ? `dob: "${insuree.dob}"` : ""}
    head: ${!!insuree.head}
    ${!!insuree.marital ? `marital: "${insuree.marital}"` : ""}
    ${!!insuree.passport ? `passport: "${formatGQLString(insuree.passport)}"` : ""}
    ${!!insuree.phone ? `phone: "${formatGQLString(insuree.phone)}"` : ""}
    ${!!insuree.email ? `email: "${formatGQLString(insuree.email)}"` : ""}
    ${!!insuree.currentAddress ? `currentAddress: "${formatGQLString(insuree.currentAddress)}"` : ""}
    ${
      !!insuree.currentVillage && !!insuree.currentVillage.id
        ? `currentVillageId: ${decodeId(insuree.currentVillage.id)}`
        : ""
    }
    ${!!insuree.photo ? `photo:${formatInsureePhoto(insuree.photo)}` : ""}
    cardIssued:${!!insuree.cardIssued}
    ${!!insuree.profession && !!insuree.profession.id ? `professionId: ${insuree.profession.id}` : ""}
    ${!!insuree.education && !!insuree.education.id ? `educationId: ${insuree.education.id}` : ""}
    ${!!insuree.typeOfId && !!insuree.typeOfId.code ? `typeOfIdId: "${insuree.typeOfId.code}"` : ""}
    ${!!insuree.family && !!insuree.family.id ? `familyId: ${decodeId(insuree.family.id)}` : ""}
    ${!!insuree.relationship && !!insuree.relationship.id ? `relationshipId: ${insuree.relationship.id}` : ""}
    ${!!insuree.status ? `status: "${insuree.status}"` : ""}
    ${!!insuree.statusDate && !!insuree.status != INSUREE_ACTIVE_STRING ? `statusDate: "${insuree.statusDate}"` : ""}
    ${
      !!insuree.statusReason && !!insuree.status != INSUREE_ACTIVE_STRING
        ? `statusReason: "${insuree.statusReason.code}"`
        : ""
    }
    ${
      !!insuree.healthFacility && !!insuree.healthFacility.id
        ? `healthFacilityId: ${decodeId(insuree.healthFacility.id)}`
        : ""
    }
    ${!!insuree.jsonExt ? `jsonExt: ${formatJsonField(insuree.jsonExt)}` : ""}
  `;
}

export function formatFamilyGQL(mm, family) {
  let headInsuree = family.headInsuree;
  headInsuree["head"] = true;
  return `
    ${family.uuid !== undefined && family.uuid !== null ? `uuid: "${family.uuid}"` : ""}
    headInsuree: {${formatInsureeGQL(mm, headInsuree)}}
    ${!!family.location ? `locationId: ${decodeId(family.location.id)}` : ""}
    poverty: ${!!family.poverty}
    ${!!family.familyType && !!family.familyType.code ? `familyTypeId: "${family.familyType.code}"` : ""}
    ${!!family.address ? `address: "${formatGQLString(family.address)}"` : ""}
    ${
      !!family.confirmationType && !!family.confirmationType.code
        ? `confirmationTypeId: "${family.confirmationType.code}"`
        : ""
    }
    ${!!family.confirmationNo ? `confirmationNo: "${formatGQLString(family.confirmationNo)}"` : ""}
    ${!!family.jsonExt ? `jsonExt: ${formatJsonField(family.jsonExt)}` : ""}
    ${!!family.contribution ? `contribution: ${formatJsonField(family.contribution)}` : ""}
  `;
}

export function createFamily(mm, family, clientMutationLabel) {
  let mutation = formatMutation("createFamily", formatFamilyGQL(mm, family), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_CREATE_FAMILY_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function updateFamily(mm, family, clientMutationLabel) {
  let mutation = formatMutation("updateFamily", formatFamilyGQL(mm, family), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_FAMILY_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family.uuid,
  });
}

export function deleteFamily(mm, family, deleteMembers, clientMutationLabel) {
  let mutation = formatMutation(
    "deleteFamilies",
    `uuids: ["${family.uuid}"], deleteMembers: ${deleteMembers}`,
    clientMutationLabel,
  );
  family.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_DELETE_FAMILY_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family.uuid,
  });
}

export function createInsuree(mm, insuree, clientMutationLabel) {
  let mutation = formatMutation("createInsuree", formatInsureeGQL(mm, insuree), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_CREATE_INSUREE_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function updateInsuree(mm, insuree, clientMutationLabel) {
  let mutation = formatMutation("updateInsuree", formatInsureeGQL(mm, insuree), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_INSUREE_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function updatePublicInsuree(mm, insuree, clientMutationLabel) {
  let mutation = formatMutation("updateInsuree", formatInsureeGQL(mm, insuree), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_INSUREE_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function removeInsuree(mm, family_uuid, insuree, cancelPolicies, clientMutationLabel) {
  let mutation = formatMutation(
    "removeInsurees",
    `uuid: "${family_uuid}", uuids: ["${insuree.uuid}"], cancelPolicies: ${cancelPolicies}`,
    clientMutationLabel,
  );
  insuree.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_REMOVE_INSUREES_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}

export function deleteInsuree(mm, family_uuid, insuree, clientMutationLabel) {
  let mutation = formatMutation(
    "deleteInsurees",
    `${!!family_uuid ? `uuid: "${family_uuid}",` : ""} uuids: ["${insuree.uuid}"]`,
    clientMutationLabel,
  );
  insuree.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_DELETE_INSUREES_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}

export function setFamilyHead(mm, family_uuid, insuree_uuid, clientMutationLabel) {
  let mutation = formatMutation(
    "setFamilyHead",
    `uuid: "${family_uuid}", insureeUuid: "${insuree_uuid}"`,
    clientMutationLabel,
  );
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_SET_FAMILY_HEAD_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}

export function changeFamily(mm, family_uuid, insuree, cancelPolicies, clientMutationLabel) {
  let mutation = formatMutation(
    "changeInsureeFamily",
    `familyUuid: "${family_uuid}", insureeUuid: "${insuree.uuid}", cancelPolicies: ${cancelPolicies}`,
    clientMutationLabel,
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_CHANGE_FAMILY_HEAD_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      familyUuid: family_uuid,
      insureeUuid: insuree.uuid,
    },
  );
}

export const fetchPublicInsureeByUuid = (uuid) => (dispatch) => {
  const action = graphqlWithVariables(
    `
      query ($uuid: UUID!) {
        insureeByUuidPublic(uuid: $uuid) {
          id
          uuid
          chfId
          lastName
          otherNames
          dob
          age
          validityFrom
          validityTo
          family { id uuid }            # if your public type exposes this
          photo { id uuid date folder filename officerId photo }
          gender { code gender }
          education { id }
          profession { id }
          marital
          cardIssued
          currentVillage { id uuid code name type parent { id uuid } }
          currentAddress
          typeOfId { code }
          passport
          relationship { id }
          head
          status
          jsonExt
          statusDate
          statusReason { code insureeStatusReason }
          email
          phone
          healthFacility { id uuid code name level }
        }
      }
    `,
    { uuid },
    "INSUREE_BY_UUID_PUBLIC"
  );
  // return the dispatch promise so callers can await it
  return dispatch(action);
};


export function insureeNumberValidationCheck(mm, variables) {
  return graphqlWithVariables(
    `
    query ($insuranceNumber: String!) {
      insureeNumberValidity(insureeNumber: $insuranceNumber) {
        isValid
        errorCode
        errorMessage
      }
    }
    `,
    variables,
    `INSUREE_NUMBER_VALIDATION_FIELDS`,
  );
}

export function sendVerificationEmail(insureeUuid, signInUrl, clientMutationLabel) {
  const mutation = formatMutation(
    "sendVerificationEmail",
    `insureeUuid: "${insureeUuid}", signInUrl: "${signInUrl}"`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["INSUREE_SEND_EMAIL_REQ", "INSUREE_SEND_EMAIL_RESP", "INSUREE_SEND_EMAIL_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function insureeNumberSetValid() {
  return (dispatch) => {
    dispatch({ type: `INSUREE_NUMBER_VALIDATION_FIELDS_SET_VALID` });
  };
}

export function insureeNumberValidationClear() {
  return (dispatch) => {
    dispatch({ type: `INSUREE_NUMBER_VALIDATION_FIELDS_CLEAR` });
  };
}

export function checkIfHeadSelected(insuree) {
  const headSelected = Boolean(insuree) ? true : false;

  return (dispatch) => {
    dispatch({ type: "INSUREE_CHECK_IS_HEAD_SELECTED", payload: { headSelected } });
  };
}


