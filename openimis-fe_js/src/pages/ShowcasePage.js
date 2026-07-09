import React, { useCallback } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";

const SECTION_IDS = {
  intro: "showcase-intro",
  step1: "showcase-step-1",
  step2: "showcase-step-2",
  step3: "showcase-step-3",
  step4: "showcase-step-4",
  step5: "showcase-step-5",
  security: "showcase-security",
};

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    background: "#f5f7fb",
    padding: theme.spacing(4, 3, 8),
    [theme.breakpoints.up("md")]: {
      padding: theme.spacing(5, 4, 10),
    },
  },
  pageRow: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
  },
  tocColumn: {
    [theme.breakpoints.up("md")]: {
      position: "sticky",
      top: theme.spacing(3),
      alignSelf: "flex-start",
    },
  },
  tocPaper: {
    padding: theme.spacing(2, 2),
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up("md")]: {
      marginBottom: 0,
    },
  },
  tocTitle: {
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.palette.text.secondary,
    padding: theme.spacing(0, 1.5, 1),
  },
  tocItem: {
    borderRadius: theme.shape.borderRadius,
    paddingTop: 4,
    paddingBottom: 4,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  tocItemActive: {
    backgroundColor: theme.palette.action.selected,
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
  },
  mainColumn: {
    minWidth: 0,
  },
  hero: {
    padding: theme.spacing(4, 3),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(5, 4),
    },
  },
  section: {
    padding: theme.spacing(3, 3),
    marginBottom: theme.spacing(3),
    scrollMarginTop: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(4, 4),
    },
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  techLabel: {
    fontWeight: 600,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0.75),
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.palette.primary.main,
  },
  mono: {
    fontFamily: 'Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 13,
    backgroundColor: theme.palette.type === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    padding: theme.spacing(0.5, 1),
    borderRadius: 4,
    display: "inline-block",
    marginTop: theme.spacing(0.5),
  },
  cardGrid: {
    marginTop: theme.spacing(1),
  },
  card: {
    height: "100%",
    padding: theme.spacing(3),
  },
}));

const tocEntries = [
  { id: SECTION_IDS.intro, label: "Introduction" },
  { id: SECTION_IDS.step1, label: "1 · Insuree in openIMIS" },
  { id: SECTION_IDS.step2, label: "2 · MOSIP / eSignet (OIDC)" },
  { id: SECTION_IDS.step3, label: "3 · Token exchange (OAuth 2.0)" },
  { id: SECTION_IDS.step4, label: "4 · UserInfo" },
  { id: SECTION_IDS.step5, label: "5 · Map & save insuree" },
  { id: SECTION_IDS.security, label: "Security & stack" },
];

