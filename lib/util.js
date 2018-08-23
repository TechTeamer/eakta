const xml2js = require('xml2js')
const unzip = require('unzip')
const fs = require('fs-extra')
const path = require('path')

const bufferToXML = function bufferToXML (buffer) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(buffer.toString(), (err, result) => {
      if (err) {
        reject(err)
      }
      resolve(result)
    })
  })
}

const streamToBuffer = function streamToBuffer (stream) {
  return new Promise((resolve, reject) => {
    let buffer = []
    stream.on('error', reject)
    stream.on('data', (data) => buffer.push(data))
    stream.on('end', () => resolve(Buffer.concat(buffer)))
  })
}

const decompress = function decompress (stream) {
  return new Promise((resolve, reject) => {
    stream.pipe(unzip.Parse())
      .on('entry', (entry) => {
        if (entry.type === 'File') {
          resolve({
            stream: entry,
            fileName: entry.path
          })
        }
      })
    // TODO: done event reject
      .on('error', reject)
  })
}

const documentStreamToFile = function documentStreamToFile (document) {
  return new Promise((resolve, reject) => {
    const {fileName, stream} = document
    // TODO: reject
    const docPath = path.join(process.cwd(), fileName)
    resolve(stream.pipe(fs.createWriteStream(docPath)))
  })
}

module.exports = {
  bufferToXML,
  streamToBuffer,
  decompress,
  documentStreamToFile
}
