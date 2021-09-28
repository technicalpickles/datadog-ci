// tslint:disable: no-string-literal
import {promises as fs} from 'fs'
import {Writable} from 'stream'

import {getDefaultStats, JUnitReporter} from '../../reporters/junit'
import {RunTestCommand} from '../../run-test'
import {getApiTest, getResult, getStep} from '../fixtures'

const globalTestMock = getApiTest('123')
const globalStepMock = getStep()
const globalResultMock = getResult()

describe('Junit reporter', () => {
  const writeMock: Writable['write'] = jest.fn()
  const commandMock: unknown = {
    context: {
      stdout: {
        write: writeMock,
      },
    },
    jUnitReport: 'junit',
  }

  let reporter: JUnitReporter

  describe('constructor', () => {
    beforeEach(() => {
      reporter = new JUnitReporter(commandMock as RunTestCommand)
    })

    it("should append '.xml' to destination if isn't there", () => {
      expect(reporter['destination']).toBe('junit.xml')
    })

    it('should give a default run name', () => {
      expect(reporter['json'].testsuites.$.name).toBe('Undefined run')
    })
  })

  describe('runEnd', () => {
    beforeEach(() => {
      reporter = new JUnitReporter(commandMock as RunTestCommand)
      jest.spyOn(fs, 'writeFile')
      jest.spyOn(reporter['builder'], 'buildObject')
    })

    it('should build the xml', async () => {
      await reporter.runEnd()
      expect(reporter['builder'].buildObject).toHaveBeenCalledWith(reporter['json'])
      expect(fs.writeFile).toHaveBeenCalledWith('junit.xml', expect.any(String), 'utf8')
      expect(writeMock).toHaveBeenCalledTimes(1)

      // Cleaning
      await fs.unlink(reporter['destination'])
    })

    it('should gracefully fail', async () => {
      jest.spyOn(reporter['builder'], 'buildObject').mockImplementation(() => {
        throw new Error('Fail')
      })

      await reporter.runEnd()

      expect(fs.writeFile).not.toHaveBeenCalled()
      expect(writeMock).toHaveBeenCalledTimes(1)
    })

    it('should create the file', async () => {
      reporter['destination'] = 'junit/report.xml'
      await reporter.runEnd()
      const stat = await fs.stat(reporter['destination'])
      expect(stat).toBeDefined()

      // Cleaning
      await fs.unlink(reporter['destination'])
      await fs.rmdir('junit')
    })
  })

  describe('testEnd', () => {
    beforeEach(() => {
      reporter = new JUnitReporter(commandMock as RunTestCommand)
    })

    it('should give a default suite name', () => {
      reporter.testEnd(globalTestMock, [], '', {})
      const testsuite = reporter['json'].testsuites.testsuite[0]
      expect(testsuite.$.name).toBe('Undefined suite')
    })

    it('should use the same report for tests from same suite', () => {
      const testMock = {
        suite: 'Suite 1',
        ...globalTestMock,
      }
      reporter.testEnd(testMock, [], '', {})
      reporter.testEnd(testMock, [], '', {})
      expect(reporter['json'].testsuites.testsuite.length).toBe(1)
    })

    it('should add stats to the run', () => {
      reporter.testEnd(globalTestMock, [], '', {})
      const testsuite = reporter['json'].testsuites.testsuite[0]
      expect(testsuite.$).toMatchObject(getDefaultStats())
    })
  })

  describe('getTestCase', () => {
    it('should add stats to the suite', () => {
      const resultMock = {
        ...globalResultMock,
        ...{
          result: {
            ...globalResultMock.result,
            stepDetails: [
              globalStepMock,
              {
                ...globalStepMock,
                ...{
                  browserErrors: [{type: 'error', name: 'Error', description: 'Description'}],
                  error: 'Error',
                  subTestStepDetails: [globalStepMock],
                  warnings: [{type: 'warning', message: 'Warning'}],
                },
              },
            ],
          },
        },
      }
      const suite = reporter['getTestCase'](getApiTest('123'), resultMock, {})
      expect(suite.$).toMatchObject({
        ...getDefaultStats(),
        errors: 2,
        failures: 1,
        tests: 3,
        warnings: 1,
      })
    })
  })
})
