// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      function f(x, y) {
        console.log(x, y);
        var z = x.call(1, 2);
        y.foo();
        g(z);
        g(x.memberOfX);
        y(1, 2, 3);
      }
      
      function g(x) {
        return x * 2;
      }
          
          
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
      function f(x: {call(arg1: number, arg2: number): number, readonly memberOfX: number}, y: {(arg1: number, arg2: number, arg3: number): void, foo(): void}): void {
        console.log(x, y);
        var z: number = x.call(1, 2);
        y.foo();
        g(z);
        g(x.memberOfX);
        y(1, 2, 3);
      }
      
      function g(x: number): number {
        return x * 2;
      }
          
          
    `
    },
    metadata: {
      inferencePasses: 4
    }
  }
} as TestSpec
