import type * as ESLint from 'eslint'

/**
 * ESLint Plugin Options interface
 */
export interface ESLintPluginOptions extends ESLint.ESLint.Options {
  /**
   * Whether to enable the cache. This is disabled in ESLint by default and enabled in plugin by default to improve speed.
   * @default true
   */
  cache: boolean

  /**
   * Run ESLint under `test` mode.
   * @default false
   */
  test: boolean

  /**
   * Run ESLint under `serve` command.
   * @default true
   */
  dev: boolean

  /**
   * Run ESLint under `build` command.
   * @default false
   */
  build: boolean

  /**
   * Path to ESLint that will be used for linting.
   * @default "eslint"
   */
  eslintPath: string

  /**
   * The name or the path of a formatter.
   * @default "stylish"
   */
  formatter: string
}

/**
 * User-provided options (partial)
 */
export type ESLintPluginUserOptions = Partial<ESLintPluginOptions>

/**
 * ESLint component types
 */
export type ESLintInstance = ESLint.ESLint
export type ESLintConstructorOptions = ESLint.ESLint.Options
export type ESLintFormatter = ESLint.ESLint.Formatter
export type ESLintOutputFixes = typeof ESLint.ESLint.outputFixes
export type ESLintLintResult = ESLint.ESLint.LintResult
export type ESLintLintResults = ESLintLintResult[]

/**
 * Function signature for linting files
 */
export type LintFiles = (
  config: {
    files: string[]
    eslintInstance: ESLintInstance
    formatter: ESLintFormatter
    outputFixes: ESLintOutputFixes
    options: ESLintPluginOptions
  },
  context?: any,
) => Promise<any>

/**
 * Text types for colorizing output
 */
export type TextType = 'error' | 'warning' | 'plugin' | string

/**
 * Message structure for worker communication
 */
export interface WorkerLintMessage {
  type: 'lint'
  id?: string | number
  files: string | string[]
  options?: Partial<ESLintPluginOptions>
}

/**
 * Result message structure for worker communication
 */
export interface WorkerResultMessage {
  type: 'result'
  id?: string | number
  data: any
}

/**
 * Error message structure for worker communication
 */
export interface WorkerErrorMessage {
  type: 'error'
  id?: string | number
  error: string | { message: string, stack?: string }
}

/**
 * Ready message structure for worker communication
 */
export interface WorkerReadyMessage {
  type: 'ready'
}

/**
 * Worker message union type
 */
export type WorkerMessage =
  | WorkerLintMessage
  | WorkerResultMessage
  | WorkerErrorMessage
  | WorkerReadyMessage
