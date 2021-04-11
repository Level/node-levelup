const sinon = require('sinon')
const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('key and value streams: keyStream()', function (t) {
    const ctx = createContext(t)

    discardable(t, testCommon, function (db, done) {
      db.batch(ctx.sourceData.slice(), function (err) {
        t.ifError(err)

        const rs = db.keyStream()
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify(ctx.sourceKeys)
          done()
        })
      })
    })
  })

  test('key and value streams: readStream({keys:true,values:false})', function (t) {
    const ctx = createContext(t)

    discardable(t, testCommon, function (db, done) {
      db.batch(ctx.sourceData.slice(), function (err) {
        t.ifError(err)

        const rs = db.readStream({ keys: true, values: false })
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify(ctx.sourceKeys)
          done()
        })
      })
    })
  })

  test('key and value streams: valueStream()', function (t) {
    const ctx = createContext(t)

    discardable(t, testCommon, function (db, done) {
      db.batch(ctx.sourceData.slice(), function (err) {
        t.ifError(err)

        const rs = db.valueStream()
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify(ctx.sourceValues)
          done()
        })
      })
    })
  })

  test('key and value streams: readStream({keys:false,values:true})', function (t) {
    const ctx = createContext(t)

    discardable(t, testCommon, function (db, done) {
      db.batch(ctx.sourceData.slice(), function (err) {
        t.ifError(err)

        const rs = db.readStream({ keys: false, values: true })
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify(ctx.sourceValues)
          done()
        })
      })
    })
  })
}

function createContext (t) {
  const ctx = {}

  ctx.dataSpy = sinon.spy()
  ctx.endSpy = sinon.spy()
  ctx.sourceData = []

  for (let i = 0; i < 100; i++) {
    const k = (i < 10 ? '0' : '') + i
    ctx.sourceData.push({
      type: 'put',
      key: k,
      value: Math.random()
    })
  }

  ctx.sourceKeys = Object.keys(ctx.sourceData)
    .map(function (k) { return ctx.sourceData[k].key })
  ctx.sourceValues = Object.keys(ctx.sourceData)
    .map(function (k) { return ctx.sourceData[k].value })

  ctx.verify = function (data) {
    t.is(ctx.endSpy.callCount, 1, 'stream emitted single "end" event')
    t.is(ctx.dataSpy.callCount, data.length, 'stream emitted correct number of "data" events')

    data.forEach(function (d, i) {
      const call = ctx.dataSpy.getCall(i)

      if (call) {
        t.is(call.args.length, 1, 'stream "data" event #' + i + ' fired with 1 argument')
        t.is(+call.args[0].toString(), +d, 'stream correct "data" event #' + i + ': ' + d)
      }
    })
  }

  return ctx
}
