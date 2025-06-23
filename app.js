let coilData = [];
let loadedFileName = '';

const GITHUB_EXCEL_URL = 'https://raw.githubusercontent.com/gmanand23/Coil_Info/main/coil-data.xlsx?' + new Date().getTime();

function resetApp() {
  try {
    localStorage.removeItem('coilData');
    localStorage.removeItem('loadedFileName');
    localStorage.setItem('forceReload', 'true'); // ✅ Trigger reload
    alert('App data cleared. Reloading from GitHub...');
    window.location.href = window.location.href; // ✅ Reload that works in APK
  } catch (e) {
    console.error('Reset failed:', e);
    alert('Failed to reset. Check console.');
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem('coilData');
    localStorage.removeItem('loadedFileName');
    alert('Local Excel data cleared.');
    fetchAndLoadExcelFromUrl(GITHUB_EXCEL_URL);
  } catch (e) {
    console.error('Error clearing local storage:', e);
    alert('Failed to clear local storage.');
  }
}

async function fetchAndLoadExcelFromUrl(url) {
  const downloadButton = document.querySelector('button[onclick="downloadExcel()"]');
  if (downloadButton) {
    downloadButton.disabled = true;
    downloadButton.textContent = 'Loading Data...';
  }

  try {
    document.getElementById('fileName').textContent = `Loading data from GitHub...`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    coilData = XLSX.utils.sheet_to_json(sheet);

    const urlParts = url.split('/');
    loadedFileName = urlParts[urlParts.length - 1].split('?')[0] || 'coil-data.xlsx';

    localStorage.setItem('coilData', JSON.stringify(coilData));
    localStorage.setItem('loadedFileName', loadedFileName);

    document.getElementById('fileName').textContent = `Loaded File (from GitHub): ${loadedFileName}`;
    alert('Excel loaded successfully from GitHub!');

    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = 'Download Loaded Excel';
    }

  } catch (error) {
    console.error('Error loading Excel from URL:', error);
    document.getElementById('fileName').textContent = `Failed to load from GitHub.`;
    alert('Failed to load Excel from GitHub.');
    coilData = [];
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.textContent = 'Failed to Load Data';
    }
  }
}

document.getElementById('excelFile').addEventListener('change', (e) => {
  coilData = [];
  document.getElementById('result').innerHTML = '';
  document.getElementById('coilInput').value = '';
  document.getElementById('suggestions').style.display = 'none';

  const downloadButton = document.querySelector('button[onclick="downloadExcel()"]');
  if (downloadButton) {
    downloadButton.disabled = true;
    downloadButton.textContent = 'Loading Local File...';
  }

  const file = e.target.files[0];
  if (file) {
    loadedFileName = file.name;
    document.getElementById('fileName').textContent = `Loaded File (from local upload): ${loadedFileName}`;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      coilData = XLSX.utils.sheet_to_json(sheet);

      localStorage.setItem('coilData', JSON.stringify(coilData));
      localStorage.setItem('loadedFileName', loadedFileName);

      alert('Excel loaded successfully from local file!');
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.textContent = 'Download Loaded Excel';
      }
    };
    reader.onerror = (evt) => {
      console.error('Error reading local file:', evt);
      alert('Error reading local Excel file.');
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.textContent = 'Failed to Load Data';
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.textContent = 'Download Loaded Excel';
    }
  }
});

function downloadExcel() {
  if (coilData.length === 0) {
    alert('No Excel data to download.');
    return;
  }

  if (!loadedFileName) {
    loadedFileName = 'downloaded_coil_data.xlsx';
  }

  const worksheet = XLSX.utils.json_to_sheet(coilData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Coil Data");
  XLSX.writeFile(workbook, loadedFileName);
}

document.addEventListener('DOMContentLoaded', async () => {
  const forceReload = localStorage.getItem('forceReload');
  if (forceReload === 'true') {
    localStorage.removeItem('forceReload'); // Clear the flag
    await fetchAndLoadExcelFromUrl(GITHUB_EXCEL_URL);
    return;
  }

  const cachedData = localStorage.getItem('coilData');
  const cachedFileName = localStorage.getItem('loadedFileName');

  if (cachedData && cachedFileName) {
    coilData = JSON.parse(cachedData);
    loadedFileName = cachedFileName;
    document.getElementById('fileName').textContent = `Loaded from Local Storage: ${loadedFileName}`;
  } else {
    await fetchAndLoadExcelFromUrl(GITHUB_EXCEL_URL);
  }
});

// Rest of your functions like searchCoil, displayResult, QR code, etc. stay the same
