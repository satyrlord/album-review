declare module "vite-plugin-istanbul" {
  import type { GeneratorOptions } from "@babel/generator";
  import type { Plugin } from "vite";

  export interface IstanbulPluginOptions {
    include?: string | string[];
    exclude?: string | string[];
    extension?: string | string[];
    requireEnv?: boolean;
    cypress?: boolean;
    checkProd?: boolean;
    forceBuildInstrument?: boolean;
    cwd?: string;
    nycrcPath?: string;
    generatorOpts?: GeneratorOptions;
    onCover?: (fileName: string, fileCoverage: object) => void;
  }

  const vitePluginIstanbul: (options?: IstanbulPluginOptions) => Plugin;

  export default vitePluginIstanbul;
}