importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js");

async function loadPyodideAndPackages() {
  console.log = () => undefined;
  self.pyodide = await loadPyodide();
  await self.pyodide.loadPackage(["sympy"]);
  await self.pyodide.runPythonAsync("from sympy import *");
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, script, test } = event.data;
  if (test) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    self.postMessage({ id, result: "s" });
    return;
  }
  try {
    let results = await self.pyodide.runPythonAsync(script);
    self.postMessage({ results, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};
