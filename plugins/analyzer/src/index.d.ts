import type { Plugin } from 'vite';

export interface AnalyzerOptions {
  reportFile?: string;
  html?: boolean;
  htmlFile?: string;
  maxSize?: number;
}

export interface BundleReportEntry {
  file: string;
  type: string;
  size: number;
  imports?: string[];
  dynamicImports?: string[];
  modules?: string[];
}

export interface BundleReport {
  version: 1;
  generatedAt: string;
  totalSize: number;
  files: BundleReportEntry[];
}

export function analyzer(options?: AnalyzerOptions): Plugin;
export function createReport(entries: BundleReportEntry[]): BundleReport;
export function install(config: object, options?: AnalyzerOptions): object;
export default analyzer;
