const pyodideWorker = new Worker(new URL(`./webworker.js`, import.meta.url));
const callbacks: any = {};

pyodideWorker.onmessage = (event) => {
  const { id, ...data } = event.data;
  const onSuccess = callbacks[id];
  delete callbacks[id];
  onSuccess(data);
};

const asyncRun = async (script: string) => {
  let id = 0;
  const asyncFunc = () => {
    id++;
    return new Promise((onSuccess) => {
      callbacks[id] = onSuccess;
      pyodideWorker.postMessage({ script, id });
    });
  };
  try {
    const { results, error } = (await asyncFunc()) as any;
    if (results) return results;
    else if (error) console.log("error: ", error);
  } catch (e: any) {
    console.log(
      `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
    );
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
}

type EngineFunc = (latex: string) => Promise<string>;
