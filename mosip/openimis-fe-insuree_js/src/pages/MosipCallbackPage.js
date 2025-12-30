import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@material-ui/core';
import {
  CheckCircleOutline,
  HighlightOff,
  Sync as SyncIcon,
  Close as CloseIcon,
  Cake,
  Wc,
  Home,
  Phone,
  Email,
  Work,
  Favorite,
  Fingerprint,
  VerifiedUser,
} from '@material-ui/icons';
import {
  withModulesManager,
  withHistory,
  clearCurrentPaginationPage,
  formatMessageWithValues,
} from '@openimis/fe-core';
import { fetchPublicInsureeByUuid, updatePublicInsuree, fetchInsureeMutation } from '../actions';
import { populateInsureeFromAuthCode } from '../utils/mosipAuth.utils';

/* ----------------------------- Styles ----------------------------- */
const styles = (theme) => ({
  page: {
    ...theme.page,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    background: theme.palette.background.default,
  },
  card: {
    width: 'min(700px, 95vw)',
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    boxShadow: theme.shadows[4],
  },
  cardHeader: {
    padding: theme.spacing(2, 3),
  },
  cardContent: {
    padding: theme.spacing(3),
    textAlign: 'center',
  },
  statusTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  cardActions: {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'center',
  },
  stepOk: { color: theme.palette.success.main },
  stepErr: { color: theme.palette.error.main },
  stepRun: { color: theme.palette.info.main },
  logoBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  logoImg: {
    height: 48,
    width: 'auto',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
    objectFit: 'contain',
  },
  logoText: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  flowWrap: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr auto 1fr',
    gap: theme.spacing(2.5),
  },
  flowTrack: {
    position: 'relative',
    height: 8,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.grey[theme.palette.type === 'dark' ? 700 : 200],
    overflow: 'hidden',
    transition: 'background-color 0.3s ease-in-out',
  },
  flowStream: {
    position: 'absolute',
    inset: 0,
    transform: 'translateX(-100%)',
    animation: '$flow 1.2s linear infinite',
  },
  flowArrow: {
    position: 'absolute',
    right: -2,
    top: '50%',
    width: 0,
    height: 0,
    transform: 'translateY(-50%)',
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.2))',
    transition: 'border-left-color 0.3s ease-in-out',
  },
  '@keyframes flow': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  idCard: {
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
  },
  idCardHeader: {
    textAlign: 'center',
    marginBottom: theme.spacing(2),
  },
  idCardAvatar: {
    width: theme.spacing(20),
    height: theme.spacing(20),
    margin: '0 auto',
    border: `3px solid ${theme.palette.primary.main}`,
  },
  idCardName: {
    marginTop: theme.spacing(1.5),
    fontWeight: 'bold',
  },
  idCardChfId: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  idCardDetailRow: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
  },
  idCardDetailIcon: {
    marginRight: theme.spacing(2),
    color: theme.palette.primary.main,
    minWidth: 'auto',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

/* ------------------------ Helper Components -------------------------- */
const FlowBanner = ({ classes, color, isCompleted }) => (
  <div className={classes.flowWrap} aria-label="Data flowing from MOSIP to openIMIS">
    <div className={classes.logoBlock}>
      <img className={classes.logoImg} src="https://avatars.githubusercontent.com/u/39733477?s=200&v=4" alt="MOSIP" />
      <div className={classes.logoText}>MOSIP</div>
    </div>
    <div className={classes.flowTrack} style={{ background: isCompleted ? color : undefined }}>
      {!isCompleted && (
        <div
          className={classes.flowStream}
          style={{
            background: `linear-gradient(90deg, transparent, ${hexToRgba(color, 0.4)}, transparent)`,
          }}
        />
      )}
      <div className={classes.flowArrow} style={{ borderLeft: `10px solid ${color}` }} />
    </div>
    <div className={classes.logoBlock}>
      <img className={classes.logoImg} src="https://openimis.org/themes/custom/ffw/logo.svg" alt="openIMIS" />
      <div className={classes.logoText}>openIMIS</div>
    </div>
  </div>
);

function hexToRgba(hex, a = 1) {
    const h = hex.replace('#', '');
    const b = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    const r = (b >> 16) & 255, g = (b >> 8) & 255, bl = b & 255;
    return `rgba(${r}, ${g}, ${bl}, ${a})`;
}

const InsureeIdCard = ({ insuree, classes, open, onClose }) => {
  if (!insuree) return null;

  const fullName = `${insuree.otherNames || ''} ${insuree.lastName || ''}`;
  const photoUrl = insuree.photo ? `data:image/jpeg;base64,${insuree.photo.photo}` : null;
  const location = insuree.currentVillage?.name || insuree.currentAddress || 'N/A';
  const idDoc = insuree.typeOfId?.code !== 'N' && insuree.passport
    ? `${insuree.typeOfId?.code}: ${insuree.passport}`
    : 'N/A';

  const DetailItem = ({ Icon, label, value }) => (
    <Grid item xs={12} sm={6}>
      <ListItem className={classes.idCardDetailRow} dense>
        <ListItemIcon className={classes.idCardDetailIcon}><Icon fontSize="small" /></ListItemIcon>
        <ListItemText primary={label} secondary={value || 'N/A'} />
      </ListItem>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle disableTypography>
        <Typography variant="h6">Digital Information Card</Typography>
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Card className={classes.idCard} variant="outlined">
          <CardContent>
            <div className={classes.idCardHeader}>
              <Avatar src={photoUrl} className={classes.idCardAvatar}>
                {fullName.charAt(0)}
              </Avatar>
              <Typography variant="h5" className={classes.idCardName}>{fullName}</Typography>
              <Typography variant="subtitle1" className={classes.idCardChfId}>
                Insuree ID: {insuree.chfId}
              </Typography>
            </div>
            <Grid container spacing={1}>
              <DetailItem Icon={Cake} label="Date of Birth" value={insuree.dob} />
              <DetailItem Icon={Wc} label="Gender" value={insuree.gender?.gender} />
              <DetailItem Icon={Phone} label="Phone Number" value={insuree.phone} />
              <DetailItem Icon={Email} label="Email Address" value={insuree.email} />
              <DetailItem Icon={Home} label="Location" value={location} />
              <DetailItem Icon={Favorite} label="Marital Status" value={insuree.marital} />
              <DetailItem Icon={Work} label="Profession" value={insuree.profession?.profession} />
              <DetailItem Icon={Fingerprint} label="ID Document" value={idDoc} />
              <DetailItem Icon={VerifiedUser} label="Status" value={insuree.status} />
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------- Main Component ------------------------- */
class MosipCallbackPage extends Component {
    static propTypes = {
        intl: PropTypes.object.isRequired,
        modulesManager: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
        classes: PropTypes.object.isRequired,
        location: PropTypes.object,
        clearCurrentPaginationPage: PropTypes.func.isRequired,
        fetchPublicInsureeByUuid: PropTypes.func.isRequired,
        updatePublicInsuree: PropTypes.func.isRequired,
        fetchInsureeMutation: PropTypes.func.isRequired,
        dispatch: PropTypes.func.isRequired,
    };

    state = {
        stepMosip: 'idle',
        stepFetch: 'idle',
        stepUpdate: 'idle',
        statusLine: 'Initializing data synchronization...',
        updatedInsureeData: null, // Will hold the final, merged insuree object
        isIdCardOpen: false,
    };

    async componentDidMount() {
        const moduleName = 'insuree'
        const { module } = this.props
        if (module !== moduleName) this.props.clearCurrentPaginationPage()
      
        const params = new URLSearchParams(this.props.location?.search || window.location.search || '')
        const rawState = params.get('state') || ''
        const uuidMatch = String(rawState).match(/[0-9a-fA-F-]{36}/)
        const insureeUuid = uuidMatch ? uuidMatch[0] : null
        const code = params.get('code') || null
      
        // Step 1: MOSIP mapping
        if (!code) {
          this.setState({
            stepMosip: 'error', stepFetch: 'error', stepUpdate: 'error',
            statusLine: 'Missing authorization code—cannot sync from MOSIP.',
          });
          return;
        }
      
        this.setState({ stepMosip: 'running', statusLine: 'Verifying and mapping data from MOSIP…' });
        let patch = null;
        try {
          const baseline = insureeUuid ? { uuid: insureeUuid } : null
          const out = await populateInsureeFromAuthCode(this.props.dispatch, code, baseline)
          patch = out?.patch || null
          this.setState({ stepMosip: 'success', statusLine: 'MOSIP data verified. Fetching insuree record…' });
        } catch (e) {
          this.setState({
            stepMosip: 'error', stepFetch: 'error', stepUpdate: 'error',
            statusLine: `MOSIP verification failed: ${e?.message || 'Unknown error'}.`,
          });
          return;
        }
      
        // Step 2: Fetch insuree
        if (!insureeUuid) {
          this.setState({
            stepFetch: 'error', stepUpdate: 'error',
            statusLine: 'No valid insuree reference found in callback.',
          });
          return;
        }
      
        this.setState({ stepFetch: 'running', statusLine: 'Fetching insuree record…' });
        let insuree = null;
        try {
          const resp = await this.props.fetchPublicInsureeByUuid(insureeUuid);
          insuree = resp?.payload?.data?.insureeByUuidPublic || null;
          if (!insuree) throw new Error("Insuree not found or not accessible.");
          this.setState({ stepFetch: 'success', statusLine: 'Insuree loaded. Applying updates…' });
        } catch (e) {
          this.setState({
            stepFetch: 'error', stepUpdate: 'error',
            statusLine: `Failed to fetch insuree record: ${e.message}`,
          });
          return;
        }
      
        // Step 3: Update insuree
        // Ensure all required fields are preserved from the original insuree
        const mergedInsuree = { 
          ...insuree, 
          ...patch, 
          uuid: insuree.uuid,
          // Ensure required fields are always present (backend requires: lastName, otherNames, genderId, dob)
          lastName: patch.lastName || insuree.lastName || '',
          otherNames: patch.otherNames || insuree.otherNames || '',
          dob: patch.dob || insuree.dob || null,
          gender: patch.gender || insuree.gender || null,
          // Preserve other important fields that might be needed
          chfId: insuree.chfId || null,
          family: insuree.family || null,
          currentVillage: insuree.currentVillage || null,
        };
        
        // Validate required fields before sending
        if (!mergedInsuree.lastName || !mergedInsuree.otherNames || !mergedInsuree.dob || !mergedInsuree.gender?.code) {
          const missing = [];
          if (!mergedInsuree.lastName) missing.push('lastName');
          if (!mergedInsuree.otherNames) missing.push('otherNames');
          if (!mergedInsuree.dob) missing.push('dob');
          if (!mergedInsuree.gender?.code) missing.push('gender');
          throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        const label = formatMessageWithValues(this.props.intl, 'insuree', 'UpdateInsuree.mutationLabel', { label: insuree?.chfId || '' });
      
        this.setState({ stepUpdate: 'running', statusLine: 'Applying updates…' });
        try {
          console.log('Updating insuree with data:', {
            uuid: mergedInsuree.uuid,
            lastName: mergedInsuree.lastName,
            otherNames: mergedInsuree.otherNames,
            dob: mergedInsuree.dob,
            gender: mergedInsuree.gender,
            hasPatch: !!patch,
          });
          
          const updateResp = await this.props.updatePublicInsuree(this.props.modulesManager, mergedInsuree, label);
          
          console.log('Update response:', updateResp);
          
          // Check for immediate GraphQL errors
          const hasGraphQLErr = 
            (updateResp?.payload?.errors && updateResp.payload.errors.length > 0) ||
            (updateResp?.errors && updateResp.errors.length > 0);
      
          if (hasGraphQLErr) {
            const errors = updateResp?.payload?.errors || updateResp?.errors || [];
            const errMsg = errors[0]?.message || errors[0]?.detail || 'Unknown error during update';
            throw new Error(errMsg);
          }
          
          // Get the clientMutationId from the response
          // The mutation response structure: data.updateInsuree.clientMutationId
          const clientMutationId = 
            updateResp?.payload?.data?.updateInsuree?.clientMutationId ||
            updateResp?.payload?.data?.updateInsuree?.client_mutation_id ||
            updateResp?.clientMutationId ||
            updateResp?.payload?.clientMutationId;
          
          console.log('Extracted clientMutationId:', clientMutationId);
          console.log('Full response structure:', JSON.stringify(updateResp, null, 2));
          
          if (!clientMutationId) {
            throw new Error('No clientMutationId returned from mutation. Response: ' + JSON.stringify(updateResp));
          }
          
          // Wait for mutation to complete and check status
          let mutationComplete = false;
          let attempts = 0;
          const maxAttempts = 30; // Wait up to 15 seconds (30 * 500ms)
          
          console.log('Starting mutation status polling...');
          
          while (!mutationComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            attempts++;
            
            try {
              console.log(`Checking mutation status (attempt ${attempts}/${maxAttempts})...`);
              const mutationCheckResp = await this.props.fetchInsureeMutation(this.props.modulesManager, clientMutationId);
              
              console.log('Mutation check response:', mutationCheckResp);
              
              const mutationLogs = mutationCheckResp?.payload?.data?.mutationLogs;
              
              console.log('Mutation logs:', mutationLogs);
              
              if (mutationLogs && mutationLogs.edges && mutationLogs.edges.length > 0) {
                const mutationNode = mutationLogs.edges[0].node;
                const status = mutationNode?.status;
                
                console.log(`Mutation status: ${status} (0=RECEIVED, 1=ERROR, 2=SUCCESS)`);
                console.log('Mutation node:', mutationNode);
                
                if (status === 2) { // SUCCESS
                  mutationComplete = true;
                  console.log('Mutation completed successfully!');
                } else if (status === 1) { // ERROR
                  const errorMsg = mutationNode?.error || 'Mutation failed';
                  console.error('Mutation failed with error:', errorMsg);
                  throw new Error(errorMsg);
                } else if (status === 0) { // RECEIVED - still processing
                  console.log('Mutation still processing, waiting...');
                  continue;
                } else {
                  console.log(`Unknown status: ${status}, continuing to wait...`);
                  continue;
                }
              } else {
                console.log('No mutation logs found yet, continuing to wait...');
                continue;
              }
            } catch (checkErr) {
              // If it's our error from status check, rethrow it
              if (checkErr.message && checkErr.message.includes('Mutation failed')) {
                throw checkErr;
              }
              // Otherwise, log and continue waiting
              console.warn('Error checking mutation status:', checkErr);
              if (attempts >= maxAttempts) {
                throw new Error('Timeout waiting for mutation to complete: ' + checkErr.message);
              }
            }
          }
          
          if (!mutationComplete) {
            throw new Error('Mutation did not complete within timeout period');
          }
          
          this.setState({ 
              stepUpdate: 'success', 
              statusLine: 'Insuree successfully updated with MOSIP data!',
              updatedInsureeData: mergedInsuree, // Store the final, merged data
          });
        } catch (e) {
          console.error('Update failed:', e);
          this.setState({ stepUpdate: 'error', statusLine: `Update failed: ${e.message}` });
        }
    }

    componentWillUnmount() {
        const { location, history } = this.props;
        if (!history.location.pathname.includes(location?.pathname)) {
            this.props.clearCurrentPaginationPage();
        }
    }

    isProcessCompleted = () => {
        const { stepFetch, stepMosip, stepUpdate } = this.state;
        return !['idle', 'running'].includes(stepFetch) && !['idle', 'running'].includes(stepMosip) && !['idle', 'running'].includes(stepUpdate);
    };

    flowColor = () => {
        const { stepFetch, stepMosip, stepUpdate } = this.state;
        if (stepFetch === 'error' || stepMosip === 'error' || stepUpdate === 'error') return this.props.theme.palette.error.main;
        if (this.isProcessCompleted()) return this.props.theme.palette.success.main;
        return this.props.theme.palette.info.main;
    };

    renderStepIcon = (status) => {
        const { classes } = this.props;
        if (status === 'success') return <CheckCircleOutline className={classes.stepOk} />;
        if (status === 'error') return <HighlightOff className={classes.stepErr} />;
        if (status === 'running') return <CircularProgress size={20} className={classes.stepRun} />;
        return <SyncIcon color="disabled" />;
    };

    renderSteps = () => {
        const { stepFetch, stepMosip, stepUpdate } = this.state;
        const steps = [
            { label: 'Verifying MOSIP Data', status: stepMosip },
            { label: 'Fetching Insuree Record', status: stepFetch },
            { label: 'Updating Insuree Record', status: stepUpdate },
        ];

        return (
            <List dense>
                {steps.map((step) => (
                    <ListItem key={step.label}>
                        <ListItemIcon>{this.renderStepIcon(step.status)}</ListItemIcon>
                        <ListItemText primary={step.label} />
                    </ListItem>
                ))}
            </List>
        );
    };
    
    handleOpenIdCard = () => this.setState({ isIdCardOpen: true });
    handleCloseIdCard = () => this.setState({ isIdCardOpen: false });

    renderActions = () => {
        const { classes, history } = this.props;
        const { updatedInsureeData, stepUpdate } = this.state;

        if (!this.isProcessCompleted()) return null;

        const isSuccess = stepUpdate === 'success';

        return (
            <div className={classes.cardActions}>
                {isSuccess && updatedInsureeData ? (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleOpenIdCard}
                    >
                        Show My Information
                    </Button>
                ) : (
                    <Button variant="contained" color="secondary" onClick={() => history.goBack()}>
                        Go Back
                    </Button>
                )}
            </div>
        );
    };

    render() {
        const { classes } = this.props;
        const { statusLine, isIdCardOpen, updatedInsureeData } = this.state;

        return (
            <div className={classes.page}>
                <Paper className={classes.card}>
                    <div className={classes.cardHeader}>
                        <FlowBanner classes={classes} color={this.flowColor()} isCompleted={this.isProcessCompleted()} />
                    </div>
                    <Divider />
                    <div className={classes.cardContent}>
                        <Typography variant="h6" component="h1" className={classes.statusTitle}>
                            {statusLine}
                        </Typography>
                        {this.renderSteps()}
                    </div>
                    {this.renderActions()}
                </Paper>
                <InsureeIdCard
                    insuree={updatedInsureeData}
                    classes={classes}
                    open={isIdCardOpen}
                    onClose={this.handleCloseIdCard}
                />
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => ({
    dispatch,
    ...bindActionCreators(
        { clearCurrentPaginationPage, fetchPublicInsureeByUuid, updatePublicInsuree, fetchInsureeMutation },
        dispatch,
    ),
});

export default injectIntl(
    withModulesManager(
        withHistory(
            connect(mapStateToProps, mapDispatchToProps)(
                withTheme(withStyles(styles)(MosipCallbackPage)),
            ),
        ),
    ),
);