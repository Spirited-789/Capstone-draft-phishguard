// The URL of the blocklist for general threats
const BLOCKLIST_URL = 'https://urlhaus.abuse.ch/downloads/hostfile/';
const LOCAL_RULES_URL = chrome.runtime.getURL('rules.json');

// --- Function to Fetch, Parse, and Install All Blocklists ---
async function updateBlocklist() {
  console.log('Phishguard: Starting blocklist update...');
  let newRules = [];
  let severityMap = {};
  let ruleId = 1;

  try {
    // 1. FETCH and PARSE local, categorized rules (malicious, suspicious, etc.)
    const localRulesResponse = await fetch(LOCAL_RULES_URL);
    const localRules = await localRulesResponse.json();

    for (const severity in localRules) {
      for (const domain of localRules[severity]) {
        newRules.push({
          id: ruleId++,
          priority: 2, // Higher priority for specific, local rules
          action: { type: 'block' },
          condition: {
            urlFilter: `||${domain}^`,
            resourceTypes: ['main_frame']
          }
        });
        severityMap[domain] = severity;
      }
    }
    console.log(`Phishguard: Parsed ${Object.keys(severityMap).length} local rules.`);

    // 2. FETCH and PARSE the general blocklist from the remote URL
    const remoteListResponse = await fetch(BLOCKLIST_URL);
    if (!remoteListResponse.ok) {
      console.error('Phishguard: Failed to fetch remote blocklist.');
    } else {
      const text = await remoteListResponse.text();
      const lines = text.split('\n');
      let remoteCount = 0;

      for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        
        const domain = parts[1];
        
        // Add this rule ONLY if it's not already in our local list
        if (!severityMap[domain]) {
          newRules.push({
            id: ruleId++,
            priority: 1, // Lower priority for general rules
            action: { type: 'block' },
            condition: {
              urlFilter: `||${domain}^`,
              resourceTypes: ['main_frame']
            }
          });
          // Assign a default severity for the general list
          severityMap[domain] = 'suspicious';
          remoteCount++;
        }
      }
      console.log(`Phishguard: Parsed ${remoteCount} new domains from remote list.`);
    }

    // 3. STORE the combined severity map for the redirector to use
    await chrome.storage.local.set({ 'phishguard-severity-map': severityMap });

    // 4. LOAD the new rules into Chrome's blocking engine
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules
    });

    console.log('Phishguard: Blocklist update successful!');
    
  } catch (error) {
    console.error('Phishguard: Error updating blocklist:', error);
  }
}

// --- Event Listeners to Trigger the Update ---

chrome.runtime.onInstalled.addListener(() => {
  console.log('Phishguard: Extension installed.');
  updateBlocklist();
  
  chrome.alarms.create('updateBlocklistAlarm', {
    periodInMinutes: 1440 // 1 day
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBlocklistAlarm') {
    console.log('Phishguard: Daily alarm triggered. Updating blocklist.');
    updateBlocklist();
  }
});

// --- Event Listener to Handle the Redirect ---

chrome.webNavigation.onErrorOccurred.addListener(async (details) => {
  if (details.error === 'net::ERR_BLOCKED_BY_CLIENT') {
    const blockedUrl = details.url;
    const urlHost = new URL(blockedUrl).hostname.replace(/^www\./, '');
    
    // Retrieve the severity map from storage
    const { 'phishguard-severity-map': severityMap } = await chrome.storage.local.get('phishguard-severity-map');
    
    let severity = 'suspicious'; // Default severity

    // Find the most specific domain match in the map (e.g., sub.domain.com before domain.com)
    if (severityMap) {
      const domainParts = urlHost.split('.');
      for (let i = 0; i < domainParts.length; i++) {
        const subDomain = domainParts.slice(i).join('.');
        if (severityMap[subDomain]) {
          severity = severityMap[subDomain];
          break;
        }
      }
    }

    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    const redirectUrl = `${blockedPageUrl}?url=${encodeURIComponent(blockedUrl)}&severity=${severity}`;

    // Redirect the current tab to our custom blocked page with severity info
    chrome.tabs.update(details.tabId, { url: redirectUrl });
  }
}, {
  url: [{ schemes: ['http', 'https'] }]
});