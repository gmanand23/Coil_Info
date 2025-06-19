let coilData = [];
let loadedFileName = ''; // Variable to store the loaded file name

// Define the raw GitHub URL for your Excel file
const GITHUB_EXCEL_URL = 'https://raw.githubusercontent.com/gmanand23/Coil_Info/main/coil-data.xlsx';

// Function to clear local storage
function clearLocalStorage() {
  try {
    localStorage.removeItem('coilData');
    localStorage.removeItem('loadedFileName');
    alert('Local storage cleared successfully!');
    console.log('Local storage cleared.');
  } catch (e) {
    console.error('Error clearing local storage:', e);
    alert('Failed to clear local storage. Check console for details.');
  }
}

// Function to fetch and parse Excel from URL
async function fetchAndLoadExcelFromUrl(url) {
  try {
    document.getElementById('fileName').textContent = `Loading data from GitHub...`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - Could not fetch Excel from GitHub.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    coilData = XLSX.utils.sheet_to_json(sheet);

    // Update loadedFileName based on the URL's last segment
    const urlParts = url.split('/');
    loadedFileName = urlParts[urlParts.length - 1] || 'coil-data.xlsx';

    document.getElementById('fileName').textContent = `Loaded File (from GitHub): ${loadedFileName}`;
    alert('Excel loaded successfully from GitHub!');
  } catch (error) {
    console.error('Error loading Excel from URL:', error);
    document.getElementById('fileName').textContent = `Failed to load from GitHub.`;
    alert('Failed to load Excel from GitHub. Check console for details.');
  }
}

// Event listener for local Excel file upload
document.getElementById('excelFile').addEventListener('change', (e) => {
  coilData = [];
  document.getElementById('result').innerHTML = '';
  document.getElementById('coilInput').value = '';
  document.getElementById('suggestions').style.display = 'none';

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
      alert('Excel loaded successfully from local file!');
    };
    reader.readAsArrayBuffer(file);
  }
});

// Function to download the loaded Excel file
function downloadExcel() {
  if (coilData.length === 0) {
    alert('No Excel data to download. Please ensure a file is loaded.');
    return;
  }

  if (!loadedFileName) {
    loadedFileName = 'downloaded_coil_data.xlsx'; // Fallback name
  }

  const worksheet = XLSX.utils.json_to_sheet(coilData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Coil Data");

  XLSX.writeFile(workbook, loadedFileName);
}

// Always attempt to fetch from GitHub on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndLoadExcelFromUrl(GITHUB_EXCEL_URL);
});

function searchCoil() {
  const coilNumber = document.getElementById('coilInput').value.trim().toUpperCase();
  const result = coilData.find(row => {
    const keys = Object.keys(row);
    const matchingKey = keys.find(k => k.trim().toUpperCase() === 'MILL COIL NO');
    if (!matchingKey) return false;
    const sheetCoil = String(row[matchingKey]).trim().toUpperCase();
    return sheetCoil === coilNumber;
  });
  displayResult(result);
}

function displayResult(data) {
  const resultDiv = document.getElementById('result');
  if (data) {
    let tableHTML = '<table style="font-family: Comic Sans MS, cursive, sans-serif; width:100%; border-collapse: collapse;">';
    tableHTML += '<thead><tr><th style="font-family: Comic Sans MS, cursive, sans-serif; border: 1px solid #fff; padding: 8px; color: white;">Field</th><th style="font-family: Comic Sans MS, cursive, sans-serif; border: 1px solid #fff; padding: 8px; color: white;">Value</th></tr></thead><tbody>';
    for (const [key, val] of Object.entries(data)) {
      tableHTML += `<tr><td style="font-family: Comic Sans MS, cursive, sans-serif; border: 1px solid #fff; padding: 8px; color: white;">${key.trim()}</td><td style="font-family: Comic Sans MS, cursive, sans-serif; border: 1px solid #fff; padding: 8px; color: white;">${val}</td></tr>`;
    }
    tableHTML += '</tbody></table>';
    resultDiv.innerHTML = tableHTML;
  } else {
    resultDiv.innerHTML = '<p>Coil number not found.</p>';
  }
}

let qrReader = null;

function startScanner() {
  if (qrReader) {
    closeScanner();
  }
  const readerDiv = document.getElementById("reader");
  readerDiv.innerHTML = '';

  qrReader = new Html5Qrcode("reader", { verbose: false });
  qrReader.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    (decodedText, decodedResult) => {
      document.getElementById('coilInput').value = decodedText;
      searchCoil();
      closeScanner();
    },
    (errorMessage) => {
      console.warn(`QR error: ${errorMessage}`);
    }
  );
}

function closeScanner() {
  if (qrReader) {
    qrReader.stop().then(() => {
      qrReader.clear();
      document.getElementById("reader").innerHTML = '';
      qrReader = null;
    }).catch(err => console.error("Error stopping scanner", err));
  }
}

function showSuggestions() {
  const input = document.getElementById('coilInput').value.trim().toUpperCase();
  const suggestionsDiv = document.getElementById('suggestions');
  suggestionsDiv.innerHTML = '';

  if (!input || coilData.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  const keys = Object.keys(coilData[0]);
  const matchingKey = keys.find(k => k.trim().toUpperCase() === 'MILL COIL NO');
  if (!matchingKey) return;

  const suggestions = coilData
    .map(row => String(row[matchingKey]).trim().toUpperCase())
    .filter(coil => coil.includes(input))
    .slice(0, 10);

  if (suggestions.length > 0) {
    suggestions.forEach(s => {
      const div = document.createElement('div');
      div.textContent = s;
      div.onclick = () => {
        document.getElementById('coilInput').value = s;
        suggestionsDiv.style.display = 'none';
        searchCoil();
      };
      suggestionsDiv.appendChild(div);
    });
    suggestionsDiv.style.display = 'block';
  } else {
    suggestionsDiv.style.display = 'none';
  }
}