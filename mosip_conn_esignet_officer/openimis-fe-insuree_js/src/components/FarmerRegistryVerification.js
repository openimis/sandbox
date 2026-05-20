import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Typography, CircularProgress,
    Divider, TextField, IconButton, Box, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import SecurityIcon from "@material-ui/icons/Security";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import NatureIcon from "@material-ui/icons/Nature";
import { PublishedComponent, journalize } from "@openimis/fe-core";
import { fetchCRVSEligibility, clearCRVSData, createPolicyDirect } from "../actions";

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
    activityBox: {
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "12px 14px",
        marginTop: 8,
    },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fullName = (name) => {
    if (!name) return "—";
    return [name.prefix, name.givenName, name.secondName, name.surname, name.suffix]
        .filter(Boolean).join(" ") || "—";
};

const firstId = (list) =>
    Array.isArray(list) && list.length > 0 ? list[0].identifierValue : "—";

const fmt     = (v) => (v != null && v !== "" ? String(v) : "—");
const fmtDate = (v) => (v ? v.split("T")[0] : "—");
const fmtBool = (v) => (v === true ? "Yes" : v === false ? "No" : "—");
const fmtScore = (v) => (v != null ? `${(v * 100).toFixed(0)}%` : "—");

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
class FarmerRegistryVerification extends Component {
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
            () => { if (initial) this.props.fetchCRVSEligibility(initial); }
        );
    };

    handleClose = () => {
        this.setState({ open: false, searchTerm: "", selectedProduct: null, selectedOfficer: null });
        this.props.clearCRVSData();
    };

    handleManualSearch = () => {
        if (this.state.searchTerm) this.props.fetchCRVSEligibility(this.state.searchTerm);
    };

    handleKeyDown = (e) => { if (e.key === "Enter") this.handleManualSearch(); };

    handleEnrollment = () => {
        const { insuree, data } = this.props;
        const { selectedProduct, selectedOfficer } = this.state;
        const record = data?.searchResponse?.[0]?.regRecords?.[0];

        if (!selectedProduct || !selectedOfficer) {
            alert("Please select both a Product and an Authorizing Officer.");
            return;
        }

        const uin = firstId(record?.farmerPersonalDetails?.memberIdentifier);
        this.props.createPolicyDirect(
            {
                product: { id: { id: selectedProduct } },
                officer: { id: selectedOfficer },
                family: { id: insuree.family.id },
                value: 0.0,
            },
            `Enrollment via OpenG2P for UIN: ${uin}`
        );
        this.handleClose();
    };

    render() {
        const { open, searchTerm, selectedProduct, selectedOfficer } = this.state;
        const { fetching, data, submittingMutation, classes } = this.props;

        // ── Data Navigation ──────────────────────────────────────────────────
        const searchResponse = data?.searchResponse?.[0];
        const record         = searchResponse?.regRecords?.[0];
        const pd             = record?.farmerPersonalDetails;   // ✅ correct field name
        const demo           = pd?.demographicInfo;
        const name           = demo?.name;
        const family         = record?.familyDetails;
        const farms          = record?.farmDetails || [];
        const pagination     = searchResponse?.pagination;

        return (
            <Box display="inline-block">
                {submittingMutation ? (
                    <CircularProgress size={24} />
                ) : (
                    <Button onClick={this.handleOpen} style={{ padding: 0, minWidth: "auto" }}>
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd8pz4Z4bOrdpmFWxemPrbze99odbZjBchqQ&s"
                            alt="Registry"
                            style={{ height: 40 }}
                        />
                    </Button>
                )}

                <Dialog open={open} onClose={this.handleClose} maxWidth="md" fullWidth>

                    {/* ── Title ── */}
                    <DialogTitle disableTypography className={classes.dialogTitle}>
                        <Grid container justify="space-between" alignItems="center">
                            <Grid item>
                                <Typography variant="h6" style={{ fontWeight: 600, fontSize: 16 }}>
                                    Farmer Registry Verification
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
                                    Fetching registry data…
                                </Typography>
                            </Box>
                        ) : record ? (
                            <Grid container spacing={2}>

                                {/* ══ Transaction Bar ══════════════════════════════ */}
                                <Grid item xs={12}>
                                    <div className={classes.txnBar}>
                                        <div className={classes.txnItem}>
                                            <span className={classes.txnLabel}>Transaction ID</span>
                                            <span className={classes.txnValue}>{fmt(data?.transactionId)}</span>
                                        </div>
                                        <div className={classes.txnItem}>
                                            <span className={classes.txnLabel}>Correlation ID</span>
                                            <span className={classes.txnValue}>{fmt(data?.correlationId)}</span>
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
                                                {pagination?.totalCount ?? "—"} record(s)
                                            </span>
                                        </div>
                                    </div>
                                </Grid>

                                {/* ══ 1. Personal Details ══════════════════════════ */}
                                <SectionHeader classes={classes} icon={PersonIcon} title="Farmer Personal Details" />

                                <Field classes={classes} label="Full Name"         value={fullName(name)} />
                                <Field classes={classes} label="UIN"               value={firstId(pd?.memberIdentifier)} />
                                <Field classes={classes} label="ID Type"           value={fmt(pd?.memberIdentifier?.[0]?.identifierType)} />
                                <Field classes={classes} label="Sex"               value={fmt(demo?.sex)} />
                                <Field classes={classes} label="Date of Birth"     value={fmtDate(demo?.birthDate)} />
                                <Field classes={classes} label="Marital Status"    value={fmt(pd?.maritalStatus)} />
                                <Field classes={classes} label="Education Level"   value={fmt(pd?.educationLevel)} />
                                <Field classes={classes} label="Language(s)"       value={(pd?.languageCode || []).join(", ") || "—"} />
                                <Field classes={classes} label="Disability"        value={fmtBool(pd?.selfIdDisability)} />
                                <Field classes={classes} label="Registered"        value={fmtDate(pd?.registrationDate)} />
                                <Field classes={classes} label="Last Updated"      value={fmtDate(pd?.lastUpdated)} />

                                <Grid item xs={12}><Divider /></Grid>

                                {/* ══ 2. Family Details ════════════════════════════ */}
                                <SectionHeader classes={classes} icon={GroupIcon} title="Family / Household Details" />

                                <Field classes={classes} label="Household ID"      value={firstId(family?.groupIdentifier)} />
                                <Field classes={classes} label="Group Type"        value={fmt(family?.groupType)} />
                                <Field classes={classes} label="Location"          value={fmt(family?.place?.name)} />
                                <Field classes={classes} label="Group Size"        value={fmt(family?.groupSize)} />
                                <Field classes={classes} label="Poverty Score"     value={fmtScore(family?.povertyScore)} />
                                <Field classes={classes} label="Score Type"        value={fmt(family?.povertyScoreType)} />
                                <Field classes={classes} label="Family Registered" value={fmtDate(family?.registrationDate)} />
                                <Field classes={classes} label="Family Updated"    value={fmtDate(family?.lastUpdated)} />
                                {family?.place?.geo && (
                                    <Field classes={classes} label="Coordinates (lat, lng)"
                                        value={`${family.place.geo.latitude?.toFixed(4)}, ${family.place.geo.longitude?.toFixed(4)}`} />
                                )}

                                {/* Members Table */}
                                {family?.memberList?.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="textSecondary"
                                            style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                                            HOUSEHOLD MEMBERS ({family.memberList.length})
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined" style={{ borderRadius: 8 }}>
                                            <Table size="small" className={classes.memberTable}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>UIN</TableCell>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Sex</TableCell>
                                                        <TableCell>Date of Birth</TableCell>
                                                        <TableCell>Marital</TableCell>
                                                        <TableCell>Disability</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {family.memberList.map((m, i) => (
                                                        <TableRow key={i} hover>
                                                            <TableCell style={{ fontFamily: "monospace" }}>
                                                                {firstId(m.memberIdentifier)}
                                                            </TableCell>
                                                            <TableCell>{fullName(m.demographicInfo?.name)}</TableCell>
                                                            <TableCell>{fmt(m.demographicInfo?.sex)}</TableCell>
                                                            <TableCell>{fmtDate(m.demographicInfo?.birthDate)}</TableCell>
                                                            <TableCell>{fmt(m.maritalStatus)}</TableCell>
                                                            <TableCell>{fmtBool(m.selfIdDisability)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                )}

                                <Grid item xs={12}><Divider /></Grid>

                                {/* ══ 3. Farm Details ══════════════════════════════ */}
                                <SectionHeader classes={classes} icon={NatureIcon}
                                    title={`Farm Details (${farms.length} farm${farms.length !== 1 ? "s" : ""})`} />

                                {farms.map((farm, fi) => (
                                    <Grid item xs={12} key={fi}>
                                        <Accordion className={classes.farmAccordion} defaultExpanded={fi === 0}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Box display="flex" alignItems="center" style={{ gap: 10, flexWrap: "wrap" }}>
                                                    <Typography style={{ fontWeight: 600, fontSize: 13 }}>
                                                        Farm {fi + 1} · {farm.place?.name || "Unknown Location"}
                                                    </Typography>
                                                    {farm.landSize != null && (
                                                        <Chip size="small"
                                                            label={`${farm.landSize} ${farm.measurement || ""}`}
                                                            style={{ fontSize: 11, height: 20 }} />
                                                    )}
                                                    {farm.landTenure && (
                                                        <Chip size="small" label={farm.landTenure}
                                                            style={{ fontSize: 11, height: 20, background: "#e3f2fd", color: "#1565c0" }} />
                                                    )}
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Grid container spacing={2}>
                                                    <Field classes={classes} label="Location"    value={fmt(farm.place?.name)} />
                                                    <Field classes={classes} label="Land Tenure" value={fmt(farm.landTenure)} />
                                                    <Field classes={classes} label="Land Size"
                                                        value={farm.landSize != null ? `${farm.landSize} ${farm.measurement || ""}` : "—"} />
                                                    {farm.place?.geo && (
                                                        <Field classes={classes} label="Coordinates"
                                                            value={`${farm.place.geo.latitude?.toFixed(4)}, ${farm.place.geo.longitude?.toFixed(4)}`} />
                                                    )}

                                                    {(farm.farmingActivities || []).map((act, ai) => (
                                                        <Grid item xs={12} key={ai}>
                                                            <div className={classes.activityBox}>
                                                                <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 10 }}>
                                                                    <Typography variant="caption"
                                                                        style={{ fontWeight: 700, fontSize: 11, color: "#555" }}>
                                                                        ACTIVITY GROUP {ai + 1}
                                                                    </Typography>
                                                                    {act.mixedFarming && (
                                                                        <Chip size="small" label="Mixed Farming"
                                                                            style={{ fontSize: 10, height: 18, background: "#f3e5f5", color: "#6a1b9a" }} />
                                                                    )}
                                                                </Box>

                                                                {act.cropProduction?.length > 0 && (
                                                                    <Box mb={1.5}>
                                                                        <Typography variant="caption"
                                                                            style={{ fontWeight: 700, fontSize: 11, color: "#2e7d32", display: "block", marginBottom: 4 }}>
                                                                            CROPS
                                                                        </Typography>
                                                                        {act.cropProduction.map((c, ci) => (
                                                                            <Box key={ci} display="flex" flexWrap="wrap"
                                                                                alignItems="center" style={{ gap: 6, marginBottom: 4 }}>
                                                                                <span className={classes.cropBadge}>{c.cropType}</span>
                                                                                {c.season && <Typography variant="caption">Season: {c.season}</Typography>}
                                                                                {c.irrigation && <Typography variant="caption" style={{ color: "#1565c0" }}>Irrigated</Typography>}
                                                                                {(c.irrigationWater || []).map((w, wi) =>
                                                                                    <Typography key={wi} variant="caption" color="textSecondary">{w}</Typography>
                                                                                )}
                                                                                {(c.endUse || []).map((eu, ei) =>
                                                                                    <Chip key={ei} size="small" label={eu}
                                                                                        style={{ fontSize: 10, height: 18 }} />
                                                                                )}
                                                                            </Box>
                                                                        ))}
                                                                    </Box>
                                                                )}

                                                                {act.animalProduction?.length > 0 && (
                                                                    <Box mb={1.5}>
                                                                        <Typography variant="caption"
                                                                            style={{ fontWeight: 700, fontSize: 11, color: "#e65100", display: "block", marginBottom: 4 }}>
                                                                            LIVESTOCK
                                                                        </Typography>
                                                                        {act.animalProduction.map((a, ai2) => (
                                                                            <Box key={ai2} display="flex" alignItems="center" style={{ gap: 8 }}>
                                                                                <span className={classes.animalBadge}>{a.type}</span>
                                                                                <Typography variant="caption">
                                                                                    Count: {a.count} · {a.livestockSystem}
                                                                                </Typography>
                                                                            </Box>
                                                                        ))}
                                                                    </Box>
                                                                )}

                                                                {act.agriSupportActivities?.length > 0 && (
                                                                    <Box>
                                                                        <Typography variant="caption"
                                                                            style={{ fontWeight: 700, fontSize: 11, color: "#555", display: "block", marginBottom: 4 }}>
                                                                            SUPPORT ACTIVITIES
                                                                        </Typography>
                                                                        {act.agriSupportActivities.map((s, si) => (
                                                                            <Chip key={si} size="small" label={s}
                                                                                style={{ fontSize: 10, height: 18, marginRight: 4, marginTop: 2 }} />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </div>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                ))}

                                <Grid item xs={12}><Divider /></Grid>

                                {/* ══ 4. Enrollment ════════════════════════════════ */}
                                <SectionHeader classes={classes} icon={SecurityIcon}
                                    title="Insurance Enrollment" color="#c62828" />

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Product</Typography>
                                    <PublishedComponent
                                        pubRef="product.ProductPicker"
                                        value={selectedProduct}
                                        onChange={(v) => this.setState({ selectedProduct: v })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Authorizing Officer</Typography>
                                    <PublishedComponent
                                        pubRef="policy.PolicyOfficerPicker"
                                        value={selectedOfficer}
                                        onChange={(v) => this.setState({ selectedOfficer: v })}
                                    />
                                </Grid>

                            </Grid>
                        ) : (
                            <Box textAlign="center" py={8}>
                                <Typography variant="h6" color="textSecondary" style={{ fontSize: 14 }}>
                                    No records found
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Enter a UIN or identifier above and search
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>

                    {/* ── Actions ── */}
                    <DialogActions style={{ padding: "12px 20px" }}>
                        <Button onClick={this.handleClose}>Cancel</Button>
                        {record && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={
                                    submittingMutation
                                        ? <CircularProgress size={14} color="inherit" />
                                        : <SecurityIcon />
                                }
                                onClick={this.handleEnrollment}
                                disabled={!selectedProduct || !selectedOfficer || submittingMutation}
                            >
                                {submittingMutation ? "Processing…" : "Enroll to Policy"}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
}

const mapStateToProps = (state) => ({
    fetching: state.insuree.fetchingCRVS,
    data: state.insuree.crvsData,
    insuree: state.insuree.insuree,
    submittingMutation: state.policy.submittingMutation,
    mutation: state.policy.mutation,
});

const mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        { fetchCRVSEligibility, clearCRVSData, createPolicyDirect, journalize },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(
    withStyles(styles)(FarmerRegistryVerification)
);
