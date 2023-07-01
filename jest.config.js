module.exports = {
  coveragePathIgnorePatterns: ['/dist', '/node_modules'],
  modulePaths: ['<rootDir>'],
  roots: ['<rootDir>'],
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.(js?|ts?)$',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: 'test/tsconfig.json',
      },
    ],
  },
};
