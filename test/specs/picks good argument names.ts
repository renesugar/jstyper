// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      function f8(x, y, z) {
        x.foo(y);
        x.bar(z.getBaz());
        x.bam(z['yay']);
        
        let count, superCount, megaCount;
        x.sum(superCount);
        x.sum(count);
        x.sum(megaCount);
      }
          
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
function f8(x: {bam(yay: any): void, bar(baz: any): void, foo(y: any): void, sum(count?: any): void}, y, z: {getBaz(): any, readonly yay: any}): void {
  x.foo(y);
  x.bar(z.getBaz());
  x.bam(z['yay']);

  let count, superCount, megaCount;
  x.sum(superCount);
  x.sum(count);
  x.sum(megaCount);
}

`
    },
    metadata: {
      inferencePasses: 2
    }
  }
} as TestSpec
