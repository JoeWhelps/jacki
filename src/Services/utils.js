import Parse from 'parse';

let serverReady = false;

export const dateFormatter = (date) => {
    if (!date) return null;
    const dateObj = new Date(date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}mo`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    if (seconds > 0) return `${seconds}s`;
    return "Just now";
};

// sanitizes the header value for security reasons
export const sanitizeHeaderValue = (value) => {
    if (!value) return '';
    // This is a basic sanitizer, you may need to adjust it based on your specific needs
    return String(value).replace(/[^a-zA-Z0-9_:\/\.\-\s]/g, '');
};

// Check just to see if the database is actually connected.- sanity check
export async function connectivityCheck() {
  if (!Parse || !Parse.serverURL) {
    console.warn('connectivityCheck: Parse not initialized');
    return null;
  }
  const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
  const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
  const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
  const url = server.replace(/\/$/, '') + '/classes/Post';
  const headers = new Headers();
  headers.append('X-Parse-Application-Id', appId);
  if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
  headers.append('Content-Type', 'application/json');

  console.debug('connectivityCheck: issuing fetch to', url, 'with headers', { appId, jsKey });
  try {
    const res = await fetch(url, { method: 'GET', headers });
    console.debug('connectivityCheck: response status=', res.status);
    const body = await res.text();
    console.debug('connectivityCheck: response body=', body.slice(0,1000));
    return { status: res.status, body };
  } catch (err) {
    console.error('connectivityCheck error:', err);
    throw err;
  }
}

// This will ensure that the server is ready to accept requests before we try to do anything
export const ensureServerReady = async () => {
    if(serverReady) return;
    let attempts = 0;
    while (attempts < 10) {
        try {
            const { status, body } = await connectivityCheck();
            if (status === 200) {
                serverReady = true;
                return;
            }
            if (body.includes("Invalid server state: starting")) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
                attempts++;
            } else {
                return;
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
            attempts++;
        }
    }
};