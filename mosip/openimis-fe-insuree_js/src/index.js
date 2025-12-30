import React from 'react';
import { AssignmentInd, GroupAdd, People, Person } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import InsureeMainMenu from "./menus/InsureeMainMenu";
import FamiliesPage from "./pages/FamiliesPage";
import InsureePage from "./pages/InsureePage";
import FamilyPage from "./pages/FamilyPage";
import { CappedItemServicePage } from "./pages/CappedItemServicePage";
import InsureesPage from "./pages/InsureesPage";
import ProfilePage from "./pages/ProfilePage";
import FamilyOverviewPage from "./pages/FamilyOverviewPage";
import Enquiry from "./components/Enquiry";
import InsureeOfficerPicker from "./pickers/InsureeOfficerPicker";
import FamilyPicker from "./pickers/FamilyPicker";
import InsureePicker from "./pickers/InsureePicker";
import InsureeChfIdPicker from "./pickers/InsureeChfIdPicker";
import InsureeGenderPicker from "./pickers/InsureeGenderPicker";
import EducationPicker from "./pickers/EducationPicker";
import ProfessionPicker from "./pickers/ProfessionPicker";
import IdentificationTypePicker from "./pickers/IdentificationTypePicker";
import InsureeMaritalStatusPicker from "./pickers/InsureeMaritalStatusPicker";
import InsureeStatusPicker from "./pickers/InsureeStatusPicker";
import InsureeStatusReasonPicker from "./pickers/InsureeStatusReasonPicker";
import FamilyPovertyStatusPicker from "./pickers/FamilyPovertyStatusPicker";
import ConfirmationTypePicker from "./pickers/ConfirmationTypePicker";
import FamilyTypePicker from "./pickers/FamilyTypePicker";
import PhotoStatusPicker from "./pickers/PhotoStatusPicker";
import FamilyStatusPicker from "./pickers/FamilyStatusPicker";
import RelationPicker from "./pickers/RelationPicker";
import InsureeNumberInput from "./pickers/InsureeNumberInput";
import InsureeAvatar from "./components/InsureeAvatar";
import InsureeCappedItemServiceLink from "./components/InsureeCappedItemServiceLink";
import InsureeProfileLink from "./components/InsureeProfileLink";
import InsureeSummary from "./components/InsureeSummary";
import InsureeFirstServicePointDisplay from "./components/InsureeFirstServicePointDisplay";
import InsureeFirstServicePointPanel from "./components/InsureeFirstServicePointPanel";
import InsureeAddress from "./components/InsureeAddress";
import FamilyDisplayPanel from "./components/FamilyDisplayPanel";
import { familyLabel } from "./utils/utils";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import { FAMILY_PICKER_PROJECTION, INSUREE_PICKER_PROJECTION } from "./actions";
import { decodeId } from "@openimis/fe-core";
import EnrolledFamiliesReport from "./reports/EnrolledFamiliesReport";
import InsureeFamilyOverviewReport from "./reports/InsureeFamilyOverviewReport";
import InsureeMissingPhotoReport from "./reports/InsureeMissingPhotoReport";
import InsureePendingEnrollmentReport from "./reports/InsureePendingEnrollmentReport";
import { RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_INSUREE } from "./constants";
import MosipCallbackPage from './pages/MosipCallbackPage';

const ROUTE_INSUREE_FAMILIES = "insuree/families";
const ROUTE_INSUREE_FAMILY_OVERVIEW = "insuree/families/familyOverview";
const ROUTE_INSUREE_FAMILY = "insuree/family";
const ROUTE_INSUREE_PROFILE = "insuree/profile";
const ROUTE_INSUREE_INSUREES = "insuree/insurees";
const ROUTE_INSUREE_INSUREE = "insuree/insurees/insuree";
const ROUTE_INSUREE_INSUREE_CALLBACK = "insuree/verify";


