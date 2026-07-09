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
    return new Blob([view], {type: 'application/octet-stream'});
};

//Chart
const initChart = () => {
    const ctx = document.getElementById('speedChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Duzy plik (zapis)','Duzy plik (odczyt)', 'Maly plik (zapis)', 'Maly plik (odczyt)'],
            datasets: [{
                label: 'Predkosc MB/s',
                data: [0,0,0,0],
                backgroundColor: [
                    'rgba(46,204,113,0.7)',
                    'rgba(52,152,219,0.7)',
                    'rgba(155,89,182,0.7)',
                    'rgba(241,196,15,0.7)'
                ],
                borderColor: [
                    '#2ecc71', '#3498db', '#9b59b6', '#f1c40f'
                ],
                borderWidth: 1
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'MB/s' } }
            }
        }
    });
};

const runBenchmark = async () => {
    const startBtn = document.getElementById("startBtn");
    const status = document.getElementById('status');
    startBtn.disabled = true;

    status.innerText = 'Inicjalizacja';
    await initDB();
    await clearStore();
};

window.onload = () => {
    initChart();
    document.getElementById('startBtn').addEventListener('click', runBenchmark);
};