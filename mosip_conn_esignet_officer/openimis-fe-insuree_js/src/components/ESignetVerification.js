import React, { useState, useEffect, useRef } from "react";
import {
    Button,
    CircularProgress,
    Typography,
    Grid,
    Paper,
    Backdrop,
    Box,
    Chip
} from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { makeStyles } from "@material-ui/core/styles";
import { baseApiUrl } from "@openimis/fe-core";

const ESIGNET_LOGO_URL = "https://docs.esignet.io/~gitbook/image?url=https%3A%2F%2F3349261888-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FylzvZHp30DQ3rNCClELV%252Ficon%252FYCxMCjDAw16NbhKD3k0X%252FOriginal_Small_Scale_Logo_SVG.svg%3Falt%3Dmedia%26token%3D9237637a-8696-4605-8d90-064a25c51615&width=32&dpr=4&quality=100&sign=acaa8211&sv=2";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(3),
        marginBottom: theme.spacing(3),
        // FIXED: Added quotes around "inherit" and set border to black
        backgroundColor: "inherit", 
        border: "1px solid black",
        borderRadius: theme.shape.borderRadius,
        position: "relative",
        transition: "all 0.3s ease",
        "&:hover": {
            boxShadow: theme.shadows[2],
        }
    },
    rootVerified: {
        // Empty: Keeps the black border and inherit background even when verified
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "48px",
        width: "48px",
        marginRight: theme.spacing(2),
        "& img": {
            width: "100%",
            height: "100%",
            objectFit: "contain",
        },
    },
    content: {
        flexGrow: 1,
    },
    actionButton: {
        minWidth: "180px",
        textTransform: "none",
        fontWeight: 600,
        boxShadow: "none",
    },
    loadingBackdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: theme.shape.borderRadius,
        zIndex: theme.zIndex.modal + 1,
        color: theme.palette.primary.main,
        // FIXED: Added quotes here as well (using rgba for visibility)
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
    },
    statusChip: {
        marginLeft: theme.spacing(1),
        fontWeight: "bold",
    }
}));

const ESIGNET_LOGIN_URL = `${baseApiUrl}/insuree/api/esignet/login/`;
const ESIGNET_POLL_URL = `${baseApiUrl}/insuree/api/esignet/poll/`;

