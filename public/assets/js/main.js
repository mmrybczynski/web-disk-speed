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

    const largeSampleSizeMB = 500;
    const smallSampleCount = 400;
    const smallSampleSizeKB = 64;
    const totalSmallSizeMB = (smallSampleCount * smallSampleSizeKB) / 1024;

    status.innerText = "Generowanie duzego pliku";
    const largeBlob = generateData(largeSampleSizeMB);

    status.innerText = "Test zapisu duzego pliku";
    let startTime = performance.now();
    await new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const req = tx.objectStore(STORE_NAME).get('large_file');
        req.onsuccess = () => {
            const dummy = req.result;
            resolve();
        };
    });
    let endTime = performance.now();
    const largeWriteSpeed = largeSampleSizeMB / ((endTime - startTime) / 1000);
    chart.data.datasets[0].data[0] = largeWriteSpeed.toFixed(2);
    chart.update();

    status.innerText = "Test odczytu duzego pliku";
    startTime = performance.now();
    await new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const req = tx.objectStore(STORE_NAME).get('large_file');
        req.onsuccess = () => {
            const dummy = req.result;
            resolve();
        };
    });
    endTime = performance.now();
    const largeReadSpeed = largeSampleSizeMB / ((endTime - startTime) / 1000);
    chart.data.datasets[0].data[1] = largeReadSpeed.toFixed(2);
    chart.update();

    await clearStore();

    status.innerText = "Generowanie małych paczek danych...";
    const smallBlobs = [];
    for(let i=0; i<smallSampleCount; i++) {
        smallBlobs.push(generateData(smallSampleSizeKB / 1024));
    }

    status.innerText = "Testowanie zapisu małych plików...";
    startTime = performance.now();
    await new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for(let i=0; i<smallSampleCount; i++) {
            store.put(smallBlobs[i], `small_${i}`);
        }
        tx.oncomplete = () => resolve();
    });
    endTime = performance.now();
    const smallWriteSpeed = totalSmallSizeMB / ((endTime - startTime) / 1000);
    chart.data.datasets[0].data[2] = smallWriteSpeed.toFixed(2);
    chart.update();

    status.innerText = "Testowanie odczytu małych plików...";
    startTime = performance.now();
    await new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        let count = 0;
        for(let i=0; i<smallSampleCount; i++) {
            const req = store.get(`small_${i}`);
            req.onsuccess = () => {
                count++;
                if(count === smallSampleCount) resolve();
            };
        }
    });
    endTime = performance.now();
    const smallReadSpeed = totalSmallSizeMB / ((endTime - startTime) / 1000);
    chart.data.datasets[0].data[3] = smallReadSpeed.toFixed(2);
    chart.update();

    // Czyszczenie na koniec
    status.innerText = "Czyszczenie pamięci podręcznej...";
    await clearStore();
    
    status.innerText = "Test zakończony!";
    startBtn.disabled = false;
};

window.onload = () => {
    initChart();
    document.getElementById('startBtn').addEventListener('click', runBenchmark);
};