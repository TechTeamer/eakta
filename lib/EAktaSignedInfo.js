const EAktaError = require('./EAktaError')
const c14n = require('./canonicalizer')
const util = require('./util')

const setCanonicalizationMethod = function setCanonicalizationMethod (node) {
  let value

  if (!node) {
    throw new EAktaError('Missing property: CanonicalizationMethod')
  }

  try {
    value = node.attributes.getNamedItem('Algorithm').nodeValue
  } catch (err) {
    throw new EAktaError('Missing attribute: Algorithm. ' + err)
  }

  if (!EAktaSignedInfo.getAvailableCanonicalizations.includes(value)) {
    throw new EAktaError('Unknown transform type: ' + value)
  }

  return value
}

const setSignatureMethod = function setSignatureMethod (node) {
  let value

  if (!node) {
    throw new EAktaError('Missing property: SignatureMethod')
  }
  try {
    value = node.attributes.getNamedItem('Algorithm').nodeValue
  } catch (err) {
    throw new EAktaError('Missing attribute: Algorithm. ' + err)
  }
  return value
}

class EAktaSignedInfo {
  constructor (signedInfo, cert) {
    const references = signedInfo.getElementsByTagName('ds:Reference')

    this.nodeValue = signedInfo
    this.canonicalizationMethod = setCanonicalizationMethod(signedInfo.getElementsByTagName('ds:CanonicalizationMethod')[0])
    this.signatureMethod = setSignatureMethod(signedInfo.getElementsByTagName('ds:SignatureMethod')[0])
    this.cert = cert
    this.references = new Map()

    if (!references) {
      throw new EAktaError('Missing property: Reference')
    }

    Array.prototype.forEach.call(references, (reference) => {
      let transforms = []
      Array.prototype.forEach.call(reference.getElementsByTagName('ds:Transform'), function (transform) {
        let trans = transform.attributes.getNamedItem('Algorithm').nodeValue
        transforms.push(trans)
      })
      this.references.set(
        reference.attributes.getNamedItem('URI').nodeValue.split('#')[1],
        {
          id: reference.attributes.getNamedItem('Id').nodeValue,
          uri: reference.attributes.getNamedItem('URI').nodeValue.split('#')[1],
          digestMethod: reference.getElementsByTagName('ds:DigestMethod')[0].attributes.getNamedItem('Algorithm').nodeValue,
          digestValue: reference.getElementsByTagName('ds:DigestValue')[0].textContent,
          transforms
        }
      )
    })
  }

  static get getAvailableCanonicalizations () {
    return [
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
      'http://www.w3.org/2001/10/xml-exc-c14n#WithComments',
      'http://www.w3.org/2006/12/xml-c14n11',
      'http://www.w3.org/2006/12/xml-c14n11#WithComments'
    ]
  }

  getCanonicalForm () {
    return new Promise((resolve, reject) => {
      c14n.createCanonicaliser(this.canonicalizationMethod)
        .canonicalise(this.nodeValue, function (err, res) {
          if (err) {
            reject(new EAktaError('Canonicalization error: ' + err))
          }
          resolve(res)
        })
    })
  }

  getReferences () {
    let digestPromises = []
    this.references.forEach((reference) => {
      digestPromises.push(this.digest(reference))
    })
    return Promise.all(digestPromises)
      .then((references) => {
        return references
      })
  }

  digest (reference) {
    return new Promise((resolve, reject) => {
      const referencedElem = util.getElementById(reference.uri, this.nodeValue.ownerDocument.documentElement)

      if (EAktaSignedInfo.getAvailableCanonicalizations.includes(reference.transforms[0])) {
        let canoner = c14n.createCanonicaliser(reference.transforms[0])

        canoner.canonicalise(referencedElem, function (err, res) {
          if (err) {
            reject(new EAktaError('Canonicalization error: ' + err))
          }

          let hashedReference
          try {
            hashedReference = util.createHash(res, 'sha256')
          } catch (err) {
            reject(err)
          }

          let digest = Buffer.from(hashedReference).toString('base64')

          resolve({
            id: reference.id,
            uri: reference.uri,
            digestValue: reference.digestValue,
            referenceDigest: digest,
            isValid: reference.digestValue === digest
          })
        })
      } else {
        let decoded = Buffer.from(referencedElem.firstChild.nodeValue, 'base64')
        let digest = util.createHash(decoded, 'sha256')
        let encodedDigest = Buffer.from(digest).toString('base64')

        resolve({
          id: reference.id,
          uri: reference.uri,
          digestValue: reference.digestValue,
          referenceDigest: encodedDigest,
          isValid: reference.digestValue === encodedDigest
        })
      }
    })
  }

  toString () {
    return this.nodeValue.toString()
  }
}

module.exports = EAktaSignedInfo