const ESignetVerification = ({ onUserDataReceived, disabled = false, existingVerification = null }) => {
    const classes = useStyles();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(!!existingVerification);
    const [error, setError] = useState(null);
    const [pollCount, setPollCount] = useState(0);
    const [sessionId, setSessionId] = useState(null);

    const popupRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const authCompletedRef = useRef(false);

    const pollForAuthData = async (sid) => {
        try {
            setPollCount(prev => prev + 1);
            const response = await fetch(`${ESIGNET_POLL_URL}?session_id=${sid}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) return false;
            const data = await response.json();
            if (data.status === 'success') { handleAuthSuccess(data.userData); return true; }
            if (data.status === 'error') { handleAuthError(data.error, data.error_description); return true; }
            return false;
        } catch { setError('Polling failed. Please try again.'); return false; }
    };

    const startPolling = (sid) => {
        setPollCount(0);
        setSessionId(sid);
        pollForAuthData(sid);

        pollIntervalRef.current = setInterval(async () => {
            const shouldStop = await pollForAuthData(sid);
            if (shouldStop) stopPolling();
        }, 1000);

        setTimeout(() => {
            if (pollIntervalRef.current && !authCompletedRef.current) {
                stopPolling();
                setError('Authentication timeout. Please try again.');
                setIsLoading(false);
            }
        }, 120000);
    };

    const stopPolling = () => { if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; } };

    useEffect(() => () => { stopPolling(); if (popupRef.current && !popupRef.current.closed) { try { popupRef.current.close(); } catch {} } }, []);

    const handleAuthSuccess = (userData) => {
        if (authCompletedRef.current) return;
        authCompletedRef.current = true;
        setIsVerified(true); setIsLoading(false); setError(null); stopPolling();
        if (popupRef.current && !popupRef.current.closed) { try { popupRef.current.close(); } catch {} }
        if (onUserDataReceived) {
            onUserDataReceived({
                name: userData.name,
                email: userData.email,
                phone: userData.phone_number,
                gender: userData.gender,
                birthdate: userData.birthdate,
                address: userData.address,
                individualId: userData.individual_id,
                sub: userData.sub,
                verificationDate: new Date().toISOString(),
                rawData: userData,
            });
        }
    };

    const handleAuthError = (errorCode, errorDescription) => {
        if (authCompletedRef.current) return;
        authCompletedRef.current = true;
        setError(errorDescription || errorCode || 'Authentication failed');
        setIsLoading(false);
        stopPolling();
        if (popupRef.current && !popupRef.current.closed) { try { popupRef.current.close(); } catch {} }
    };

    const handleVerifyClick = async () => {
        localStorage.removeItem('esignet_session_id');
        authCompletedRef.current = false; setIsLoading(true); setError(null); setPollCount(0); setSessionId(null);
        
        const width = 600, height = 700;
        const left = Math.round((window.screen.width / 2) - (width / 2));
        const top = Math.round((window.screen.height / 2) - (height / 2));
        
        const popup = window.open(ESIGNET_LOGIN_URL, 'eSignetAuth', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
        
        if (!popup) { setError('Popup blocked! Please allow popups.'); setIsLoading(false); return; }
        popupRef.current = popup;
        try { popup.focus(); } catch {}
        
        let attempts = 0;
        const checkSessionId = setInterval(() => {
            attempts++;
            const sid = localStorage.getItem('esignet_session_id');
            if (sid) { clearInterval(checkSessionId); startPolling(sid); } 
            else if (attempts > 20) { clearInterval(checkSessionId); setError('Could not retrieve session ID.'); setIsLoading(false); }
        }, 500);
    };

    return (
        <Paper className={`${classes.root} ${isVerified ? classes.rootVerified : ''}`} elevation={0}>
            {/* Loading Overlay */}
            <Backdrop open={isLoading} className={classes.loadingBackdrop}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <CircularProgress color="primary" />
                    <Typography variant="body2" style={{ marginTop: 16 }}>
                        Connecting to eSignet...
                    </Typography>
                </Box>
            </Backdrop>

            <Grid container alignItems="center" spacing={2}>
                <Grid item>
                    <div className={classes.logoContainer}>
                        <img src={ESIGNET_LOGO_URL} alt="eSignet Logo" />
                    </div>
                </Grid>

                <Grid item className={classes.content} xs>
                    <Box display="flex" alignItems="center">
                        <Typography variant="h6" component="span" style={{ fontSize: '1rem', fontWeight: 600 }}>
                            eSignet Digital ID
                        </Typography>
                        {isVerified && (
                            <Chip 
                                icon={<CheckCircleIcon style={{color: 'white'}}/>} 
                                label="Verified" 
                                size="small" 
                                className={classes.statusChip}
                                style={{ backgroundColor: '#4caf50', color: 'white' }}
                            />
                        )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: 4 }}>
                        {error ? (
                            <span style={{ color: '#d32f2f' }}>
                                <ErrorIcon fontSize="small" style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                                {error}
                            </span>
                        ) : isVerified ? (
                            "Your identity has been successfully verified. Details have been auto-filled."
                        ) : (
                            "Use your eSignet ID to verify your identity and auto-fill your profile."
                        )}
                    </Typography>
                </Grid>

                <Grid item>
                    {isVerified ? (
                         <Button
                            variant="outlined"
                            className={classes.actionButton}
                            onClick={handleVerifyClick}
                            disabled={isLoading}
                            size="medium"
                        >
                            Verify Again
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            className={classes.actionButton}
                            startIcon={<OpenInNewIcon />}
                            onClick={handleVerifyClick}
                            disabled={disabled || isLoading}
                            size="medium"
                        >
                            Verify Identity
                        </Button>
                    )}
                </Grid>
            </Grid>

            {existingVerification && (
                <Box mt={1} pt={1} borderTop="1px dashed #e0e0e0">
                    <Typography variant="caption" color="textSecondary">
                        Last verified: {new Date(existingVerification).toLocaleDateString()} at {new Date(existingVerification).toLocaleTimeString()}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default ESignetVerification;