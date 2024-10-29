import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import eslintParserTs from '@typescript-eslint/parser';

export default [
	{
		files: ['**/*.ts'],
		ignores: ['node_modules', 'dist', 'webpack.config.mjs'],
		languageOptions: {
			parser: eslintParserTs,
			ecmaVersion: 2021,
			sourceType: 'module'
		},
		plugins: {
			'@typescript-eslint': eslintPluginTs
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx']
				}
			}
		},
		rules: {
			'prefer-const': 'error',
			'no-var': 'error',
			'eqeqeq': ['error', 'always'],
			'no-console': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_' }
			],
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/ban-ts-comment': 'warn',
			'import/prefer-default-export': 'off'
		}
	}
];