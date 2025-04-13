import type {
  ESLintConstructorOptions,
  ESLintInstance,
  ESLintOutputFixes,
  ESLintPluginOptions,
} from '../types'

/**
 * Filters ESLint options to only include those supported by ESLint constructor
 */
export function getESLintConstructorOptions(options: ESLintPluginOptions): ESLintConstructorOptions {
  const excludedKeys = [
    'test',
    'dev',
    'build',
    'include',
    'exclude',
    'eslintPath',
    'formatter',
    'lintInWorker',
    'lintOnStart',
    'lintDirtyOnly',
    'emitError',
    'emitErrorAsWarning',
    'emitWarning',
    'emitWarningAsError',
  ]

  return {
    ...Object.fromEntries(
      Object.entries(options).filter(
        ([key]) => !excludedKeys.includes(key),
      ),
    ),
    errorOnUnmatchedPattern: false,
  }
}

/**
 * Initialize ESLint instance with provided options
 */
export async function initializeESLint(options: ESLintPluginOptions) {
  const { formatter } = options
  try {
    const module = await import(String('eslint')).then(d => d.default || d)
    const ESLintClass = module.loadESLint
      ? await module.loadESLint({ useFlatConfig: true })
      : module.ESLint || module.FlatESLint || module.LegacyESLint

    const eslintInstance = new ESLintClass(
      getESLintConstructorOptions(options),
    ) as ESLintInstance

    const loadedFormatter = await eslintInstance.loadFormatter(formatter)
    const outputFixes = ESLintClass.outputFixes.bind(
      ESLintClass,
    ) as ESLintOutputFixes

    return {
      eslintInstance,
      formatter: loadedFormatter,
      outputFixes,
    }
  }
  catch (error) {
    throw new Error(
      `Failed to initialize ESLint. Have you installed and configured correctly? ${error}`,
    )
  }
}
