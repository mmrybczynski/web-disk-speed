const DB_NAME = "DiskSpeedTestDB";
const STORE_NAME = "test_store";

let db;
let chart;

//DB init
const initDB = () => {
    return new Promise((resolve,reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if(!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve();
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

//Clear database
const clearStore = () => {
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME],'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
    });
};

//Generate data in RAM
const generateData = (sizeInMb) => {
    const buffer = new ArrayBuffer(sizeInMb * 1024 * 1024);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length ; i++) {
        view[i] = Math.floor(Math.random() * 256);
    }
    return new Blob9[view], {type: 'application/octet-stream'});
};