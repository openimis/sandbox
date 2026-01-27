import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Typography, CircularProgress,
    Divider, TextField, IconButton
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import SecurityIcon from "@material-ui/icons/Security";
import { PublishedComponent, journalize } from "@openimis/fe-core";
import { fetchCRVSEligibility, clearCRVSData, createPolicyDirect } from "../actions";

class FarmerRegistryVerification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            searchTerm: "",
            selectedProduct: null,
            selectedOfficer: null
        };
    }

    componentDidUpdate(prevProps) {
        const { submittingMutation, mutation, journalize } = this.props;
        if (prevProps.submittingMutation && !submittingMutation) {
            if (mutation && mutation.clientMutationId) {
                journalize(mutation);
            }
        }
    }

    handleOpen = () => {
        const initialId = this.props.identifier || "";
        this.setState({
            open: true,
            searchTerm: initialId,
            selectedProduct: null,
            selectedOfficer: null
        }, () => {
            if (initialId) this.props.fetchCRVSEligibility(initialId);
        });
    };

    handleClose = () => {
        this.setState({ open: false, searchTerm: "", selectedProduct: null, selectedOfficer: null });
        this.props.clearCRVSData();
    };

    handleSearchChange = (e) => {
        this.setState({ searchTerm: e.target.value });
    };

    handleManualSearch = () => {
        if (this.state.searchTerm) {
            this.props.fetchCRVSEligibility(this.state.searchTerm);
        }
    };

    handleEnrollment = () => {
        const { insuree } = this.props;
        const { selectedProduct, selectedOfficer } = this.state;

        if (!selectedProduct || !selectedOfficer) {
            alert("Please select both a Product and an Authorizing Officer.");
            return;
        }

        const policyData = {
            product: { id: { id: selectedProduct } },
            officer: { id: selectedOfficer },
            family: { id: insuree.family.id },
            value: 0.00,
        };

        this.props.createPolicyDirect(policyData, "Enrollment via openg2p interoperability");
        this.handleClose();
    };

    renderField = (label, value) => (
        <Grid item xs={12} sm={6} md={4} key={label}>
            <Typography variant="caption" color="textSecondary" style={{ display: 'block' }}>
                {label}
            </Typography>
            <Typography variant="body1" style={{ fontWeight: 600 }}>
                {value || "—"}
            </Typography>
        </Grid>
    );

    render() {
        const { open, searchTerm, selectedProduct, selectedOfficer } = this.state;
        const { fetching, data, submittingMutation } = this.props;
        const searchResponse = data?.searchResponse?.[0];
        const record = searchResponse?.regRecords?.[0];
        const farmerDetails = record?.famerPersonalDetails;
        const demographic = farmerDetails?.demographicInfo;
        const name = demographic?.name;

        return (
            <>
                <>
                    {this.props.submittingMutation ? (<CircularProgress />) :
                        (<Button
                            onClick={this.handleOpen}
                            style={{
                                marginLeft: 8,
                                padding: 0,
                                minWidth: "auto",
                                borderRadius: 8,
                                position: "relative"
                            }}
                        >
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd8pz4Z4bOrdpmFWxemPrbze99odbZjBchqQ&s"
                                alt="Registry"
                                style={{ height: 40 }}
                            />

                            <span
                                style={{
                                    position: "absolute",
                                    bottom: -4,
                                    right: -4,
                                    width: 20,
                                    height: 20
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: `
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="green"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M9 12l2 2l4-4"/>
                                            </svg>`
                                }}
                            />
                        </Button>)}
                </>


                <Dialog open={open} onClose={this.handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Grid container justify="space-between" alignItems="center">
                            <Grid item>Registry Data Verification</Grid>
                            <Grid item>
                                {/* RESTORED ORIGINAL SEARCH LAYOUT */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        label="Search ID"
                                        variant="outlined" size="small"
                                        value={searchTerm}
                                        onChange={this.handleSearchChange}
                                    />
                                    <IconButton color="primary" onClick={this.handleManualSearch}>
                                        <SearchIcon />
                                    </IconButton>
                                </div>
                            </Grid>
                        </Grid>
                    </DialogTitle>

                    <DialogContent dividers>
                        {fetching || submittingMutation ? (
                            <Grid container justify="center" style={{ padding: 40 }}>
                                <CircularProgress />
                                {submittingMutation && <Typography style={{ marginLeft: 20 }}>Processing Enrollment...</Typography>}
                            </Grid>
                        ) : record ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="subtitle2" color="primary">CRVS INFO</Typography></Grid>

                                {/* DISPLAY ALL FARMER DATA */}
                                {this.renderField("Transaction ID", data?.transactionId)}
                                {this.renderField("Correlation ID", data?.correlationId)}
                                {this.renderField("First Name", name?.firstName)}
                                {this.renderField("Last Name", name?.lastName)}
                                {this.renderField("UIN / ID", farmerDetails?.memberIdentifier?.identifierValue)}
                                {this.renderField("Birth Date", demographic?.dateOfBirth)}
                                {this.renderField("Gender", demographic?.gender)}
                                {this.renderField("Registration Date", record?.registrationDate)}

                                <Grid item xs={12}><Divider /></Grid>
                                <Grid item xs={12}><Typography variant="subtitle2" color="primary">POLICY ENROLLMENT</Typography></Grid>

                                <Grid item xs={6}>
                                    <Typography variant="caption">Select Product</Typography>
                                    <PublishedComponent
                                        pubRef="product.ProductPicker"
                                        value={selectedProduct}
                                        onChange={(v) => this.setState({ selectedProduct: v })}
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="caption">Select Authority (Officer)</Typography>
                                    <PublishedComponent
                                        pubRef="policy.PolicyOfficerPicker"
                                        value={selectedOfficer}
                                        onChange={(v) => this.setState({ selectedOfficer: v })}
                                    />
                                </Grid>
                            </Grid>
                        ) : <Typography align="center" style={{ padding: 20 }}>No farmer data found.</Typography>}
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={this.handleClose} color="primary">Close</Button>
                        {record && (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<SecurityIcon />}
                                onClick={this.handleEnrollment}
                                disabled={!selectedProduct || !selectedOfficer || submittingMutation}
                            >
                                {submittingMutation ? "Enrolling..." : "Enroll to Insurance"}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </>
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
    bindActionCreators({
        fetchCRVSEligibility,
        clearCRVSData,
        createPolicyDirect,
        journalize
    }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(FarmerRegistryVerification);