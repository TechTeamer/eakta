const EAktaError = require('./EAktaError')
const EAktaSignedInfo = require('./EAktaSignedInfo')
const EAktaDocument = require('./EAktaDocument')
const EAktaTimestamp = require('./EAktaTimestamp')
const crypto = require('crypto')
const x509 = require('x509')
const util = require('./util')

const setSignatureValue = function setSignatureValue (signatureValue) {
  if (!signatureValue) {
    throw new EAktaError('Missing property: SignatureValue')
  }
  return Buffer.from(signatureValue.firstChild.nodeValue, 'base64')
}

const setId = function setId (signature) {
  return signature.attributes.getNamedItem('Id').nodeValue
}

const setKeyInfo = function setKeyInfo (cert) {
  return `-----BEGIN CERTIFICATE-----\n${cert.firstChild.nodeValue}\n-----END CERTIFICATE-----`
}

const setSignatureProfile = function setSignatureProfile (signatureProfile) {
  if (!signatureProfile) {
    return undefined
  }

  const document = signatureProfile.getElementsByTagName('es:Document')[0]

  if (document) {
    let doc = new EAktaDocument(document)
    return {
      commentDocument: doc
    }
  }
}

const setSignedProperties = function setSignedProperties (signature) {
  let signedProperties = signature.getElementsByTagName('SignedProperties')[0]
  let signatureProperties, signingTime, cert

  if (signedProperties) {
    signatureProperties = signedProperties.getElementsByTagName('SignedSignatureProperties')[0]
    const signingCertificate = signatureProperties ? signedProperties.getElementsByTagName('SigningCertificate')[0] : undefined
    const tempCert = signingCertificate ? signingCertificate.getElementsByTagName('Cert')[0] : undefined
    signingTime = signatureProperties ? signedProperties.getElementsByTagName('SigningTime')[0].firstChild.nodeValue : undefined
    cert = {
      digestMethod: tempCert ? tempCert.getElementsByTagName('ds:DigestMethod')[0].getAttribute('Algorithm') : undefined,
      digestValue: tempCert ? tempCert.getElementsByTagName('ds:DigestValue')[0].firstChild.nodeValue : undefined,
      issuerName: tempCert ? tempCert.getElementsByTagName('ds:X509IssuerName')[0].firstChild.nodeValue : undefined,
      serialNumber: tempCert ? tempCert.getElementsByTagName('ds:X509SerialNumber')[0].firstChild.nodeValue : undefined
    }
  }
  return {
    signingTime,
    cert
  }
}

class EAktaSignature {
  constructor (signature) {
    this.id = setId(signature)
    this.signatureValue = setSignatureValue(signature.getElementsByTagName('ds:SignatureValue')[0])
    this.keyInfoCert = setKeyInfo(signature.getElementsByTagName('ds:X509Certificate')[0])
    this.signedInfo = new EAktaSignedInfo(signature.getElementsByTagName('ds:SignedInfo')[0], this.keyInfoCert)

    const certInfo = x509.parseCert(this.keyInfoCert)
    this.issuer = certInfo.issuer
    this.subject = certInfo.subject
    this.validity = {
      notBefore: certInfo.notBefore,
      notAfter: certInfo.notAfter
    }
    this.signatureProfile = setSignatureProfile(signature.getElementsByTagName('es:SignatureProfile')[0])
    this.signedProperties = setSignedProperties(signature)
    this.timeStamp = new EAktaTimestamp(signature)
  }

  isValid () {
    return new Promise((resolve, reject) => {
      let verifier = crypto.createVerify('RSA-SHA256')
      return this.signedInfo.getCanonicalForm().then((canonical) => {
        verifier.update(canonical)
        return util.getPublicKeyFromCert(this.keyInfoCert)
      }).then((pKey) => {
        let result = verifier.verify({key: pKey}, this.signatureValue)
        resolve(result)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  getReferenceStatuses () {
    return this.signedInfo.getReferences()
  }

  toString () {
    return this.signatureValue
  }
}

module.exports = EAktaSignature
