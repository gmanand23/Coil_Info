
let coilData = [];

document.getElementById('excelFile').addEventListener('change', (e) => {
  coilData = [];
  document.getElementById('result').innerHTML = '';
  document.getElementById('coilInput').value = '';
  document.getElementById('suggestions').style.display = 'none';
  document.getElementById('fileName').textContent = `Loaded File: ${e.target.files[0].name}`;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    coilData = XLSX.utils.sheet_to_json(sheet);
    alert('Excel loaded successfully!');
  };
  reader.readAsArrayBuffer(e.target.files[0]);
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
  const readerElement = document.getElementById("reader");
  readerElement.innerHTML = '';
  qrReader = new Html5Qrcode("reader");

  qrReader.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
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
