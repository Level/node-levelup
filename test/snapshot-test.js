/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var delayed = require('delayed')
var common = require('./common')
var SlowStream = require('slow-stream')
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('Snapshots', {
  'setUp': common.readStreamSetUp,

  'tearDown': common.commonTearDown,

  'test ReadStream implicit snapshot': function (done) {
    this.openTestDatabase(db => {
      // 1) Store 100 random numbers stored in the database
      db.batch(this.sourceData.slice(), err => {
        refute(err)

        // 2) Create an iterator on the current data, pipe it through a SlowStream
        //    to make *sure* that we're going to be reading it for longer than it
        //    takes to overwrite the data in there.

        var rs = db.readStream()
        rs = rs.pipe(new SlowStream({ maxWriteInterval: 5 }))
        rs.on('data', this.dataSpy)
        rs.once('end', this.endSpy)

        rs.once('close', delayed.delayed(this.verify.bind(this, rs, done), 0.05))

        process.nextTick(() => {
          // 3) Concoct and write new random data over the top of existing items.
          //    If we're not using a snapshot then then we'd expect the test
          //    to fail because it'll pick up these new values rather than the
          //    old ones.
          var newData = []
          var i
          var k

          for (i = 0; i < 100; i++) {
            k = (i < 10 ? '0' : '') + i
            newData.push({
              type: 'put',
              key: k,
              value: Math.random()
            })
          }
          db.batch(newData.slice(), err => {
            refute(err)
            // we'll return here faster than it takes the readStream to complete
          })
        })
      })
    })
  }
})
