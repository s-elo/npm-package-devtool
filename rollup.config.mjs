import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
    resolve({
      preferBuiltins: true,
      browser: false,
      exportConditions: ['node'],
    }),
    commonjs(),
    json(),
  ],
};
