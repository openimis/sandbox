# openIMIS Frontend Insuree reference module

This repository holds the files of the openIMIS Frontend Insuree reference module.
It is dedicated to be deployed as a module of [openimis-fe_js](https://github.com/openimis/openimis-fe_js).

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/openimis/openimis-fe-insuree_js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/openimis/openimis-fe-insuree_js/alerts/)

## Main Menu Contributions

- **Insurees and Policies** (insuree.mainMenu translation key)

  **Add Family/Group** (insuree.menu.addFamilyOrGroup translation key), displayed if user has the right `101002`

  **Families/Group** (insuree.menu.familiesOrGroups translation key), displayed if user has the right `101001`

  **Insurees** (insuree.menu.insureestranslation key), displayed if user has the right `101101`

## Other Contributions

- `core.AppBar`: `[Enquiry]`, registering the enquiry search input (and related dialog) to the AppBar
- `insuree.InsureeSummaryAvatar`: `[InsureeAvatar]`, contributing to own contribution point and register the default Avatar loading component to InsureeSummary
- `insuree.InsureeSummaryExt`: `[InsureeFirstServicePoint]`,contributing to own contribution point and register the default the First Service Point as insuree summary extension
- `insuree.Family.panels`: `[InsureeFirstServicePointPanel]`, contributing to own contribution point and adding First Service Point contribution when creating a new Family (and the head insuree along)
- `insuree.Insuree.panels`: `[InsureeFirstServicePointPanel]`, contributing to own contribution point and adding First Service Point contribution when creating a new Insuree
- `insuree.InsureePage.panels`: `[InsureeMasterPanel, InsureeFirstServicePointPanel]`, contributing to own contribution point and register the defaults MasterPanel and First Service Point as panels of Insuree Page
- `core.Router`: registering the `insuree/create`, `insuree/families`, `insuree/insurees`, `insuree/cappedItemService` and `insuree/profile` routes in openIMIS client-side router
- `invoice.SubjectAndThirdpartyPicker`, providing Insuree picker and Family picker for Invoice module
- `isWorker`: Specifies whether insuree should be replaced with Moldovan worker. In Moldova, the Insuree entity is replaced by the Worker. When set to true, the system displays 'Workers and Vouchers' instead of the default 'Insurees and Policies', aligning the interface with the specific needs of worker representation. Default: __false__.
- `renderLastNameFirst`: This setting allows for the customization of name display order, specifically toggling between displaying the given name first or the last name first. Default: __true__. When setting is turned off, given name is displayed before the last name.

## Available Contribution Points

- `insuree.MainMenu`: ability to add entries within the main menu entry (known usage: openimis-fe-policy)
- `insuree.InsureeSummaryAvatar`: ability to add (replace default?) component dedicated to load the insuree avatar (left side of the summary)
- `insuree.InsureeSummaryCore`: ability to add components to the insuree summary primary panel
- `insuree.InsureeSummaryExt`: ability to add (replace default?) component to extend insuree summary (right side)
- `insuree.InsureeSummary`: ability to extend the insuree summary (Grid rows below)

## Published Components

- `insuree.InsureePicker`, ability to search and select an insuree (via searcher dialog)
- `insuree.InsureeChfIdPicker`, ability to select an insuree, from his (exact) CHFID
- `insuree.InsureeNumberInput`, input that validates the insuree's number with the server
- `insuree.InsureeOfficerPicker`, picker (select drop down) for insuree (enrolment) officers
- `insuree.InsureeGenderPicker`, picker (drop down) for available insuree genders (male, female, other)
- `insuree.InsureeMaritalStatusPicker`, picker (drop down) for available insuree martial status
- `insuree.EducationPicker`, picker (drop down) for available educations
- `insuree.ProfessionPicker`, picker (drop down) for available profesions
- `insuree.IdentificationTypePicker`, picker (drop down) for available identification types (passport,...)
- `insuree.ConfirmationTypePicker`, picker (drop down) for available identification confirmation type
- `insuree.FamilyPovertyStatusPicker`, picker (drop down) for available poverty status
- `insuree.FamilyTypePicker`, picker (drop down) for available family types
- `insuree.PhotoStatusPicker`, picker (drop down) for available photo status
- `insuree.FamilyStatusPicker`, picker (drop down) for available family status (with/without)
- `insuree.RelationPicker`, picker (drop down) for available relation in family (spouse,...)
- `insuree.Avatar`, loading insuree Avatar (from legacy openIMIS, via `/photo/:insuree.photo.folder/:insuree.photo.filename` URL). This component is the default contribution to `insuree.InsureeSummaryAvatar`
- `insuree.Summary`: component displaying an insuree summary (highly extensible via contribution point). Known usage: Enquiry dialog
- `insuree.InsureeFirstServicePointDisplay`, Grid container displaying (compact readonly version) insuree first service point (insuree primary Health Facility, District and Region). This component is the default contribution to `insuree.InsureeSummaryExt`
- `insuree.InsureeFirstServicePointPanel`, Grid container displaying (full, editable) insuree first service point (insuree primary Health Facility, District and Region).
- `insuree.FamilySummary`, Paper component displaying insuree family information. Can be added to `insuree.InsureeSummary` contribution point (cfr. Nepali 'setup')
- `insuree.ProfileLink`, Link to legacy insuree Profile page. Can be added to `insuree.InsureeSummary` contribution point (cfr. Nepali 'setup')
- `insuree.CappedItemServiceLink`, Link to legacy insuree Capped Items and Services page. Can be added to `insuree.InsureeSummary` contribution point (cfr. Nepali 'setup')

