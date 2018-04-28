const rewire = require('rewire')
const DataTask = rewire('../../src/data/DataTask')

describe('DataTask', function () {
  beforeEach(function () {
    this.rewires = []
    this.DataTaskModelSpy = jasmine.createSpy('DataTask').and.returnValue({
      save: jasmine.createSpy('DataTask.save').and.returnValue(
        Promise.resolve('a data task')
      ),
    })

    this.uuidV4Spy = jasmine.createSpy('uuid.v4').and.returnValue('guid')
    this.rewires.push(DataTask.__set__('DataTask', this.DataTaskModelSpy))
    this.rewires.push(DataTask.__set__('uuid', { v4: this.uuidV4Spy }))
  })

  afterEach(function () {
    this.rewires.forEach(reset => { reset() })
  })

  it('creates a new DataTask from model', function () {
    DataTask.create('abc', 'good')

    expect(this.DataTaskModelSpy).toHaveBeenCalledWith()
  })

  it('assigns a unique identifier to the task', function (done) {
    const taskPromise = DataTask.create('abc', 'good')

    taskPromise.then((task) => {
      expect(task.id).toBe('guid')
      done()
    })
  })
})
