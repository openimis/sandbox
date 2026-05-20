import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Typography, CircularProgress,
    Divider, TextField, IconButton, Box, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import AccountBalanceWalletIcon from "@material-ui/icons/AccountBalanceWallet";
import HomeIcon from "@material-ui/icons/Home";
import AssessmentIcon from "@material-ui/icons/Assessment";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import { journalize } from "@openimis/fe-core";
import { fetchSocialRegistryData, clearSocialRegistryData } from "../actions";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = (theme) => ({
    sectionHeader: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.palette.primary.main,
        marginBottom: 8,
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    fieldLabel: {
        fontSize: 11,
        color: theme.palette.text.secondary,
        marginBottom: 2,
    },
    fieldValue: {
        fontSize: 13,
        fontWeight: 500,
        color: theme.palette.text.primary,
    },
    fieldCard: {
        padding: "10px 14px",
        borderRadius: 8,
        background: theme.palette.action.hover,
        height: "100%",
    },
    memberTable: {
        "& th": { fontWeight: 700, fontSize: 11, background: "#f5f5f5" },
        "& td": { fontSize: 12 },
    },
    txnBar: {
        background: theme.palette.primary.main,
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 6,
        display: "flex",
        gap: 28,
        fontSize: 11,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    txnItem: { display: "flex", flexDirection: "column" },
    txnLabel: { opacity: 0.7, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" },
    txnValue: { fontWeight: 600, fontSize: 12 },
    dialogTitle: {
        padding: "12px 20px",
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    benefitRow: {
        "&:hover": { background: theme.palette.action.hover },
    },
    statusActive: {
        background: "#e8f5e9",
        color: "#2e7d32",
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
    },
    statusInactive: {
        background: "#ffebee",
        color: "#c62828",
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
    },
    boolYes: {
        background: "#e8f5e9",
        color: "#2e7d32",
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
    },
    boolNo: {
        background: "#fff3e0",
        color: "#e65100",
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
    },
    alertSuccess: {
        backgroundColor: "#e8f5e9",
        color: "#1b5e20",
        padding: "16px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border: "1px solid #c8e6c9",
        marginBottom: "16px"
    },
    alertError: {
        backgroundColor: "#ffebee",
        color: "#b71c1c",
        padding: "16px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        border: "1px solid #ffcdd2",
        marginBottom: "16px"
    },
    metricRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "6px",
        background: "#fff",
        border: `1px solid ${theme.palette.divider}`,
        marginBottom: "6px"
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fullName = (name) => {
    if (!name) return "—";
    return [name.prefix, name.givenName, name.secondName, name.surname, name.suffix]
        .filter(Boolean).join(" ") || "—";
};

const firstId = (list) =>
    Array.isArray(list) && list.length > 0 ? list[0].identifierValue : "—";

const fmt      = (v) => (v != null && v !== "" ? String(v) : "—");
const fmtDate  = (v) => (v ? v.split("T")[0] : "—");
const fmtScore = (v) => (v != null ? `${(v * 100).toFixed(0)}%` : "—");

const calculateAge = (dobString) => {
    if (!dobString) return 999;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Field = ({ classes, label, value }) => (
    <Grid item xs={12} sm={6} md={4}>
        <div className={classes.fieldCard}>
            <div className={classes.fieldLabel}>{label}</div>
            <div className={classes.fieldValue}>{value || "—"}</div>
        </div>
    </Grid>
);

const SectionHeader = ({ classes, icon: Icon, title, color }) => (
    <Grid item xs={12}>
        <div className={classes.sectionHeader} style={color ? { color } : {}}>
            {Icon && <Icon style={{ fontSize: 15 }} />}
            {title}
        </div>
    </Grid>
);

// ── Main Component ────────────────────────────────────────────────────────────
class SocialRegistryVerification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            searchTerm: "",
        };
    }

    handleOpen = () => {
        const initial = this.props.identifier || "";
        this.setState(
            { open: true, searchTerm: initial },
            () => { if (initial) this.props.fetchSocialRegistryData(initial); }
        );
    };

    handleClose = () => {
        this.setState({ open: false, searchTerm: "" });
        this.props.clearSocialRegistryData();
    };

    handleManualSearch = () => {
        if (this.state.searchTerm) this.props.fetchSocialRegistryData(this.state.searchTerm);
    };

    handleKeyDown = (e) => { if (e.key === "Enter") this.handleManualSearch(); };

    render() {
        const { open, searchTerm } = this.state;
        const { fetching, data, classes } = this.props;

        // ── Data Navigation ──────────────────────────────────────────────────
        const searchResponse = data?.searchResponse?.[0];
        const record         = searchResponse?.regRecords?.[0] || searchResponse?.data?.reg_records?.[0];
        
        const pd             = record?.personalDetails || record;
        const demo           = pd?.demographicInfo || pd?.demographic_info;
        const name           = demo?.name;
        const household      = record?.householdDetails;
        const economic       = record?.economicDetails || record;
        const benefits       = record?.benefits || [];
        const pagination     = searchResponse?.pagination;
        
        const memberList     = household?.memberList || record?.related_person || [];

        // ── Metrics of Eligibility Evaluation ────────────────────────────────
        const hasRecord = !!record;
        
        const rawIncome = economic?.incomeLevel || economic?.income_level;
        const isPoor = hasRecord && String(rawIncome).toLowerCase() === "low";
        
        const childrenUnder5 = hasRecord ? memberList.filter(m => {
            const dob = m.demographicInfo?.birthDate || m.demographic_info?.birth_date || m.birth_date;
            return calculateAge(dob) < 5;
        }) : [];
        const hasFourChildrenUnder5 = childrenUnder5.length >= 4;

        const isEligible = hasRecord && isPoor && hasFourChildrenUnder5;

        return (
            <Box display="inline-block">
                <Button onClick={this.handleOpen} style={{ padding: 0, minWidth: "auto" }}>
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd8pz4Z4bOrdpmFWxemPrbze99odbZjBchqQ&s"
                        alt="Social Registry"
                        style={{ height: 40 }}
                    />
                </Button>

                <Dialog open={open} onClose={this.handleClose} maxWidth="md" fullWidth>

                    {/* ── Title ── */}
                    <DialogTitle disableTypography className={classes.dialogTitle}>
                        <Grid container justify="space-between" alignItems="center">
                            <Grid item>
                                <Typography variant="h6" style={{ fontWeight: 600, fontSize: 16 }}>
                                    Social Registry Verification
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    OpenG2P · DCI Sync Search
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                    <TextField
                                        label="Search UIN / ID"
                                        variant="outlined"
                                        size="small"
                                        value={searchTerm}
                                        onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                        onKeyDown={this.handleKeyDown}
                                        style={{ width: 200 }}
                                    />
                                    <IconButton color="primary" onClick={this.handleManualSearch} size="small">
                                        <SearchIcon />
                                    </IconButton>
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogTitle>

                    {/* ── Content ── */}
                    <DialogContent dividers style={{ padding: "16px 20px" }}>
                        {fetching ? (
                            <Box textAlign="center" py={6}>
                                <CircularProgress />
                                <Typography style={{ marginTop: 12 }} color="textSecondary">
                                    Fetching social registry data…
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>

                                {/* ══ Transaction Bar ══════════════════════════════ */}
                                {record && (
                                    <Grid item xs={12}>
                                        <div className={classes.txnBar}>
                                            <div className={classes.txnItem}>
                                                <span className={classes.txnLabel}>Transaction ID</span>
                                                <span className={classes.txnValue}>{fmt(data?.transactionId || data?.message?.transaction_id)}</span>
                                            </div>
                                            <div className={classes.txnItem}>
                                                <span className={classes.txnLabel}>Correlation ID</span>
                                                <span className={classes.txnValue}>{fmt(data?.correlationId || data?.message?.correlation_id)}</span>
                                            </div>
                                            <div className={classes.txnItem}>
                                                <span className={classes.txnLabel}>Status</span>
                                                <span className={classes.txnValue}>
                                                    {searchResponse?.status === "succ" ? "✓ Verified" : fmt(searchResponse?.status)}
                                                </span>
                                            </div>
                                            <div className={classes.txnItem}>
                                                <span className={classes.txnLabel}>Results</span>
                                                <span className={classes.txnValue}>
                                                    {pagination?.totalCount || pagination?.total_count || "—"} record(s)
                                                </span>
                                            </div>
                                        </div>
                                    </Grid>
                                )}

                                {/* ══ 0. Eligibility Metrics Panel ════════════════ */}
                                <SectionHeader classes={classes} icon={AssessmentIcon} title="Eligibility Metrics Checklist" color={isEligible ? "#2e7d32" : "#c62828"} />
                                
                                <Grid item xs={12}>
                                    {isEligible ? (
                                        <div className={classes.alertSuccess}>
                                            <CheckCircleOutlineIcon />
                                            <Typography variant="body2" style={{ fontWeight: 600 }}>
                                                Eligible: This household meets all statutory requirements for program enrollment.
                                            </Typography>
                                        </div>
                                    ) : (
                                        <div className={classes.alertError}>
                                            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                                <ErrorOutlineIcon />
                                                <Typography variant="body2" style={{ fontWeight: 600 }}>
                                                    Not Eligible for Program Enrollment
                                                </Typography>
                                            </Box>
                                        </div>
                                    )}

                                    {/* Structured Merit List Tracking */}
                                    <div className={classes.metricRow}>
                                        {hasRecord ? <CheckIcon style={{ color: "#2e7d32" }} /> : <CloseIcon style={{ color: "#c62828" }} />}
                                        <Typography variant="body2" style={{ fontWeight: 500, color: hasRecord ? "#1b5e20" : "#b71c1c" }}>
                                            Record Found: {hasRecord ? "Social Registry validation handshake success." : "No identity record found inside the queried Social Registry sync target."}
                                        </Typography>
                                    </div>

                                    <div className={classes.metricRow}>
                                        {isPoor ? <CheckIcon style={{ color: "#2e7d32" }} /> : <CloseIcon style={{ color: "#c62828" }} />}
                                        <Typography variant="body2" style={{ fontWeight: 500, color: isPoor ? "#1b5e20" : "#b71c1c" }}>
                                            Poverty Status: {isPoor ? "Confirmed via SR Standard (Income Level: Low)" : `Rejected (Current Level: '${rawIncome || "Unknown"}', Must be 'Low')`}
                                        </Typography>
                                    </div>

                                    <div className={classes.metricRow}>
                                        {hasFourChildrenUnder5 ? <CheckIcon style={{ color: "#2e7d32" }} /> : <CloseIcon style={{ color: "#c62828" }} />}
                                        <Typography variant="body2" style={{ fontWeight: 500, color: hasFourChildrenUnder5 ? "#1b5e20" : "#b71c1c" }}>
                                            Dependent Metric: {hasFourChildrenUnder5 ? `Passed (Found ${childrenUnder5.length} children under 5 years old)` : `Failed (Requires minimum 4 children under 5 years old. Found: ${childrenUnder5.length})`}
                                        </Typography>
                                    </div>
                                </Grid>

                                {record && (
                                    <>
                                        <Grid item xs={12}><Divider style={{ marginTop: 8 }} /></Grid>

                                        {/* ══ 1. Personal Details ══════════════════════════ */}
                                        <SectionHeader classes={classes} icon={PersonIcon} title="Individual Personal Details" />

                                        <Field classes={classes} label="Full Name"        value={fullName(name)} />
                                        <Field classes={classes} label="UIN"              value={firstId(pd?.memberIdentifier || pd?.member_identifier)} />
                                        <Field classes={classes} label="ID Type"          value={fmt(pd?.memberIdentifier?.[0]?.identifierType || pd?.member_identifier?.[0]?.identifier_type)} />
                                        <Field classes={classes} label="Sex"              value={fmt(demo?.sex)} />
                                        <Field classes={classes} label="Date of Birth"    value={fmtDate(demo?.birthDate || demo?.birth_date)} />
                                        <Field classes={classes} label="Marital Status"   value={fmt(pd?.maritalStatus || pd?.marital_status)} />
                                        <Field classes={classes} label="Education Level"  value={fmt(pd?.educationLevel || pd?.education_level)} />
                                        <Field classes={classes} label="Language(s)"      value={(pd?.languageCode || pd?.language_code || []).join(", ") || "—"} />
                                        <Field classes={classes} label="Disability"
                                            value={
                                                (pd?.selfIdDisability != null || pd?.self_id_disability != null)
                                                    ? <span className={(pd?.selfIdDisability || pd?.self_id_disability) ? classes.boolYes : classes.boolNo}>
                                                        {(pd?.selfIdDisability || pd?.self_id_disability) ? "Yes" : "No"}
                                                      </span>
                                                    : "—"
                                            }
                                        />
                                        {demo?.phoneNumber?.filter(Boolean).length > 0 && (
                                            <Field classes={classes} label="Phone"
                                                value={demo.phoneNumber.filter(Boolean).join(", ")} />
                                        )}
                                        {demo?.email && (
                                            <Field classes={classes} label="Email" value={demo.email} />
                                        )}
                                        <Field classes={classes} label="Registered"       value={fmtDate(pd?.registrationDate || pd?.registration_date)} />
                                        <Field classes={classes} label="Last Updated"     value={fmtDate(pd?.lastUpdated || pd?.last_updated)} />

                                        <Grid item xs={12}><Divider /></Grid>

                                        {/* ══ 2. Household Details ═════════════════════════ */}
                                        <SectionHeader classes={classes} icon={GroupIcon} title="Household Details" />

                                        {household ? (
                                            <>
                                                <Field classes={classes} label="Household ID"      value={firstId(household?.groupIdentifier)} />
                                                <Field classes={classes} label="Group Type"        value={fmt(household?.groupType)} />
                                                <Field classes={classes} label="Location"          value={fmt(household?.place?.name)} />
                                                <Field classes={classes} label="Group Size"        value={fmt(household?.groupSize)} />
                                                <Field classes={classes} label="Poverty Score"     value={fmtScore(household?.povertyScore)} />
                                                <Field classes={classes} label="Score Type"        value={fmt(household?.povertyScoreType)} />
                                                <Field classes={classes} label="Registered"        value={fmtDate(household?.registrationDate)} />
                                                <Field classes={classes} label="Last Updated"      value={fmtDate(household?.lastUpdated)} />
                                            </>
                                        ) : (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="textSecondary" style={{ paddingLeft: 4 }}>No primary grouping context provided in payload.</Typography>
                                            </Grid>
                                        )}

                                        {/* Members Table */}
                                        {memberList.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="caption" color="textSecondary"
                                                    style={{ display: "block", marginBottom: 6, fontWeight: 700, marginTop: 12 }}>
                                                    HOUSEHOLD MEMBERS ({memberList.length})
                                                </Typography>
                                                <TableContainer component={Paper} variant="outlined" style={{ borderRadius: 8 }}>
                                                    <Table size="small" className={classes.memberTable}>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>UIN</TableCell>
                                                                <TableCell>Name</TableCell>
                                                                <TableCell>Sex</TableCell>
                                                                <TableCell>Date of Birth</TableCell>
                                                                <TableCell>Age</TableCell>
                                                                <TableCell>Disability</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {memberList.map((m, i) => {
                                                                const dob = m.demographicInfo?.birthDate || m.demographic_info?.birth_date || m.birth_date;
                                                                const age = calculateAge(dob);
                                                                return (
                                                                    <TableRow key={i} hover>
                                                                        <TableCell style={{ fontFamily: "monospace" }}>
                                                                            {firstId(m.memberIdentifier || m.member_identifier)}
                                                                        </TableCell>
                                                                        <TableCell>{fullName(m.demographicInfo?.name || m.demographic_info?.name)}</TableCell>
                                                                        <TableCell>{fmt(m.demographicInfo?.sex || m.demographic_info?.sex)}</TableCell>
                                                                        <TableCell>{fmtDate(dob)}</TableCell>
                                                                        <TableCell>
                                                                            {age < 5 ? (
                                                                                <span style={{ fontWeight: 600, color: "#2e7d32" }}>{age} (Under 5)</span>
                                                                            ) : age === 999 ? "—" : age}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className={(m.selfIdDisability || m.self_id_disability) ? classes.boolYes : classes.boolNo}>
                                                                                {(m.selfIdDisability || m.self_id_disability) ? "Yes" : "No"}
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        )}

                                        {/* ══ 3. Economic Details ══════════════════════════ */}
                                        {economic && (
                                            <>
                                                <Grid item xs={12}><Divider /></Grid>
                                                <SectionHeader classes={classes} icon={HomeIcon} title="Economic Details" />

                                                <Field classes={classes} label="Income Level"    value={fmt(economic.incomeLevel || economic.income_level)} />
                                                <Field classes={classes} label="Housing Type"    value={fmt(economic.housingType || economic.housing_type)} />
                                                <Field classes={classes} label="Income Source(s)" value={(economic.incomeSource || []).join(", ") || "—"} />
                                                <Field classes={classes} label="Asset Ownership" value={(economic.assetOwnership || []).join(", ") || "—"} />
                                            </>
                                        )}
                                    </>
                                )}

                                {!record && !fetching && (
                                    <Grid item xs={12}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="textSecondary" style={{ fontSize: 14 }}>
                                                No target profile returned
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Use a valid systemic identity tag to test criteria mapping.
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}

                            </Grid>
                        )}
                    </DialogContent>

                    {/* ── Actions ── */}
                    <DialogActions style={{ padding: "12px 20px" }}>
                        <Button onClick={this.handleClose}>Close Verification Panel</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
}

const mapStateToProps = (state) => ({
    fetching: state.insuree.fetchingSR,
    data: state.insuree.srData,
});

const mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        { fetchSocialRegistryData, clearSocialRegistryData, journalize },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(
    withStyles(styles)(SocialRegistryVerification)
);