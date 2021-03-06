import {addTabIndentSupport} from './editor/indent';
import {addUndoSupport} from './editor/undo';
import {defaultOptions, Options} from './options';
import {runTyper} from './typer';

type State = {
  content?: string,
  maxIterations?: number,
  autoRun?: boolean,
};

const defaultState: State = {
  content: `
function f(x, opts) {
  return opts && opts.mult ? x * 2 : x / 2;
}

function addProp(o) {
  Object.defineProperty(o, 'x' {
    value: 1,
    writable: true
  });
}
    `.trim(),
  maxIterations: defaultOptions.maxIterations,
  autoRun: true,
};

function readStateFromFragment(): State {
  if (location.hash.length > 0) {
    try {
      return <State>JSON.parse(decodeURIComponent(location.hash.substring(1)));
    } catch (_) {
    }
  }
  return defaultState;
}

function saveStateToFragment(state: State) {
  location.hash = '#' + encodeURIComponent(JSON.stringify(state));
}

window.addEventListener('load', () => {
  const jsInput = <HTMLTextAreaElement>document.getElementById('input');
  const tsOutput = <HTMLTextAreaElement>document.getElementById('output');
  const button = <HTMLButtonElement>document.getElementById('run');
  const autoRunCheckBox = <HTMLInputElement>document.getElementById('autorun');
  const stats = <HTMLTextAreaElement>document.getElementById('stats');
  const maxIterations =
      <HTMLInputElement>document.getElementById('maxIterations');

  const initialState = readStateFromFragment();

  jsInput.value = 'content' in initialState ? initialState.content! : '';
  jsInput.addEventListener('input', () => {
    saveState();
    autoRun();
  });

  maxIterations.value = String(
      'maxIterations' in initialState ? initialState.maxIterations! :
                                        defaultState.maxIterations);
  maxIterations.addEventListener('input', () => {
    saveState();
    autoRun();
  });

  autoRunCheckBox.checked =
      'autoRun' in initialState ? initialState.autoRun! : true;
  autoRunCheckBox.addEventListener('change', () => {
    saveState();
    autoRun();
    updateRunVisibility();
  });

  const manager = addUndoSupport(jsInput, autoRun);
  addTabIndentSupport(jsInput, (c) => {
    manager.content = c;
    autoRun();
  });

  updateRunVisibility();
  autoRun();

  function saveState() {
    saveStateToFragment({
      content: jsInput.value,
      maxIterations: getMaxIterations(),
      autoRun: autoRunCheckBox.checked
    });
  }
  function autoRun() {
    if (autoRunCheckBox.checked) run();
  }
  function updateRunVisibility() {
    button.disabled = autoRunCheckBox.checked;
  }
  function getMaxIterations() {
    return Number.parseInt(maxIterations.value);
  }

  function run() {
    stats.textContent = `Analyzing...`;
    const start = new Date().getTime();

    const options = <Options>{
      ...defaultOptions,
      debugPasses: true,
      // differentiateComputedProperties: true,
      maxIterations: getMaxIterations()
    };

    const inputFileName = 'file.js';
    const inputs = {
      [inputFileName]: jsInput.value,
      // 'bar.js': `
      //   // export class Bar {}
      //   // export function takeBar(x) {}
      //   export default {
      //     a: a,
      //     b: function(x) {},
      //     c: 1
      //   }
      //   function a(x: {readonly y: {z(): void}}): void {
      //     x.y.z();
      //   }
      // `
    }
    const {files, metadata} = runTyper(inputs, options)
    let output = '';
    for (const fileName in files) {
      if (fileName != inputFileName) {
        output += `${files[fileName]}\n`;
      }
    }
    output += files[inputFileName];
    tsOutput.value = output;
    const time = new Date().getTime() - start;
    stats.textContent = `Execution time (${metadata.inferencePasses
                        } passes): ${time} milliseconds`;
  }
  button.onclick = run;
});
