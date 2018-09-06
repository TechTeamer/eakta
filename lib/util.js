const unzip = require('unzip')
const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const {exec} = require('child_process')
const DOMParser = require('xmldom').DOMParser

const bufferToXML = function bufferToXML (buffer) {
  return new Promise((resolve, reject) => {
    try {
      let doc = new DOMParser().parseFromString(buffer.toString())
      resolve(doc)
    } catch (err) {
      reject(err)
    }
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

const getPublicKeyFromCert = function getPublicKeyFromCert (cert) {
  return new Promise((resolve, reject) => {
    let child = exec('openssl x509 -pubkey -noout', function (err, result) {
      if (err) reject(err)
      resolve(result)
    })
    child.stdin.write(cert)
    child.stdin.end()
  })
}

const getCAIssuerURIFromCert = function getCAIssuerURIFromCert (cert) {
  return new Promise((resolve, reject) => {
    const child = exec('openssl x509 -text -noout | grep "CA Issuers"', function (err, result) {
      if (err) reject(err)
      resolve(result.trim().split('URI:')[1])
    })
    child.stdin.write(cert)
    child.stdin.end()
  })
}

const getElementById = function getElementById (id, documentElement) {
  if (documentElement.childNodes) {
    for (let i = 0; i < documentElement.childNodes.length; i++) {
      let node = documentElement.childNodes[i]
      let elem = getElementById(id, node)
      if (elem) {
        return elem
      }
      if (node.attributes && node.attributes.getNamedItem('Id')) {
        if (node.attributes.getNamedItem('Id').nodeValue === id) {
          return node
        }
      }
    }
  }
}

const createHash = function createHast (data, hashMethod, digestMethod = null) {
  let hash = crypto.createHash(hashMethod)
  hash.update(data)
  return hash.digest(digestMethod)
}

module.exports = {
  bufferToXML,
  streamToBuffer,
  decompress,
  documentStreamToFile,
  getPublicKeyFromCert,
  getCAIssuerURIFromCert,
  getElementById,
  createHash
}