const ShowcasePage = ({ logo }) => {
  const classes = useStyles();
  const history = useHistory();
  const [activeId, setActiveId] = React.useState(SECTION_IDS.intro);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 },
    );

    tocEntries.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Box className={classes.root}>
      <Grid container spacing={4} className={classes.pageRow}>
        <Grid item xs={12} md={3} className={classes.tocColumn}>
          <Paper className={classes.tocPaper} elevation={1} component="nav" aria-label="Table of contents">
            <Typography className={classes.tocTitle} component="p">
              On this page
            </Typography>
            <List dense disablePadding>
              {tocEntries.map(({ id, label }) => (
                <ListItem
                  key={id}
                  button
                  className={`${classes.tocItem} ${activeId === id ? classes.tocItemActive : ""}`}
                  onClick={() => scrollToSection(id)}
                >
                  <ListItemText primary={label} primaryTypographyProps={{ variant: "body2" }} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9} className={classes.mainColumn}>
          <Paper className={classes.hero} elevation={2} id={SECTION_IDS.intro}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={logo ? 8 : 12}>
                <Typography color="primary" gutterBottom variant="overline">
                  Insuree module · openIMIS and MOSIP
                </Typography>
                <Typography gutterBottom variant="h3">
                  How identity verification fits into enrolment
                </Typography>
                <Typography color="textSecondary" paragraph variant="h6">
                  This page walks through the integration end to end: OpenID Connect and OAuth 2.0 on the wire,
                  GraphQL between the React insuree module and Django, and how verified attributes land in the insuree
                  record—full width for technical readers and demos.
                </Typography>
                <Box mt={2}>
                  <Button color="primary" onClick={() => history.push("/login")} variant="contained">
                    Go to Login
                  </Button>
                </Box>
              </Grid>
              {logo && (
                <Grid item xs={12} md={4}>
                  <Box display="flex" justifyContent="center">
                    <img alt="openIMIS" src={logo} style={{ maxHeight: 140, maxWidth: "100%" }} />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.step1}>
            <Typography variant="overline" color="primary">
              Step 1
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Open the insured person in openIMIS
            </Typography>
            <Typography color="textSecondary" paragraph>
              Staff use the standard openIMIS insuree (insured person) UI: search, open a family or member, and
              prepare edits the same way as for any enrolment workflow. The MOSIP path is an add-on on top of that
              record—it does not replace openIMIS permissions or business rules.
            </Typography>
            <Typography className={classes.techLabel}>Protocols and technology</Typography>
            <Typography color="textSecondary" component="div" variant="body2">
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>Frontend:</strong> React 17, Material UI v4, and the <span className={classes.mono}>
                    @openimis/fe-insuree
                  </span>{" "}
                  module bundled with <span className={classes.mono}>@openimis/fe-core</span> (Redux,{" "}
                  <span className={classes.mono}>graphqlWithVariables</span> for GraphQL over HTTPS).
                </li>
                <li>
                  <strong>API shape:</strong> Insuree reads and mutations follow the openIMIS GraphQL schema; nothing
                  in this step calls MOSIP yet—it only establishes <em>which</em> insuree UUID and draft form state
                  will receive verified fields later.
                </li>
              </ul>
            </Typography>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.step2}>
            <Typography variant="overline" color="primary">
              Step 2
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Redirect to MOSIP (eSignet) — authorization code
            </Typography>
            <Typography color="textSecondary" paragraph>
              The user leaves openIMIS and authenticates at the national identity provider. MOSIP’s eSignet acts as an
              OpenID Provider (OIDC): after login and consent, the browser is sent back to a registered{" "}
              <strong>redirect URI</strong> with an <strong>authorization code</strong> (and typically a{" "}
              <strong>state</strong> value tying the round trip to the insuree). Identity attributes are not shipped in
              the front-channel redirect; only the code and metadata are.
            </Typography>
            <Typography className={classes.techLabel}>Protocols and technology</Typography>
            <Typography color="textSecondary" component="div" variant="body2">
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>OpenID Connect / OAuth 2.0:</strong> <span className={classes.mono}>response_type=code</span>{" "}
                  (authorization code flow), <span className={classes.mono}>scope</span> such as{" "}
                  <span className={classes.mono}>openid profile email</span>, and optional{" "}
                  <span className={classes.mono}>claims</span> JSON to mark which userinfo fields are essential.
                </li>
                <li>
                  <strong>PKCE (RFC 7636):</strong> A <span className={classes.mono}>code_challenge</span> and{" "}
                  <span className={classes.mono}>code_challenge_method=S256</span> are sent on the authorize request;
                  the backend later sends the matching <span className={classes.mono}>code_verifier</span> on the token
                  request so the code cannot be redeemed by a leaked intercept alone.
                </li>
                <li>
                  <strong>Implementation surface:</strong> <span className={classes.mono}>generateSignInUrl</span> /{" "}
                  <span className={classes.mono}>handleVerifyInsuree</span> build the authorize URL; the{" "}
                  <span className={classes.mono}>MosipCallbackPage</span> route handles the return path and reads the{" "}
                  <span className={classes.mono}>code</span> (and state) from the query string.
                </li>
              </ul>
            </Typography>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.step3}>
            <Typography variant="overline" color="primary">
              Step 3
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Exchange the code for an access token (server-side only)
            </Typography>
            <Typography color="textSecondary" paragraph>
              The browser passes the authorization code to openIMIS via GraphQL. The insuree backend performs the token
              request to MOSIP’s token endpoint over HTTPS. The client proves itself with a <strong>JWT client
              assertion</strong> signed with a private key held in environment configuration—so secrets never ship to
              end users’ machines.
            </Typography>
            <Typography className={classes.techLabel}>Protocols and technology</Typography>
            <Typography color="textSecondary" component="div" variant="body2">
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>HTTP:</strong> <span className={classes.mono}>POST</span> to{" "}
                  <span className={classes.mono}>TOKEN_ENDPOINT</span>, body{" "}
                  <span className={classes.mono}>application/x-www-form-urlencoded</span>.
                </li>
                <li>
                  <strong>OAuth 2.0 grant:</strong>{" "}
                  <span className={classes.mono}>grant_type=authorization_code</span>, plus{" "}
                  <span className={classes.mono}>code</span>, <span className={classes.mono}>redirect_uri</span>,{" "}
                  <span className={classes.mono}>client_id</span>, and PKCE{" "}
                  <span className={classes.mono}>code_verifier</span>.
                </li>
                <li>
                  <strong>Client authentication (RFC 7523):</strong>{" "}
                  <span className={classes.mono}>client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer</span>{" "}
                  and <span className={classes.mono}>client_assertion</span> = JWT signed with{" "}
                  <span className={classes.mono}>RS256</span> using a JWK loaded from{" "}
                  <span className={classes.mono}>PRIVATE_KEY_BASE64</span> (decoded JSON JWK or JWKS).
                </li>
                <li>
                  <strong>GraphQL:</strong> Frontend dispatches <span className={classes.mono}>ExchangeCode</span>{" "}
                  mutation; backend class <span className={classes.mono}>ExchangeCodeMutation</span> (Graphene)
                  implements the exchange using <span className={classes.mono}>httpx</span>.
                </li>
              </ul>
            </Typography>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.step4}>
            <Typography variant="overline" color="primary">
              Step 4
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Call UserInfo with the access token
            </Typography>
            <Typography color="textSecondary" paragraph>
              Once openIMIS holds a valid <strong>access token</strong>, the backend calls MOSIP’s UserInfo endpoint
              with <span className={classes.mono}>Authorization: Bearer &lt;token&gt;</span>. The response may be JSON or
              a signed JWT string; the implementation treats the payload as opaque at the HTTP layer and decodes
              claims in the application.
            </Typography>
            <Typography className={classes.techLabel}>Protocols and technology</Typography>
            <Typography color="textSecondary" component="div" variant="body2">
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>HTTP:</strong> <span className={classes.mono}>GET USERINFO_ENDPOINT</span> with{" "}
                  <span className={classes.mono}>Accept: application/json, application/jwt</span> so either representation
                  can be negotiated.
                </li>
                <li>
                  <strong>OIDC UserInfo:</strong> Standard OIDC step after token issuance; supplies name-verified claims
                  (e.g. <span className={classes.mono}>sub</span>, <span className={classes.mono}>name</span>,{" "}
                  <span className={classes.mono}>birthdate</span>, <span className={classes.mono}>gender</span>,{" "}
                  <span className={classes.mono}>email</span>, <span className={classes.mono}>phone_number</span>,{" "}
                  <span className={classes.mono}>address</span>, <span className={classes.mono}>picture</span>).
                </li>
                <li>
                  <strong>GraphQL:</strong> <span className={classes.mono}>UserInfoMutation</span> returns raw body +
                  HTTP status for the frontend helper <span className={classes.mono}>fetchUserInfoRaw</span>.
                </li>
                <li>
                  <strong>JWT handling in browser:</strong> <span className={classes.mono}>decodeJwtNoVerify</span>{" "}
                  parses the payload (signature is not verified in the snippet—trust is anchored on TLS + token
                  issuance from MOSIP); production hardening may verify JWKS if MOSIP exposes one for userinfo JWTs.
                </li>
              </ul>
            </Typography>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.step5}>
            <Typography variant="overline" color="primary">
              Step 5
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Map claims to the insuree model and persist
            </Typography>
            <Typography color="textSecondary" paragraph>
              The callback orchestrator <span className={classes.mono}>populateInsureeFromAuthCode</span> chains{" "}
              <strong>exchange → userinfo → decode → map</strong>. Claim names from OIDC are transformed into openIMIS
              insuree fields (e.g. splitting full <span className={classes.mono}>name</span>, normalising{" "}
              <span className={classes.mono}>birthdate</span> to ISO, gender codes, concatenated address lines). An
              optional profile <span className={classes.mono}>picture</span> URL is fetched and converted to a base64
              photo object compatible with insuree photo upload APIs.
            </Typography>
            <Typography className={classes.techLabel}>Protocols and technology</Typography>
            <Typography color="textSecondary" component="div" variant="body2">
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>GraphQL:</strong> Subsequent saves use existing insuree mutations (create/update) already
                  exposed by <span className={classes.mono}>openimis-be-insuree_py</span>; MOSIP data becomes field
                  updates on the same GraphQL contract the rest of the module uses.
                </li>
                <li>
                  <strong>Media:</strong> <span className={classes.mono}>fetch</span> +{" "}
                  <span className={classes.mono}>FileReader</span> for <span className={classes.mono}>picture</span>{" "}
                  when CORS allows; MIME-derived file extension for the uploaded blob metadata.
                </li>
                <li>
                  <strong>UX:</strong> <span className={classes.mono}>MosipCallbackPage</span> surfaces step status
                  (loading, success, error) so operators see whether token exchange and userinfo succeeded before
                  returning to the editor.
                </li>
              </ul>
            </Typography>
          </Paper>

          <Paper className={classes.section} elevation={1} id={SECTION_IDS.security}>
            <Typography variant="overline" color="primary">
              Cross-cutting
            </Typography>
            <Typography variant="h5" className={classes.sectionTitle} component="h2">
              Security, trust boundaries, and stack
            </Typography>
            <Typography color="textSecondary" paragraph>
              Sensitive cryptography and third-party calls stay on the Django backend; the SPA only handles navigation,
              GraphQL actions, and presentation. Transport is HTTPS end to end; tokens are short-lived bearer credentials
              for UserInfo only and should be treated as secrets in logs.
            </Typography>
            <Divider style={{ margin: "24px 0" }} />
            <Grid container spacing={3} className={classes.cardGrid}>
              <Grid item xs={12} md={4}>
                <Paper className={classes.card} elevation={0} variant="outlined">
                  <Typography gutterBottom variant="subtitle1">
                    Why server-side exchange
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Private JWK material (<span className={classes.mono}>PRIVATE_KEY_BASE64</span>),{" "}
                    <span className={classes.mono}>CLIENT_ID</span>, and token endpoint URLs live in server env—not in{" "}
                    <span className={classes.mono}>REACT_APP_*</span>—so the authorization code cannot be redeemed by
                    an arbitrary script on the client.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className={classes.card} elevation={0} variant="outlined">
                  <Typography gutterBottom variant="subtitle1">
                    Standards used
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    OAuth 2.0 authorization code + PKCE; OIDC authorize / userinfo; JWT client assertion (RFC 7523);
                    RS256-signed JWTs; GraphQL over HTTPS for openIMIS; REST-style HTTPS calls from Python (
                    <span className={classes.mono}>httpx</span>) to MOSIP.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className={classes.card} elevation={0} variant="outlined">
                  <Typography gutterBottom variant="subtitle1">
                    Operational note
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Redirect URIs, client IDs, and eSignet endpoints must match what MOSIP registers for your
                    deployment; a mismatch is the most common cause of failed code exchange or empty UserInfo.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShowcasePage;
