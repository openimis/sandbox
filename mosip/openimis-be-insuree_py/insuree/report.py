from insuree.reports import insuree_family_overview, enrolled_families, insuree_missing_photo, \
    insurees_pending_enrollment
from insuree.reports.enrolled_families import enrolled_families_query
from insuree.reports.insuree_family_overview import insuree_family_overview_query
from insuree.reports.insuree_missing_photo import insuree_missing_photo_query
from insuree.reports.insurees_pending_enrollment import insurees_pending_enrollment_query


# Insuree_family_overview are the same report, with native code and with the stored_procedure
report_definitions = [
    {
        "name": "insuree_missing_photo",
        "engine": 0,
        "default_report": insuree_missing_photo.template,
        "description": "Missing insuree photos",
        "module": "insuree",
        "python_query": insuree_missing_photo_query,
        "permission": ["131215"],
    },
    {
        "name": "insurees_pending_enrollment",
        "engine": 0,
        "default_report": insurees_pending_enrollment.template,
        "description": "Insurees pending enrollment",
        "module": "insuree",
        "python_query": insurees_pending_enrollment_query,
        "permission": ["131215"],
    },
    {
        "name": "insuree_family_overview",
        "engine": 0,
        "default_report": insuree_family_overview.template,
        "description": "Simple claim report",
        "module": "insuree",
        "python_query": insuree_family_overview_query,
        "permission": ["131215"],
    },
    {
        "name": "enrolled_families",
        "engine": 0,
        "default_report": enrolled_families.template,
        "description": "Enrolled families",
        "module": "insuree",
        "python_query": enrolled_families_query,
        "permission": ["131215"],
    },
]
