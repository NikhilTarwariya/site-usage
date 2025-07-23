function Time(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

function loadStats() {
  chrome.storage.local.get(null, (data) => {
    const today = new Date().toISOString().slice(0, 10);
    const statsDiv = document.getElementById("stats");
    const totalDiv = document.getElementById("totaltime");
    statsDiv.innerHTML = "";

    let total = 0;
    const entries = [];

    for (const domain in data) {
      if (domain.startsWith("__")) continue;
      const t = data[domain]?.[today] || 0;
      if (t > 0) {
        total += t;
        entries.push([domain, t]);
      }
    }

    totalDiv.textContent = `Total today: ${Time(total)}`;

    entries
      .sort((a, b) => b[1] - a[1])
      .forEach(([d, t]) => {
        const div = document.createElement("div");
        div.innerHTML = `<span>${d}</span> ${Time(t)}`;
        statsDiv.appendChild(div);
      });

    if (entries.length === 0) {
      statsDiv.textContent = "No activity yet.";
    }
  });
}
//
document.getElementById("resetBtn").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);

  chrome.storage.local.get(null, (data) => {
    for (const domain in data) {
      if (data[domain]?.[today]) {
        delete data[domain][today];
        chrome.storage.local.set({ [domain]: data[domain] });
      }
    }

    setTimeout(loadStats, 200); // Give it a moment before reloading
  });
});

document.addEventListener("DOMContentLoaded", () => {
  //   loadStats();
  setInterval(loadStats, 1000);
});
