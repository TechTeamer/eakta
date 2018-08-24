const EAktaTimestamp = require('./EAktaTimestamp')

class EAktaSignature {
  constructor (signature) {
    this.signatureValue = signature['ds:SignatureValue'] ? signature['ds:SignatureValue'][0]['_'] : null
    this.keyInfo = signature ? signature['ds:KeyInfo'][0]['ds:X509Data'][0]['ds:X509Certificate'][0] : null

    // TODO: referencing to document/object, SignatureProfile, DocumentProfile, SignedProperties, TimeStamp(?)
    this.signedInfo = signature['ds:SignedInfo'][0]

    // TODO: extract nicer
    this.signatureProfile = signature['ds:Object'].find(e => e.hasOwnProperty('es:SignatureProfile'))['es:SignatureProfile'][0]

    this.timeStamp = new EAktaTimestamp(signature['ds:Object'].find(e => e.hasOwnProperty('QualifyingProperties'))['QualifyingProperties'][0])
  }

  isValid () { /* TODO: isValid() : bekérdez (openssl) */ }

  toString () {
    return this.signatureValue
  }
}

module.exports = EAktaSignature
