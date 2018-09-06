const c14n = require('./canonicalizer')
const EAktaError = require('./EAktaError')

const setUnsignedProperties = function setUnsignedProperties (signature) {
  let unSignedProperties = signature.getElementsByTagName('UnsignedSignatureProperties')[0]
  let signatureTimeStamp
  if (unSignedProperties) {
    let signTsTemp = unSignedProperties.getElementsByTagName('SignatureTimeStamp')[0]
    signatureTimeStamp = {
      canonicalizationMethod: signTsTemp ? signTsTemp.getElementsByTagName('ds:CanonicalizationMethod')[0].getAttribute('Algorithm') : undefined,
      timestamp: signTsTemp ? signTsTemp.getElementsByTagName('EncapsulatedTimeStamp')[0].firstChild.nodeValue : undefined,
      nodeValue: signTsTemp.toString()
    }
  }
  return signatureTimeStamp
}

class EAktaTimestamp {
  constructor (signature) {
    this.unSignedProperties = setUnsignedProperties(signature)
  }

  getCanonicalForm () {
    return new Promise((resolve, reject) => {
      c14n.createCanonicaliser(this.unSignedProperties.canonicalizationMethod)
        .canonicalise(this.unSignedProperties.nodeValue, function (err, res) {
          if (err) {
            reject(new EAktaError('Canonicalization error: ' + err))
          }
          resolve(res)
        })
    })
  }

  toString () {
    return this.unSignedProperties.timestamp
  }
}

module.exports = EAktaTimestamp
