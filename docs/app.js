let pyodide = null;
let latestCsvText = null;

const logEl = document.getElementById("log");
const urlBox = document.getElementById("urlBox");
const runBtn = document.getElementById("runBtn");
const downloadBtn = document.getElementById("downloadBtn");

// 元スクリプトのURLを初期値に入れる
urlBox.value = "http://www1.river.go.jp/cgi-bin/DspWaterData.exe?KIND=6&ID=302111282214090&BGNDATE=20220801&ENDDATE=21001231&KAWABOU=NO";

function log(msg) {
  logEl.textContent += msg + "
";
}

async function initPyodide() {
  log("Pyodide 読み込み中...");
  pyodide = await loadPyodide();
  log("Pyodide OK");

  // 純Pythonで入るものを入れる（pandasは重いので今回は不使用）
  log("パッケージ導入中（micropip）...");
  await pyodide.loadPackage("micropip");
  await pyodide.runPythonAsync(`
import micropip
await micropip.install(["beautifulsoup4", "html5lib", "pyodide-http"])
  `);
  log("パッケージ OK");

  // fetch→requests互換を有効化
  await pyodide.runPythonAsync(`
import pyodide_http
pyodide_http.patch_all()
  `);
  log("HTTPパッチ OK（requestsがfetch経由になります）");
}

runBtn.onclick = async () => {
  try {
    runBtn.disabled = true;
    downloadBtn.disabled = true;
    latestCsvText = null;
    logEl.textContent = "";

    if (!pyodide) await initPyodide();

    const url = urlBox.value.trim();
    log("実行開始: " + url);

    // PythonへURLを渡して実行
    pyodide.globals.set("TARGET_URL", url);
    const pyCode = await (await fetch("./main.py")).text();
    const csvText = await pyodide.runPythonAsync(pyCode);

    latestCsvText = csvText;
    log("完了: CSV文字列を生成しました");
    downloadBtn.disabled = false;
  } catch (e) {
    log("エラー:
" + e);
  } finally {
    runBtn.disabled = false;
  }
};

downloadBtn.onclick = () => {
  if (!latestCsvText) return;

  const blob = new Blob([latestCsvText], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "output.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
};
