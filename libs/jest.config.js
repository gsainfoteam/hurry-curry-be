module.exports = {
  displayName: 'libs',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/src/**/*.(t|j)s'],
  coverageDirectory: '../coverage/libs',
  moduleNameMapper: {
    '^@app/api/(.*)$': '<rootDir>/../apps/api/src/$1',
    '^@lib/common$': '<rootDir>/common/src/index.ts',
    '^@lib/common/(.*)$': '<rootDir>/common/src/$1',
    '^@lib/orders$': '<rootDir>/orders/src/index.ts',
    '^@lib/orders/(.*)$': '<rootDir>/orders/src/$1',
    '^@lib/prisma$': '<rootDir>/prisma/src/index.ts',
    '^@lib/prisma/(.*)$': '<rootDir>/prisma/src/$1',
    '^@lib/custom-config$': '<rootDir>/custom-config/src/index.ts',
    '^@lib/custom-config/(.*)$': '<rootDir>/custom-config/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
    },
  },
};
