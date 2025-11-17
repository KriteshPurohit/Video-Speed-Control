const increaseBtn = document.getElementById('increase');
const decreaseBtn = document.getElementById('decrease');
const rewindBtn = document.getElementById('rewind');
const advanceBtn = document.getElementById('advance');
const currentSpeed = document.getElementById('currentSpeed');
const enabledCheckbox = document.getElementById('enabled');
const toggleStatus = document.getElementById('toggleStatus');

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function updateToggleText(enabled) {
  toggleStatus.textContent = enabled ? 'On' : 'Off';
}

async function updateSpeed(change) {
  const tab = await getActiveTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (delta) => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.playbackRate = Math.max(0.1, Math.min(16, video.playbackRate + delta));
      });
      return videos[0]?.playbackRate || 1.0;
    },
    args: [change]
  }, (results) => {
    if (results && results[0].result) {
      currentSpeed.textContent = results[0].result.toFixed(2);
    }
  });
}

async function seekVideo(seconds) {
  const tab = await getActiveTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (offset) => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.currentTime = Math.max(0, video.currentTime + offset);
      });
    },
    args: [seconds]
  });
}

// Button listeners
increaseBtn.addEventListener('click', () => updateSpeed(0.1));
decreaseBtn.addEventListener('click', () => updateSpeed(-0.1));
rewindBtn.addEventListener('click', () => seekVideo(-10));    // Rewind 10 seconds
advanceBtn.addEventListener('click', () => seekVideo(10));    // Advance 10 seconds

enabledCheckbox.addEventListener('change', async () => {
  const tab = await getActiveTab();
  const hostname = new URL(tab.url).hostname;
  const enabled = enabledCheckbox.checked;
  chrome.storage.sync.set({ [hostname]: enabled });
  updateToggleText(enabled);
  if (!enabled) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => video.playbackRate = 1.0);
      }
    });
  }
});

// Initialize toggle state
(async () => {
  const tab = await getActiveTab();
  const hostname = new URL(tab.url).hostname;
  chrome.storage.sync.get([hostname], (result) => {
    const enabled = result[hostname] ?? true;
    enabledCheckbox.checked = enabled;
    updateToggleText(enabled);
  });
})();
