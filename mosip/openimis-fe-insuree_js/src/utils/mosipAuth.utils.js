import { graphqlWithVariables } from "@openimis/fe-core";


/** unwrap various redux/gql action shapes */
export const unwrapGql = (res) => res?.payload?.data ?? res?.data ?? res;

/** plain JS JWT decode (no signature verification) */
export const decodeJwtNoVerify = (jwt) => {
  const parts = String(jwt || "").split(".");
  if (parts.length < 2) throw new Error("Not a JWT");
  const base64url = parts[1];
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4);
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const json = decodeURIComponent(
    Array.prototype.map
      .call(binary, function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(json);
};

/** download an image URL and return { base64, ext } */
export const loadImageAsBase64 = async (url) => {
  const resp = await fetch(url, { mode: "cors" });
  if (!resp.ok) throw new Error(`Image fetch failed: ${resp.status}`);
  const blob = await resp.blob();
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.toString().split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const ext = (blob.type && blob.type.split("/")[1]) || "jpg";
  return { base64, ext };
};

/** exchange `code` -> accessToken via GraphQL */
export const exchangeCode = async (dispatch, code) => {
  const action = graphqlWithVariables(
    `
    mutation ExchangeCode($code: String!) {
      exchangeCode(code: $code) {
        accessToken
        error
        errorDescription
      }
    }
    `,
    { code },
    "MOSIP_EXCHANGE_CODE"
  );
  const resp = await dispatch(action);
  const data = unwrapGql(resp);
  const out = data?.exchangeCode;
  if (!out?.accessToken) {
    const err = out?.errorDescription || out?.error || "No access token from exchangeCode";
    throw new Error(err);
  }
  return out.accessToken;
};

/** call userInfo(accessToken) via GraphQL -> returns raw (JWT or JSON) */
export const fetchUserInfoRaw = async (dispatch, accessToken) => {
  const action = graphqlWithVariables(
    `
    mutation GetUserInfo($token: String!) {
      userInfo(accessToken: $token) {
        raw
        status
        error
      }
    }
    `,
    { token: accessToken },
    "MOSIP_USERINFO"
  );
  const resp = await dispatch(action);
  const data = unwrapGql(resp);
  const ui = data?.userInfo;
  if (!ui?.raw || ui?.error || (ui?.status && ui.status !== 200)) {
    throw new Error(ui?.error || "Failed to fetch userinfo");
  }
  return ui.raw;
};

const toIsoDate = (d) => {
  if (!d) return null;
  // handle 1980/12/01, 1980-12-01, and Date-like strings
  const s = String(d).trim().replace(/\//g, '-');
  // Accept only YYYY-MM-DD
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  // Last resort: try Date() and format
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  const pad = (x) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

/** map decoded MOSIP userinfo -> Insuree form patch */
export const mapUserInfoToInsuree = async (decoded, prevEdited) => {
  console.log('Decoded MOSIP userinfo:', decoded);
  const fullName = decoded?.name?.trim() || "";
  let lastName = "";
  let otherNames = "";
  if (fullName.includes(" ")) {
    const parts = fullName.split(/\s+/);
    lastName = parts[parts.length - 1];
    otherNames = parts.slice(0, -1).join(" ");
  } else {
    otherNames = fullName;
  }

  // Gender (adjust if your backend expects different codes)
  const genderCode = decoded?.gender
    ? ((decoded.gender[0] || "").toUpperCase() === "F" ? "F" : "M")
    : null;

  const dob = toIsoDate(decoded?.birthdate) || toIsoDate(prevEdited?.dob);

  const currentAddress = decoded?.address
    ? [decoded.address?.woreda, decoded.address?.zone, decoded.address?.region]
        .filter(Boolean)
        .join(", ")
    : null;

  // Photo (optional)
  let photoObj = null;
  if (decoded?.picture) {
    try {
      const b64 = await loadImageAsBase64(decoded.picture);
      if (b64?.base64) {
        const today = new Date().toISOString().slice(0, 10);
        photoObj = {
          photo: b64.base64,
          filename: `mosip_profile.${b64.ext || "jpg"}`,
          date: today,
          folder: null,
          officer_id: null,
        };
      }
    } catch (e) {
      // swallow; keep mapping other fields
      // console.warn("Could not fetch profile picture:", e);
    }
  }

  return {
    lastName: lastName || prevEdited?.lastName || "",
    otherNames: otherNames || prevEdited?.otherNames || "",
    dob: dob || prevEdited?.dob || null,
    gender: genderCode ? { code: genderCode } : prevEdited?.gender || null,
    phone: decoded?.phone_number || prevEdited?.phone || "",
    email: decoded?.email || prevEdited?.email || "",
    currentAddress: currentAddress || prevEdited?.currentAddress || "",
    ...(photoObj ? { photo: photoObj } : {}),
  };
};

/** one-call orchestrator: exchange -> userinfo -> decode -> patch */
export const populateInsureeFromAuthCode = async (dispatch, code, prevEdited) => {
  let accessToken = await exchangeCode(dispatch, code);
  // let accessToken = 'eyJraWQiOiJWdGVWZTJlYm5GU0Zua1hlRGpkRTAzd0RoZUhNelVFWWlHdjhzVmZ5VkZJIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIyNjg1MDM4MDE4NDUxOTQzNTQxMDExMTQ2MjQ5MzE5ODExNTAiLCJhdWQiOiJjclhZSVlnMmNKaU5UYXc1dC1wZW9QekNSby0zSkFUTmZCZDVBODZVOHQwIiwiaXNzIjoiaHR0cHM6XC9cL2VzaWduZXQuaWRhLmZheWRhLmV0XC92MVwvZXNpZ25ldCIsImV4cCI6MTc1OTYxMTU2MiwiaWF0IjoxNzU5NjA3OTYyLCJjbGllbnRfaWQiOiJjclhZSVlnMmNKaU5UYXc1dC1wZW9QekNSby0zSkFUTmZCZDVBODZVOHQwIn0.Ar-SOIylNqNCkzC45MCLihD2xSEiorNJuNBZ9QCUorYPy_sRcQSDmuOIFC_e2VA3EMpqsJVbDv5XNk8vMy4jOf7c_KV0SQR551paMwsGRSACaTJANx6buj10cwGkrBynBuUDLgcP-Ek3FudEQ0t47lmjlWvozsLdICvgMks5DlzjL0S0WayQQ2hTHgFOohoR9QeLq7b-DH_H8q7Qc_eVfZA2oXpuGoPK_TNZ1VWoBdLeM1sZVXBI8vgmczjFN68OepilTjsN0EL56WjmszCYNxOBxlEJK8rN2eSG2x7EXxq_bEtKkoVpkZzKiZhzt75NQjIG5UnraOEc5XQg_noifA'
  const raw = await fetchUserInfoRaw(dispatch, accessToken);
  const decoded = decodeJwtNoVerify(raw);
  const patch = await mapUserInfoToInsuree(decoded, prevEdited);
  return { patch, accessToken, raw, decoded };
};


export const generateSignInUrl = (insureeUuid) => {
  const {
      REACT_APP_CLIENT_ID,
      REACT_APP_REDIRECT_URI,
      REACT_APP_AUTHORIZATION_ENDPOINT,
    } = process.env;

    const stateParam = [insureeUuid].filter(Boolean).join(":");

  
    const params = new URLSearchParams({
        client_id: REACT_APP_CLIENT_ID || "",
        redirect_uri: REACT_APP_REDIRECT_URI || "",
        response_type: "code",
        scope: "openid profile email",
        acr_values:
          "mosip:idp:acr:generated-code mosip:idp:acr:linked-wallet mosip:idp:acr:biometrics",
        claims:
          '{"userinfo":{"name":{"essential":true},"phone":{"essential":true},"email":{"essential":true},"picture":{"essential":true},"gender":{"essential":true},"birthdate":{"essential":true},"address":{"essential":true}},"id_token":{}}',
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        code_challenge_method: "S256",
        display: "page",
        nonce: "g4DEuje5Fx57Vb64dO4oqLHXGT8L8G7g",
        state: stateParam,         
        ui_locales: "en",
      });
      const callbackURL = 'http://localhost:80/callback'
      // return `${REACT_APP_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
      return `https://esignet-mosipid.collab.mosip.net/authorize?state=${insureeUuid}&client_id=XHGC5-w2KLmDue239hUh42c3iZPyX5ISvVAk6ipFTjM&redirect_uri=${callbackURL}&scope=openid%20profile&response_type=code&claims_locales=en&display=page&prompt=consent&ui_locales=en`
    };
  
    export const handleVerifyInsuree = async (insureeUuid) => {
      const url = generateSignInUrl(insureeUuid);
    
      // Try to open in a new tab/window (cannot force Incognito)
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win && typeof win.focus === "function") {
        win.focus();
        // Optional: show a small toast in your app UI:
        // toast.info("For more privacy, consider opening this link in an Incognito/Private window.");
        return;
      }
    
      // Popup blocked: fall back to copying the URL and guiding the user
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          alert(
            "Your browser blocked the popup. The verification link has been copied to your clipboard.\n" +
            "Open an Incognito/Private window and paste the link to continue."
          );
        } else {
          // Last resort: show the URL to manually copy
          prompt(
            "Your browser blocked the popup. Copy this URL, then open an Incognito/Private window and paste it:",
            url
          );
        }
      } catch {
        prompt(
          "Your browser blocked the popup. Copy this URL, then open an Incognito/Private window and paste it:",
          url
        );
      }
    };
    
