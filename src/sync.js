// ==========================================================
// THE SYSTEM // CLOUD SYNC ENGINE (Supabase & Firebase)
// Enables real-time sync across Phone, Laptop, and Web
// ==========================================================

const SYNC_CONFIG_KEY = 'the_system_cloud_config';
let debounceTimer = null;
let syncStatusListeners = [];

export function getCloudConfig() {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      provider: parsed.provider || 'supabase', // 'supabase' or 'firebase'
      supabaseUrl: parsed.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: parsed.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      firebaseProjectId: parsed.firebaseProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      firebaseApiKey: parsed.firebaseApiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
      syncUserId: parsed.syncUserId || 'suhas_s',
      autoSync: parsed.autoSync !== false,
      lastSyncedAt: parsed.lastSyncedAt || null
    };
  } catch (e) {
    return {
      provider: 'supabase',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      syncUserId: 'suhas_s',
      autoSync: true,
      lastSyncedAt: null
    };
  }
}

export function saveCloudConfig(config) {
  try {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
    notifyStatus(isCloudConfigured() ? 'ready' : 'unconfigured', 'Cloud configuration saved');
  } catch (e) {
    console.error('Failed to save cloud config:', e);
  }
}

export function isCloudConfigured() {
  const cfg = getCloudConfig();
  if (cfg.provider === 'supabase') {
    return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  } else if (cfg.provider === 'firebase') {
    return Boolean(cfg.firebaseProjectId);
  }
  return false;
}

export function onSyncStatusChange(callback) {
  syncStatusListeners.push(callback);
}

function notifyStatus(status, message = '', timestamp = null) {
  syncStatusListeners.forEach(cb => {
    try {
      cb({ status, message, timestamp: timestamp || Date.now() });
    } catch (err) {
      console.error('Error in sync listener:', err);
    }
  });
}

// ==========================================
// SUPABASE REST SYNC
// ==========================================
async function pushToSupabase(cfg, state) {
  const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/user_state`;
  const recordId = cfg.syncUserId || 'suhas_s';
  const timestamp = new Date().toISOString();

  // Add metadata for conflict resolution
  const payload = {
    id: recordId,
    data: state,
    updated_at: timestamp
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': cfg.supabaseAnonKey,
      'Authorization': `Bearer ${cfg.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase push failed (${response.status}): ${errorText}`);
  }

  cfg.lastSyncedAt = Date.now();
  saveCloudConfig(cfg);
  return { success: true, timestamp };
}

async function fetchFromSupabase(cfg) {
  const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, '');
  const recordId = encodeURIComponent(cfg.syncUserId || 'suhas_s');
  const endpoint = `${cleanUrl}/rest/v1/user_state?id=eq.${recordId}&select=*`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey': cfg.supabaseAnonKey,
      'Authorization': `Bearer ${cfg.supabaseAnonKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase pull failed (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
    return {
      state: rows[0].data,
      updated_at: rows[0].updated_at
    };
  }
  return null;
}

// ==========================================
// FIREBASE FIRESTORE REST SYNC
// ==========================================
async function pushToFirebase(cfg, state) {
  const projectId = cfg.firebaseProjectId;
  const docId = cfg.syncUserId || 'suhas_s';
  const apiKeyParam = cfg.firebaseApiKey ? `?key=${cfg.firebaseApiKey}` : '';
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_state/${docId}${apiKeyParam}`;

  const payload = {
    fields: {
      dataJson: { stringValue: JSON.stringify(state) },
      updatedAt: { stringValue: new Date().toISOString() }
    }
  };

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firebase push failed (${response.status}): ${errorText}`);
  }

  cfg.lastSyncedAt = Date.now();
  saveCloudConfig(cfg);
  return { success: true, timestamp: Date.now() };
}

async function fetchFromFirebase(cfg) {
  const projectId = cfg.firebaseProjectId;
  const docId = cfg.syncUserId || 'suhas_s';
  const apiKeyParam = cfg.firebaseApiKey ? `?key=${cfg.firebaseApiKey}` : '';
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_state/${docId}${apiKeyParam}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firebase pull failed (${response.status}): ${errorText}`);
  }

  const doc = await response.json();
  if (doc.fields && doc.fields.dataJson && doc.fields.dataJson.stringValue) {
    return {
      state: JSON.parse(doc.fields.dataJson.stringValue),
      updated_at: doc.fields.updatedAt ? doc.fields.updatedAt.stringValue : null
    };
  }
  return null;
}

// ==========================================
// HIGH-LEVEL SYNC DISPATCHER
// ==========================================

export async function testCloudConnection(customConfig = null) {
  const cfg = customConfig || getCloudConfig();
  try {
    notifyStatus('syncing', 'Testing cloud connection...');
    if (cfg.provider === 'supabase') {
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        throw new Error('Supabase URL and Anon Key are required');
      }
      await fetchFromSupabase(cfg);
    } else {
      if (!cfg.firebaseProjectId) {
        throw new Error('Firebase Project ID is required');
      }
      await fetchFromFirebase(cfg);
    }
    notifyStatus('synced', 'Connection successful!');
    return { success: true };
  } catch (err) {
    notifyStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

export async function pushStateToCloud(state) {
  const cfg = getCloudConfig();
  if (!isCloudConfigured()) return { success: false, message: 'Cloud sync not configured' };

  try {
    notifyStatus('syncing', 'Uploading latest data to cloud...');
    let res;
    if (cfg.provider === 'supabase') {
      res = await pushToSupabase(cfg, state);
    } else {
      res = await pushToFirebase(cfg, state);
    }
    notifyStatus('synced', 'All progress securely backed up to cloud', Date.now());
    return res;
  } catch (err) {
    console.error('Cloud Push Error:', err);
    notifyStatus('error', `Cloud backup error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export async function pullStateFromCloud() {
  const cfg = getCloudConfig();
  if (!isCloudConfigured()) return null;

  try {
    notifyStatus('syncing', 'Checking cloud for updates...');
    let res;
    if (cfg.provider === 'supabase') {
      res = await fetchFromSupabase(cfg);
    } else {
      res = await fetchFromFirebase(cfg);
    }

    if (res && res.state) {
      cfg.lastSyncedAt = Date.now();
      saveCloudConfig(cfg);
      notifyStatus('synced', 'Synced with cloud', Date.now());
      return res.state;
    } else {
      notifyStatus('synced', 'Cloud is connected (no remote record yet)', Date.now());
      return null;
    }
  } catch (err) {
    console.error('Cloud Pull Error:', err);
    notifyStatus('error', `Cloud fetch error: ${err.message}`);
    return null;
  }
}

/**
 * Debounced push to cloud whenever local state changes.
 * Avoids sending rapid requests while user is checking multiple boxes or typing in diary.
 */
export function queueCloudSync(state) {
  const cfg = getCloudConfig();
  if (!isCloudConfigured() || !cfg.autoSync) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  notifyStatus('syncing', 'Pending cloud sync...');
  debounceTimer = setTimeout(() => {
    pushStateToCloud(state);
  }, 2500);
}
