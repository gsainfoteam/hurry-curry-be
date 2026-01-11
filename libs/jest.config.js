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
    '^@app/common$': '<rootDir>/common/src/index.ts',
    '^@app/common/(.*)$': '<rootDir>/common/src/$1',
    '^@app/orders$': '<rootDir>/orders/src/index.ts',
    '^@app/orders/(.*)$': '<rootDir>/orders/src/$1',
    '^@app/prisma$': '<rootDir>/prisma/src/index.ts',
    '^@app/prisma/(.*)$': '<rootDir>/prisma/src/$1',
    '^@app/api/(.*)$': '<rootDir>/../apps/api/src/$1',
    '^@libs/common$': '<rootDir>/common/src/index.ts',
    '^@libs/common/(.*)$': '<rootDir>/common/src/$1',
    '^@libs/orders$': '<rootDir>/orders/src/index.ts',
    '^@libs/orders/(.*)$': '<rootDir>/orders/src/$1',
    '^@libs/prisma$': '<rootDir>/prisma/src/index.ts',
    '^@libs/prisma/(.*)$': '<rootDir>/prisma/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
    },
  },
};