## Dispatched Redux Actions

- `INSUREE_ENQUIRY_{REQ|RESP|ERR}`: fetching insuree main information (Known usage: enquiry dialog)
- `INSUREE_FAMILY_{REQ|RESP|ERR}`: fetching insuree family information (Known usage: `insuree.FamilySummary` component)
- `INSUREE_INSUREES_{REQ|RESP|ERR}`: fetching insurees with filter (CHFID, Name and/or OtherName). Known usage: `insuree.InsureePicker`

## Other Modules Listened Redux Actions

None

## Other Modules Redux State Bindings

- `state.core.user`, to access user info (rights,...)

## Configurations Options

- `debounceTime`: debounce time (in ms) before triggering the search in insuree picker (Default: `800`)
- `insureeForm.chfIdMaxLength`, the max size of an insuree CHF ID, default 12;
- `filterFamiliesOnMembers`, ability to filter families by its members data (chfid, last names,...), default: true
- `canCancelPoliciesOnChangeInsureeFamily`, allow user to cancel existing insuree's policies when changing an insuree from family; default: true
- `canKeepPoliciesOnChangeInsureeFamily`, allow user to keep existing insuree's policies active when changing an insuree from family; default: true
- `canCancelPoliciesOnRemoveInsureeFromFamily`, allow user to cancel existing insuree's policies when removing an insuree from a family; default: true
- `canKeepPoliciesOnRemoveInsureeFromFamily`, allow user to keep existing insuree's policies active when removing an insuree from a family; default: true
- `familyInsureesOverview.rowsPerPageOptions`, available rows per page options in insuree overview within family page; default: `[5, 10, 20]`
- `familyInsureesOverview.defaultPageSize`, opening rows per page displayed in insuree overview within family page, default: 5
- `familyFilter.rowsPerPageOptions`, available rows per page options in family searcher; default: `[10, 20, 50, 100]`
- `familyFilter.defaultPageSize`, opening rows per page displayed in family searcher; default: 10
- `insureeFilter.rowsPerPageOptions`, available rows per page options in insuree searcher; default: `[10, 20, 50, 100]`
- `insureeFilter.defaultPageSize`, opening rows per page displayed in insuree searcher; default: 10
- `EducationPicker.selectThreshold`, threshold to switch from combo box to drop down options in eduction picker, default: 10
- `ProfessionPicker.selectThreshold`, threshold to switch from combo box to drop down options in profession picker, default: 10
- `InsureeOfficer.selectThreshold`, threshold to switch from combo box to drop down options in insuree officer picker, default: 10
- `RelationPicker.selectThreshold`, threshold to switch from combo box to drop down options in family relation picker, default: 10
- `insureeForm.isInsureeFirstServicePointRequired`, allow to set FSP to required while creating new insuree, default false.
- `showInsureeSummaryAddress`, show insuree address information in enquire, default false.
- `insureeForm.isInsureeStatusRequired`, make insuree status dropdown mandatory, default false.
- `insureeForm.isInsureePhotoRequired`, make photo upload of an insuree mandatory, default false.
- `isPhotoRequired`, Make photo upload of an insuree mandatory. (default: 'False)
- ' `"isCurrentAdminEnrollmentOfficerActive"`, Enables automatic assignment of 
  the current user as the enrolment officer during family or insuree creation. If 'True', the officer is inferred from session; if 'False', manual selection remains available. (default: 'False)
- `isDefaultFetchInsureeActivated`, manage default fetch behavior of insuree searcher ; default: true
- `isDefaultFetchFamilyActivated`, manage default fetch behavior of family searcher ; default: true

