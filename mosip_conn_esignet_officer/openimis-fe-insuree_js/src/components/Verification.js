import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Typography, CircularProgress,
    Divider, TextField, IconButton, Box, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

// Icons
import SearchIcon from "@material-ui/icons/Search";
import SecurityIcon from "@material-ui/icons/Security";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import NatureIcon from "@material-ui/icons/Nature";
import HomeIcon from "@material-ui/icons/Home";
import AssessmentIcon from "@material-ui/icons/Assessment";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";

import { PublishedComponent, journalize } from "@openimis/fe-core";

// Combine actions from your Redux store
import { 
    fetchCRVSEligibility, 
    clearCRVSData, 
    createPolicyDirect,
    fetchSocialRegistryData, 
    clearSocialRegistryData 
} from "../actions";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = (theme) => ({
    sectionHeader: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.palette.primary.main,
        marginBottom: 8,
        marginTop: 16,
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
        wordBreak: "break-word",
    },
    fieldCard: {
        padding: "10px 14px",
        borderRadius: 8,
        background: theme.palette.action.hover,
        height: "100%",
    },
    farmAccordion: {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px !important",
        marginBottom: 8,
        "&:before": { display: "none" },
        boxShadow: "none",
    },
    cropBadge: {
        background: "#e8f5e9",
        color: "#2e7d32",
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
        marginRight: 4,
        marginBottom: 4,
    },
    animalBadge: {
        background: "#fff3e0",
        color: "#e65100",
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
        marginRight: 4,
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
        gap: 16,
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
    activityBox: {
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "12px 14px",
        marginTop: 8,
        width: "100%"
    },
    columnHeader: {
        backgroundColor: theme.palette.grey[100],
        padding: "12px",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: 700,
        color: theme.palette.text.primary,
        marginBottom: 16,
        border: `1px solid ${theme.palette.divider}`
    },
    panelColumn: {
        padding: "0 16px",
        height: "100%",
    },
    rightDivider: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
    boolYes: {
        background: "#e8f5e9", color: "#2e7d32", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block",
    },
    boolNo: {
        background: "#fff3e0", color: "#e65100", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block",
    },
    alertSuccess: {
        backgroundColor: "#e8f5e9", color: "#1b5e20", padding: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #c8e6c9", marginBottom: "16px"
    },
    alertError: {
        backgroundColor: "#ffebee", color: "#b71c1c", padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px", border: "1px solid #ffcdd2", marginBottom: "16px"
    },
    metricRow: {
        display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", background: "#fff", border: `1px solid ${theme.palette.divider}`, marginBottom: "6px"
    },
    disabledOverlay: {
        opacity: 0.5,
        pointerEvents: "none",
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fullName = (name) => {
    if (!name) return "—";
    return [name.prefix, name.givenName, name.secondName, name.surname, name.suffix]
        .filter(Boolean).join(" ") || "—";
};

const firstId = (list) => Array.isArray(list) && list.length > 0 ? list[0].identifierValue || list[0].identifier_value : "—";
const fmt = (v) => (v != null && v !== "" ? String(v) : "—");
const fmtDate = (v) => (v ? v.split("T")[0] : "—");
const fmtScore = (v) => (v != null ? `${(v * 100).toFixed(0)}%` : "—");

const calculateAge = (dobString) => {
    if (!dobString) return 999;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Field = ({ classes, label, value }) => (
    <Grid item xs={12} sm={6}>
        <div className={classes.fieldCard}>
            <div className={classes.fieldLabel}>{label}</div>
            <div className={classes.fieldValue}>{value || "—"}</div>
        </div>
    </Grid>
);

const SectionHeader = ({ classes, icon: Icon, title, color }) => (
    <Grid item xs={12}>
        <div className={classes.sectionHeader} style={color ? { color } : {}}>
            {Icon && <Icon style={{ fontSize: 16 }} />}
            {title}
        </div>
    </Grid>
);

// ── Main Component ────────────────────────────────────────────────────────────
class UnifiedRegistryVerification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            searchTerm: "",
            selectedProduct: null,
            selectedOfficer: null,
        };
    }

    componentDidUpdate(prevProps) {
        const { submittingMutation, mutation, journalize } = this.props;
        if (prevProps.submittingMutation && !submittingMutation) {
            if (mutation?.clientMutationId) journalize(mutation);
        }
    }

    handleOpen = () => {
        const initial = this.props.identifier || "";
        this.setState(
            { open: true, searchTerm: initial, selectedProduct: null, selectedOfficer: null },
            () => { 
                if (initial) {
                    this.props.fetchCRVSEligibility(initial);
                    this.props.fetchSocialRegistryData(initial);
                } 
            }
        );
    };

    handleClose = () => {
        this.setState({ open: false, searchTerm: "", selectedProduct: null, selectedOfficer: null });
        this.props.clearCRVSData();
        this.props.clearSocialRegistryData();
    };

    handleManualSearch = () => {
        if (this.state.searchTerm) {
            this.props.fetchCRVSEligibility(this.state.searchTerm);
            this.props.fetchSocialRegistryData(this.state.searchTerm);
        }
    };

    handleKeyDown = (e) => { if (e.key === "Enter") this.handleManualSearch(); };

    handleEnrollment = () => {
        const { insuree, crvsData, createPolicyDirect } = this.props;
        const { selectedProduct, selectedOfficer } = this.state;
        const record = crvsData?.searchResponse?.[0]?.regRecords?.[0];

        if (!selectedProduct || !selectedOfficer) {
            alert("Please select both a Product and an Authorizing Officer.");
            return;
        }

        const uin = firstId(record?.farmerPersonalDetails?.memberIdentifier);
        createPolicyDirect(
            {
                product: { id: { id: selectedProduct } },
                officer: { id: selectedOfficer },
                family: { id: insuree?.family?.id },
                value: 0.0,
            },
            `Program added from eligibility from OpenG2P`
        );
        this.handleClose();
    };

    // Extracts and evaluates SR Eligibility from Redux state
    getSREligibility = () => {
        const { srData } = this.props;
        const searchResponse = srData?.searchResponse?.[0];
        const record = searchResponse?.regRecords?.[0] || searchResponse?.data?.reg_records?.[0];
        
        const household = record?.householdDetails;
        const economic = record?.economicDetails || record;
        const memberList = household?.memberList || record?.related_person || [];

        const hasRecord = !!record;
        const rawIncome = economic?.incomeLevel || economic?.income_level;
        const isPoor = hasRecord && String(rawIncome).toLowerCase() === "low";
        
        const childrenUnder5 = hasRecord ? memberList.filter(m => {
            const dob = m.demographicInfo?.birthDate || m.demographic_info?.birth_date || m.birth_date;
            return calculateAge(dob) < 5;
        }) : [];
        const hasFourChildrenUnder5 = childrenUnder5.length >= 0;

        const isEligible = hasRecord && isPoor && hasFourChildrenUnder5;

        return {
            searchResponse,
            record,
            household,
            economic,
            memberList,
            hasRecord,
            rawIncome,
            isPoor,
            childrenUnder5,
            hasFourChildrenUnder5,
            isEligible
        };
    };

    renderFarmerRegistryPanel = (isSREligible) => {
        const { fetchingCRVS, crvsData, classes } = this.props;
        const { selectedProduct, selectedOfficer } = this.state;

        if (fetchingCRVS) {
            return (
                <Box textAlign="center" py={6}>
                    <CircularProgress />
                    <Typography style={{ marginTop: 12 }} color="textSecondary">Fetching Farmer Registry...</Typography>
                </Box>
            );
        }

        const searchResponse = crvsData?.searchResponse?.[0];
        const record = searchResponse?.regRecords?.[0];
        if (!record) {
            return (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="textSecondary" style={{ fontSize: 14 }}>No Farmer Records Found</Typography>
                </Box>
            );
        }

        const pd = record.farmerPersonalDetails;
        const demo = pd?.demographicInfo;
        const family = record.familyDetails;
        const farms = record.farmDetails || [];
        const pagination = searchResponse?.pagination;

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <div className={classes.txnBar}>
                        <div className={classes.txnItem}>
                            <span className={classes.txnLabel}>Status</span>
                            <span className={classes.txnValue}>{searchResponse?.status === "succ" ? "✓ Verified" : fmt(searchResponse?.status)}</span>
                        </div>
                        <div className={classes.txnItem}>
                            <span className={classes.txnLabel}>Results</span>
                            <span className={classes.txnValue}>{pagination?.totalCount ?? "—"} record(s)</span>
                        </div>
                    </div>
                </Grid>

                <SectionHeader classes={classes} icon={PersonIcon} title="Farmer Details" />
                <Field classes={classes} label="Full Name" value={fullName(demo?.name)} />
                <Field classes={classes} label="UIN" value={firstId(pd?.memberIdentifier)} />
                <Field classes={classes} label="Sex" value={fmt(demo?.sex)} />
                <Field classes={classes} label="Date of Birth" value={fmtDate(demo?.birthDate)} />

                <SectionHeader classes={classes} icon={GroupIcon} title="Family / Household" />
                <Field classes={classes} label="Household ID" value={firstId(family?.groupIdentifier)} />
                <Field classes={classes} label="Group Size" value={fmt(family?.groupSize)} />
                
                <SectionHeader classes={classes} icon={NatureIcon} title={`Farms (${farms.length})`} />
                {farms.map((farm, fi) => (
                    <Grid item xs={12} key={fi}>
                        <Accordion className={classes.farmAccordion} defaultExpanded={fi === 0}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography style={{ fontWeight: 600, fontSize: 13 }}>
                                    Farm {fi + 1} · {farm.place?.name || "Unknown Location"}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Field classes={classes} label="Land Tenure" value={fmt(farm.landTenure)} />
                                    <Field classes={classes} label="Land Size" value={farm.landSize != null ? `${farm.landSize} ${farm.measurement || ""}` : "—"} />
                                    
                                    {(farm.farmingActivities || []).map((act, ai) => (
                                        <div key={ai} className={classes.activityBox}>
                                            <Typography variant="caption" style={{ fontWeight: 700, display:"block", marginBottom:8 }}>ACTIVITY GROUP {ai + 1}</Typography>
                                            {act.cropProduction?.length > 0 && (
                                                <Box mb={1}>
                                                    {act.cropProduction.map((c, ci) => (
                                                        <span key={ci} className={classes.cropBadge}>{c.cropType} {c.season ? `(${c.season})` : ""}</span>
                                                    ))}
                                                </Box>
                                            )}
                                            {act.animalProduction?.length > 0 && (
                                                <Box>
                                                    {act.animalProduction.map((a, ai2) => (
                                                        <span key={ai2} className={classes.animalBadge}>{a.type} ({a.count})</span>
                                                    ))}
                                                </Box>
                                            )}
                                        </div>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                ))}

                <Grid item xs={12}><Divider style={{ margin: "16px 0" }} /></Grid>

                <SectionHeader classes={classes} icon={SecurityIcon} title="Insurance Enrollment" color={isSREligible ? "#c62828" : "#9e9e9e"} />
                
                {!isSREligible && (
                    <Grid item xs={12}>
                        <Typography variant="body2" style={{ color: "#c62828", fontWeight: 600, marginBottom: 8 }}>
                            Enrollment disabled: Insuree does not meet Social Registry eligibility criteria.
                        </Typography>
                    </Grid>
                )}

                <Grid item xs={12} className={!isSREligible ? classes.disabledOverlay : ""}>
                    <Typography variant="caption" color="textSecondary">Program</Typography>
                    <PublishedComponent
                        pubRef="product.ProductPicker"
                        value={selectedProduct}
                        onChange={(v) => this.setState({ selectedProduct: v })}
                        disabled={!isSREligible}
                    />
                </Grid>
                <Grid item xs={12} className={!isSREligible ? classes.disabledOverlay : ""}>
                    <Typography variant="caption" color="textSecondary">Authorizing Officer</Typography>
                    <PublishedComponent
                        pubRef="policy.PolicyOfficerPicker"
                        value={selectedOfficer}
                        onChange={(v) => this.setState({ selectedOfficer: v })}
                        disabled={!isSREligible}
                    />
                </Grid>
            </Grid>
        );
    };

    renderSocialRegistryPanel = (srEligibility) => {
        const { fetchingSR, classes } = this.props;

        if (fetchingSR) {
            return (
                <Box textAlign="center" py={6}>
                    <CircularProgress />
                    <Typography style={{ marginTop: 12 }} color="textSecondary">Fetching Social Registry...</Typography>
                </Box>
            );
        }

        const { 
            searchResponse, record, household, economic, memberList,
            hasRecord, rawIncome, isPoor, childrenUnder5, hasFourChildrenUnder5, isEligible 
        } = srEligibility;
        
        if (!record) {
            return (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="textSecondary" style={{ fontSize: 14 }}>No Social Registry Profile</Typography>
                </Box>
            );
        }

        const pd = record.personalDetails || record;
        const demo = pd?.demographicInfo || pd?.demographic_info;

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <div className={classes.txnBar} style={{ backgroundColor: "#0288d1" }}>
                        <div className={classes.txnItem}>
                            <span className={classes.txnLabel}>Status</span>
                            <span className={classes.txnValue}>{searchResponse?.status === "succ" ? "✓ Verified" : fmt(searchResponse?.status)}</span>
                        </div>
                        <div className={classes.txnItem}>
                            <span className={classes.txnLabel}>Poverty Score</span>
                            <span className={classes.txnValue}>{fmtScore(household?.povertyScore)}</span>
                        </div>
                    </div>
                </Grid>

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
                        <Typography variant="body2" style={{ fontWeight: 500, color: hasRecord ? "#1b5e20" : "#b71c1c", fontSize: 12 }}>
                            Record Found: {hasRecord ? "Social Registry validation success." : "No identity record found inside the queried target."}
                        </Typography>
                    </div>

                    <div className={classes.metricRow}>
                        {isPoor ? <CheckIcon style={{ color: "#2e7d32" }} /> : <CloseIcon style={{ color: "#c62828" }} />}
                        <Typography variant="body2" style={{ fontWeight: 500, color: isPoor ? "#1b5e20" : "#b71c1c", fontSize: 12 }}>
                            Poverty Status: {isPoor ? "Confirmed via SR Standard (Income Level: Low)" : `Rejected (Current Level: '${rawIncome || "Unknown"}', Must be 'Low')`}
                        </Typography>
                    </div>

                    {/* <div className={classes.metricRow}>
                        {hasFourChildrenUnder5 ? <CheckIcon style={{ color: "#2e7d32" }} /> : <CloseIcon style={{ color: "#c62828" }} />}
                        <Typography variant="body2" style={{ fontWeight: 500, color: hasFourChildrenUnder5 ? "#1b5e20" : "#b71c1c", fontSize: 12 }}>
                            Dependent Metric: {hasFourChildrenUnder5 ? `Passed (Found ${childrenUnder5.length} children under 5)` : `Failed (Requires minimum 4 children under 5. Found: ${childrenUnder5.length})`}
                        </Typography>
                    </div> */}
                </Grid>

                <SectionHeader classes={classes} icon={PersonIcon} title="Individual Details" />
                <Field classes={classes} label="Full Name" value={fullName(demo?.name)} />
                <Field classes={classes} label="UIN" value={firstId(pd?.memberIdentifier || pd?.member_identifier)} />
                
                <SectionHeader classes={classes} icon={GroupIcon} title={`Household Members (${memberList.length})`} />
                {memberList.length > 0 && (
                    <Grid item xs={12}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small" className={classes.memberTable}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Age</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {memberList.map((m, i) => {
                                        const dob = m.demographicInfo?.birthDate || m.demographic_info?.birth_date || m.birth_date;
                                        const age = calculateAge(dob);
                                        return (
                                            <TableRow key={i}>
                                                <TableCell>{fullName(m.demographicInfo?.name || m.demographic_info?.name)}</TableCell>
                                                <TableCell>
                                                    {age < 5 ? <span style={{ fontWeight: 600, color: "#2e7d32" }}>{age} (Under 5)</span> : age === 999 ? "—" : age}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}

                {economic && (
                    <>
                        <SectionHeader classes={classes} icon={HomeIcon} title="Economic Profile" />
                        <Field classes={classes} label="Housing Type" value={fmt(economic.housingType || economic.housing_type)} />
                        <Field classes={classes} label="Income Source" value={(economic.incomeSource || []).join(", ") || "—"} />
                    </>
                )}
            </Grid>
        );
    };

    render() {
        const { open, searchTerm, selectedProduct, selectedOfficer } = this.state;
        const { submittingMutation, classes, crvsData, disabled } = this.props;
        
        const hasFarmerRecord = !!crvsData?.searchResponse?.[0]?.regRecords?.[0];
        
        // Evaluate overall Social Registry Eligibility
        const srEligibility = this.getSREligibility();
        const { isEligible: isSREligible } = srEligibility;

        return (
            <Box display="inline-block">
                {submittingMutation ? (
                    <CircularProgress size={24} />
                ) : (
                    <Button 
                        onClick={this.handleOpen} 
                        style={{ padding: 0, minWidth: "auto", borderRadius: 8 }}
                        disabled={disabled} 
                    >
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd8pz4Z4bOrdpmFWxemPrbze99odbZjBchqQ&s"
                            alt="Registry Verification"
                            style={{ 
                                height: 40, 
                                opacity: disabled ? 0.5 : 1, 
                                cursor: disabled ? "default" : "pointer",
                                borderRadius: 4
                            }}
                        />
                    </Button>
                )}

                <Dialog open={open} onClose={this.handleClose} maxWidth="lg" fullWidth>
                    <DialogTitle disableTypography className={classes.dialogTitle}>
                        <Grid container justify="space-between" alignItems="center">
                            <Grid item>
                                <Typography variant="h6" style={{ fontWeight: 600, fontSize: 18 }}>
                                    Unified Registry Verification
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Simultaneous OpenG2P Sync (Farmer & Social Registries)
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
                                        style={{ width: 250 }}
                                    />
                                    <IconButton color="primary" onClick={this.handleManualSearch} size="small">
                                        <SearchIcon />
                                    </IconButton>
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogTitle>

                    <DialogContent dividers style={{ padding: 0 }}>
                        <Grid container style={{ height: "100%" }}>
                            
                            {/* Left Column: Farmer Registry */}
                            <Grid item xs={12} md={6} className={`${classes.panelColumn} ${classes.rightDivider}`} style={{ paddingTop: 16, paddingBottom: 16 }}>
                                <div className={classes.columnHeader}>Farmer Registry (CRVS)</div>
                                {this.renderFarmerRegistryPanel(isSREligible)}
                            </Grid>
                            
                            {/* Right Column: Social Registry */}
                            <Grid item xs={12} md={6} className={classes.panelColumn} style={{ paddingTop: 16, paddingBottom: 16 }}>
                                <div className={classes.columnHeader}>Social Registry (SR)</div>
                                {this.renderSocialRegistryPanel(srEligibility)}
                            </Grid>

                        </Grid>
                    </DialogContent>

                    <DialogActions style={{ padding: "16px 24px" }}>
                        <Button onClick={this.handleClose} color="default" style={{ fontWeight: 600 }}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={submittingMutation ? <CircularProgress size={14} color="inherit" /> : <SecurityIcon />}
                            onClick={this.handleEnrollment}
                            // Button is disabled if: No Product, No Officer, Submitting, No CRVS Record, OR user failed SR Eligibility.
                            disabled={!selectedProduct || !selectedOfficer || submittingMutation || !hasFarmerRecord || !isSREligible}
                        >
                            {submittingMutation ? "Processing…" : "Confirm & Enroll to Policy"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
}

const mapStateToProps = (state) => ({
    // CRVS (Farmer) State
    fetchingCRVS: state.insuree.fetchingCRVS,
    crvsData: state.insuree.crvsData,
    // Social Registry State
    fetchingSR: state.insuree.fetchingSR,
    srData: state.insuree.srData,
    
    // Policy / Generic State
    insuree: state.insuree.insuree,
    submittingMutation: state.policy.submittingMutation,
    mutation: state.policy.mutation,
});

const mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        { 
            fetchCRVSEligibility, 
            clearCRVSData, 
            fetchSocialRegistryData, 
            clearSocialRegistryData,
            createPolicyDirect, 
            journalize 
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(
    withStyles(styles)(UnifiedRegistryVerification)
);