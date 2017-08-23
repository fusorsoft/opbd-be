import q from 'q'
import uuid from 'node-uuid'
import DataTask from '../models/DataTask.js'

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

export default {
  create: saveTask,
}
