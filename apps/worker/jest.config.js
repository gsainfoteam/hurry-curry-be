module.exports = {
  displayName: 'worker',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.(t|j)s', '../../libs/**/*.(t|j)s'],
  coverageDirectory: '../../coverage/worker',
  moduleNameMapper: {
    '^@app/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@app/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@app/orders$': '<rootDir>/../../libs/orders/src/index.ts',
    '^@app/orders/(.*)$': '<rootDir>/../../libs/orders/src/$1',
    '^@app/prisma$': '<rootDir>/../../libs/prisma/src/index.ts',
    '^@app/prisma/(.*)$': '<rootDir>/../../libs/prisma/src/$1',
    '^@app/api/(.*)$': '<rootDir>/../../apps/api/src/$1',
    '^@libs/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@libs/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@libs/orders$': '<rootDir>/../../libs/orders/src/index.ts',
    '^@libs/orders/(.*)$': '<rootDir>/../../libs/orders/src/$1',
    '^@libs/prisma$': '<rootDir>/../../libs/prisma/src/index.ts',
    '^@libs/prisma/(.*)$': '<rootDir>/../../libs/prisma/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.app.json',
    },
  },
};
