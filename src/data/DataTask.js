const q = require('q')
const uuid = require('node-uuid')
const DataTask = require('../models/DataTask.js')

const saveTask = function (userId, status) {
  const deferred = q.defer()

  const task = new DataTask()

  task.id = uuid.v4() // generate a new guid
  task.initiator = userId
  task.status = status
  task.start = Date.now()
  task.complete = null

  q(task.save()).then(function () {
    deferred.resolve(task)
  })

  return deferred.promise
}

module.exports = {
  create: saveTask,
}
