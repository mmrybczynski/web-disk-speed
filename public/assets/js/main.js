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