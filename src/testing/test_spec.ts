import * as fs from 'fs';

import {Options} from '../options';
import {TyperResult} from '../typer';
import {mapValues} from '../utils/maps';
import {pseudoJson} from '../utils/pseudo_json';
import {deindent} from '../utils/strings';

// const writeFile = promisify(fs.writeFile);

export interface TestSpec extends TyperResult {
  inputs: {[fileName: string]: string},
}

function deindentSpec(spec: TestSpec) {
  return spec && {
    inputs: mapValues(spec.inputs, deindent),
        outputs: mapValues(spec.outputs, deindent), metadata: spec.metadata
  }
}

export function readSpec(fileName: string) {
  const mod = <TestSpec>(module.require(fileName));
  const spec = mod['default'];
  const deindented = deindentSpec(spec);
  // console.warn('deindented');
  // console.warn(deindented);
  return deindented;
}

export async function writeSpec(fileName: string, spec: TestSpec) {
  spec = {...spec};
  const src = `// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.\n` +
      `//\n` +
      `// REGENERATE OUTPUTS AND METADATA WITH \`npm run update-specs\`.\n` +
      `\n` +
      `import {TestSpec} from '../../src/testing/test_spec';\n` +
      `\n` +
      `export default ${pseudoJson(spec)} as TestSpec\n`;

  await new Promise((resolve, reject) => {fs.writeFile(fileName, src, err => {
                      if (err)
                        reject(err);
                      else
                        resolve();
                    })});
}
