let worker: Worker;
type EngineFunc = (latex: string) => Promise<string>;
const callbacks: any = {};
let id = 0;
const TIMEOUT = 5000;

const initWorker = () => {
  worker = new Worker(new URL(`./webworker.js`, import.meta.url));
  worker.onmessage = (event) => {
    const { id, ...data } = event.data;
    callbacks[id](data);
    delete callbacks[id];
  };
};
initWorker();

const asyncRun = async (script: string) => {
  try {
    const { results, error } = (await new Promise((onSuccess) => {
      callbacks[++id] = onSuccess;
      worker.postMessage({ script, id });
      setTimeout(() => {
        if (callbacks[id]) {
          delete callbacks[id];
          worker.terminate();
          console.log("worker terminated");
          initWorker();
        }
      }, TIMEOUT);
    })) as any;
    if (results) return results;
    else if (error) console.log("error: ", error);
  } catch (e: any) {
    console.log(`Pyodide Err ${e.filename}, Line: ${e.lineno}, ${e.message}`);
  }
};
export module Pyodide {
  export const collect: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex(${latex}, mat_delim="(")`;
    return await asyncRun(script);
  };

  export const trigExpand: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex((${latex}).expand(trig=True), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const det: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex((${latex}).det(), mat_delim="(")`;
    return await asyncRun(script);
  };
  export const solve: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex(solve(${latex},dict=True), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const eigen: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex((${latex}).eigenvals(), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const simplify: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex(simplify(${latex}), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const factor: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex(factor(${latex}), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const expand: EngineFunc = async (latex) => {
    const script = `
      from sympy import * 
      latex((${latex}).expand(), mat_delim="(")`;
    return await asyncRun(script);
  };

  export const mock: EngineFunc = async () => {
    const { result } = await new Promise<{ result: string }>((resolve) => {
      callbacks[++id] = resolve;
      worker.postMessage({ id, test: true });
    });
    return result;
  };
}