const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "insuree", reducer }],
  "reports": [
    {
      key: "insuree_missing_photo",
      component: InsureeMissingPhotoReport,
      isValid: (values) => true,
      getParams: (values) => {
        const params = {};
        if (values.officer) {
          params.officerId = decodeId(values.officer.id);
        }
        if (values.location) {
          params.locationId = decodeId(values.location.id);
        }
        return params;
      },
    },
    {
      key: "insurees_pending_enrollment",
      component: InsureePendingEnrollmentReport,
      isValid: (values) => values.officer && values.location && values.dateFrom && values.dateTo,
      getParams: (values) => ({
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
        officerId: decodeId(values.officer.id),
        locationId: decodeId(values.location.id),
      }),
    },
    {
      key: "insuree_family_overview",
      component: InsureeFamilyOverviewReport,
      isValid: (values) => values.dateFrom && values.dateTo,
      getParams: (values) => ({
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
      }),
    },
    {
      key: "enrolled_families",
      component: EnrolledFamiliesReport,
      isValid: (values) => values.location && values.dateFrom && values.dateTo,
      getParams: (values) => ({
        locationId: decodeId(values.location.id),
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
      }),
    },
  ],
  "refs": [
    { key: "insuree.InsureeOfficerPicker", ref: InsureeOfficerPicker },
    { key: "insuree.InsureeOfficerPicker.projection", ref: ["id", "uuid", "code", "lastName", "otherNames"] },
    { key: "insuree.InsureePicker", ref: InsureePicker },
    { key: "insuree.InsureeChfIdPicker", ref: InsureeChfIdPicker },
    { key: "insuree.InsureeStatusPicker", ref: InsureeStatusPicker },
    { key: "insuree.InsureeStatusReasonPicker", ref: InsureeStatusReasonPicker },
    { key: "insuree.InsureePicker.projection", ref: INSUREE_PICKER_PROJECTION },
    { key: "insuree.InsureePicker.sort", ref: "insuree__last_name" },
    { key: "insuree.FamilyPicker", ref: FamilyPicker },
    { key: "insuree.FamilyPicker.projection", ref: FAMILY_PICKER_PROJECTION },
    { key: "insuree.FamilyPicker.sort", ref: "family__head_insuree__lastName" },
    { key: "insuree.familyLabel", ref: familyLabel },
    { key: "insuree.InsureeGenderPicker", ref: InsureeGenderPicker },
    { key: "insuree.InsureeMaritalStatusPicker", ref: InsureeMaritalStatusPicker },
    { key: "insuree.EducationPicker", ref: EducationPicker },
    { key: "insuree.ProfessionPicker", ref: ProfessionPicker },
    { key: "insuree.IdentificationTypePicker", ref: IdentificationTypePicker },
    { key: "insuree.FamilyPovertyStatusPicker", ref: FamilyPovertyStatusPicker },
    { key: "insuree.ConfirmationTypePicker", ref: ConfirmationTypePicker },
    { key: "insuree.FamilyTypePicker", ref: FamilyTypePicker },
    { key: "insuree.PhotoStatusPicker", ref: PhotoStatusPicker },
    { key: "insuree.FamilyStatusPicker", ref: FamilyStatusPicker },
    { key: "insuree.RelationPicker", ref: RelationPicker },
    { key: "insuree.InsureeNumberInput", ref: InsureeNumberInput },

    { key: "insuree.route.families", ref: ROUTE_INSUREE_FAMILIES },
    { key: "insuree.route.familyOverview", ref: ROUTE_INSUREE_FAMILY_OVERVIEW },
    { key: "insuree.route.family", ref: ROUTE_INSUREE_FAMILY },
    { key: "insuree.route.insurees", ref: ROUTE_INSUREE_INSUREES },
    { key: "insuree.route.insuree", ref: ROUTE_INSUREE_INSUREE },
    { key: "insuree.route.insuree.callback", ref: ROUTE_INSUREE_INSUREE_CALLBACK },
    { key: "insuree.route.insureeProfile", ref: ROUTE_INSUREE_PROFILE },

    { key: "insuree.Avatar", ref: InsureeAvatar },
    { key: "insuree.Summary", ref: InsureeSummary },
    { key: "insuree.InsureeFirstServicePointDisplay", ref: InsureeFirstServicePointDisplay },
    { key: "insuree.InsureeFirstServicePointPanel", ref: InsureeFirstServicePointPanel },
    { key: "insuree.InsureeAddress", ref: InsureeAddress },
    { key: "insuree.ProfileLink", ref: InsureeProfileLink },
    { key: "insuree.CappedItemServiceLink", ref: InsureeCappedItemServiceLink },
  ],
  "core.Router": [
    { path: ROUTE_INSUREE_FAMILIES, component: FamiliesPage },
    { path: ROUTE_INSUREE_FAMILY + "/:family_uuid?", component: FamilyPage },
    { path: ROUTE_INSUREE_FAMILY_OVERVIEW + "/:family_uuid", component: FamilyOverviewPage },
    { path: ROUTE_INSUREE_INSUREES, component: InsureesPage },
    { path: ROUTE_INSUREE_INSUREE + "/:insuree_uuid?/:family_uuid?", component: InsureePage },
    { path: "insuree/cappedItemService", component: CappedItemServicePage },
    { path: ROUTE_INSUREE_PROFILE + "/:insuree_uuid", component: ProfilePage },
  ],
  "core.UnauthenticatedRouter": [
  { path: ROUTE_INSUREE_INSUREE_CALLBACK, component: MosipCallbackPage },
  ],
  "core.AppBar": [Enquiry],
  "core.MainMenu": [{ name: 'InsureeMainMenu', component: InsureeMainMenu }],
  "insuree.InsureeSummaryAvatar": [InsureeAvatar],
  "insuree.InsureeSummaryExt": [InsureeFirstServicePointDisplay],
  "insuree.Insuree.panels": [InsureeFirstServicePointPanel],
  "policy.Policy.headPanel": [FamilyDisplayPanel],
  "invoice.SubjectAndThirdpartyPicker": [
    {
      type: "insuree",
      picker: InsureePicker,
      pickerProjection: INSUREE_PICKER_PROJECTION,
    },
    {
      type: "family",
      picker: FamilyPicker,
      pickerProjection: FAMILY_PICKER_PROJECTION,
    },
  ],
  "insuree.MainMenu": [
    {
      text: <FormattedMessage module="insuree" id="menu.addFamilyOrGroup" />,
      icon: <GroupAdd />,
      route: "/" + ROUTE_INSUREE_FAMILY,
      withDivider: true,
      id: "insuree.addFamilyOrGroup",
      filter: (rights) => rights.includes(RIGHT_FAMILY_ADD),
    },
    {
      text: <FormattedMessage module="insuree" id="menu.familiesOrGroups" />,
      icon: <People />,
      route: "/" + ROUTE_INSUREE_FAMILIES,
      id: "insuree.familiesOrGroups",
      filter: (rights) => rights.includes(RIGHT_FAMILY),
    },
    {
      text: <FormattedMessage module="insuree" id="menu.insurees" />,
      icon: <Person />,
      route: "/" + ROUTE_INSUREE_INSUREES,
      id: "insuree.insurees",
      filter: (rights) => rights.includes(RIGHT_INSUREE),
    }
  ],
};

export const InsureeModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
