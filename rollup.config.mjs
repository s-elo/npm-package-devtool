import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    commonjs({ defaultIsModuleExports: true }),
    json(),
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
  ],
};
