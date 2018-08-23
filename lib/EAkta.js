const {Readable} = require('stream')
const util = require('./util')
const fs = require('fs-extra')

// eslint-disable-next-line no-unused-vars
class EAktaTimeStamp {}

class EAktaSignature {
  constructor (signature) {
    this.signatureValue = signature ? signature['ds:SignatureValue'][0]['_'] : null
    this.keyInfo = signature ? signature['ds:KeyInfo'][0]['ds:X509Data'][0]['ds:X509Certificate'][0] : null

    // TODO: referencing to document/object, SignatureProfile, DocumentProfile, SignedProperties, TimeStamp(?)
    this.signedInfo = signature['ds:SignedInfo'][0]

    // TODO: extract nicer
    this.signatureProfile = signature['ds:Object'][0]['es:SignatureProfile']
  }
}

// TODO: EAktaDocument osztály (ez is tartalmazhat signature-t)
class EAktaDocument {
  constructor (doc) {
    let documentProfile = doc['es:Document'][0]['es:DocumentProfile'][0]
    let documentSignature = doc['es:Document'][0]['ds:Signature'] ? doc['es:Document'][0]['ds:Signature'][0] : null

    this.id = doc['es:Document'][0]['ds:Object'][0]['$']['Id']
    this.document = doc['es:Document'][0]['ds:Object'][0]['_']

    this.title = documentProfile['es:Title'][0]
    this.category = documentProfile['es:E-category']
    this.creationDate = documentProfile['es:CreationDate'][0]
    this.format = documentProfile['es:Format'][0]['es:MIME-Type'][0]['$']
    this.sourceSize = documentProfile['es:SourceSize'][0]['$']

    // TODO: enum[ zip, encrypt, base64(mandatory) ]
    this.baseTransform = documentProfile['es:BaseTransform'][0]['es:Transform'].map(t => t['$']['Algorithm'])

    // TODO: if the document is encrypted, the RecipientCertificate(s) is/are located here
    this.recipientCertificateList = null

    // TODO: custom random properties in the profile
    this.metadata = null

    this.signature = documentSignature ? new EAktaSignature(documentSignature) : undefined
  }

  getDocumentStream () {
    return new Promise((resolve, reject) => {
      let stream = new Readable()

      try {
        stream.push(Buffer.from(this.document, 'base64'))
        stream.push(null)
      } catch (err) {
        reject(err)
      }

      resolve({
        stream,
        isCompressed: this.baseTransform.includes('zip'),
        fileName: this.title + '.' + this.format.extension
      })
    }).then((doc) => {
      if (doc.isCompressed) {
        return util.decompress(doc.stream)
      }
      return doc
    })
  }
}

class EAkta {
  static createEAktaFromFile (filePath) {
    return fs.readFile(filePath)
      .then(util.bufferToXML)
      .then(EAkta.createEAktaInstance)
      .catch((err) => {
        throw err
      })
  }

  static createEAktaFromStream (stream) {
    return util.streamToBuffer(stream)
      .then(util.bufferToXML)
      .then(EAkta.createEAktaInstance)
      .catch((err) => {
        throw err
      })
  }

  static createEAktaInstance (xml) {
    return new EAkta(xml)
  }

  constructor (es3) {
    // TODO: ha nem létezik valami throw exception (es3-nak is xmljs-nek kell lennie - vagy valami validságot vizsgálni)

    let dossier = es3['es:Dossier']
    let dossierProfile = dossier['es:DossierProfile'][0]
    let signature = dossier['ds:Signature'] ? dossier['ds:Signature'][0] : null
    let documentList = dossier['es:Documents']
    let metaData = dossierProfile['es:Metadata'] ? dossierProfile['es:Metadata'][0]['mireg:metadata'][0]['mireg:mireg'][0] : null

    this.title = dossierProfile['es:Title'][0]
    this.creationDate = dossierProfile['es:CreationDate'][0]
    this.category = dossierProfile['es:E-category'] || null

    this.signature = signature ? new EAktaSignature(signature) : undefined

    this.documents = new Map()

    if (metaData) {
      this.metadata = new Map()

      for (let meta in metaData) {
        if (metaData.hasOwnProperty(meta)) {
          this.metadata.set(meta, metaData[meta])
        }
      }
    } else {
      this.metadata = undefined
    }

    for (let doc of documentList) {
      let eaktaDocument = new EAktaDocument(doc)
      this.documents.set(eaktaDocument.title, eaktaDocument)
    }
  }

  // TODO: getDocuments() : Map of Documents()
  getDocuments () {
    return this.documents
  }

  // TODO: getMetaData() : Map: (k=>v)
  getMetadata () {
    return this.metadata
  }

  hasSignature () {
    return typeof this.signature === 'undefined'
  }

  getSignature () {
    return this.signature
  }

  isSignatureValid () { /* TODO: IsSignatureValid() : bekérdez (openssl) */ }
}

module.exports = EAkta
