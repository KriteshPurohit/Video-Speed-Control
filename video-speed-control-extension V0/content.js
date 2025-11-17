chrome.storage.sync.get(null, (sites) => {
  const hostname = window.location.hostname;
  if (sites[hostname] === false) {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => video.playbackRate = 1.0);
  }
});