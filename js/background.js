// Open a connection to the IndexedDB database
const dbName = "myDatabase";
const dbVersion = 1;
const request = indexedDB.open(dbName, dbVersion);
// When the connection is established, create an object store
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  const objectStore = db.createObjectStore("imageStore", { keyPath: "id" });
}

request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction("imageStore", "readwrite");
  const objectStore = transaction.objectStore("imageStore");

  chrome.webRequest.onSendHeaders.addListener(async (details) => {
    let url = details.url;
    if (url.includes('?')) url = url.split('?')[0];
    console.log(url);

    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    // await fetch(url, requestOptions)
    // .then(response => response.blob())
    // .then(imageBlob => {
    //   // Create a record for the image in the object store
    //   const record = { id: url, data: imageBlob };
    //   const addRequest = objectStore.add(record);

    //   addRequest.onsuccess = function() {
    //     console.log("Image added to database");
    //   }
    // });
  },
  {
    types:["main_frame","sub_frame","stylesheet","script","image","font","object","xmlhttprequest","ping","csp_report","media","websocket","other"]
    ,urls:["https://media.discordapp.net/attachments/*"]
  })
  transaction.oncomplete = function() {
    console.log("Transaction completed");
  }
}






let lifeline;

keepAlive();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); // 5 minutes minus 5 seconds
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: 'keepAlive' }),
        // `function` will become `func` in Chrome 93+
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}