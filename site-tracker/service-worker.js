let activeTab = null;
let activeStartTime = null;

function getTabUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function saveTime(activeTabId, durationMs) {
  const today = new Date().toISOString().slice(0, 10);
  chrome.storage.local.get([activeTabId], (result) => {
    const previousTime = result[activeTabId] || {};
    previousTime[today] = (previousTime[today] || 0) + durationMs;
    chrome.storage.local.set({ [activeTabId]: previousTime });
    // console.log("saved data");
  });
}

function startTracking(tab) {
  if (tab && tab.url && tab.active) {
    const tabUrl = getTabUrl(tab.url);
    if (tabUrl) {
      activeTab = tabUrl;
      activeStartTime = Date.now();
      // console.log("Started tracking Tab:", activeTab);
      // console.log("Started tracking Time:", activeStartTime);
    }
  }
}

function stopTracking() {
  if (activeTab && activeStartTime) {
    const timeSpent = Date.now() - activeStartTime;
    // console.log(timeSpent);
    saveTime(activeTab, timeSpent);
  }
  // console.log("Stopped tracking:", activeTab);
  activeTab = null;
  activeStartTime = null;
}

// Tab Changes
function handleTabChange(tab) {
  stopTracking();
  startTracking(tab);
}
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, handleTabChange);
});
chrome.tabs.onUpdated.addListener((changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    handleTabChange(tab);
  }
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  // console.log("windu id is " + windowId);
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        startTracking(tabs[0]);
      }
    });
  }
});
setInterval(() => {
  chrome.windows.getLastFocused({ populate: true }, (window) => {
    if (!window || !window.focused) {
      stopTracking(); // Chrome not focused
      return;
    }

    const activeTab = window.tabs.find((tab) => tab.active);
    if (activeTab) {
      handleTabChange(activeTab);
    }
  });
}, 5000); // every 5 seconds
