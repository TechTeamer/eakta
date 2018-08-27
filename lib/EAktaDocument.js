const {Readable} = require('stream')
const util = require('./util')
const EAktaSignature = require('./EAktaSignature')
const EAktaError = require('./EAktaError')

const setTitle = function setTitle (documentProfile) {
  if (!documentProfile['es:Title'] || !documentProfile['es:Title'][0]) {
    throw new EAktaError('Missing property: title')
  }

  return documentProfile['es:Title'][0]
}

const setBaseTransform = function setBaseTransform (documentProfile) {
  let baseTransform

  try {
    baseTransform = documentProfile['es:BaseTransform'][0]['es:Transform']
  } catch (err) {
    throw new EAktaError('Missing property: baseTransform. ' + err.message)
  }

  return baseTransform.map(transformation => {
    let trans = transformation['$']['Algorithm']
    if (!EAktaDocument.getAvailableTransformTypes.includes(trans)) {
      throw new EAktaError(`Unknown transformation algorithm: ${trans}`)
    }
    return trans
  })
}

const setDocument = function setDocument (doc) {
  let document

  try {
    document = doc['ds:Object'][0]['_']
  } catch (err) {
    throw err
  }

  if (!document) {
    throw new EAktaError('Missing document object')
  }
  return document
}

const setSourceSize = function setSourceSize (documentProfile) {
  let sourceSize = documentProfile['es:SourceSize'][0]['$']

  if (!sourceSize.hasOwnProperty('sizeUnit')) {
    throw new EAktaError('Missing property: sizeUnit')
  }

  if (!sourceSize.hasOwnProperty('sizeValue')) {
    throw new EAktaError('Missing property: sizeValue')
  }

  if (Number.isNaN(Number.parseInt(sourceSize.sizeValue, 10))) {
    throw new EAktaError(`Invalid type for size unit: ${sourceSize.sizeValue}`)
  }

  if (sourceSize.sizeUnit !== 'B') {
    throw new EAktaError(`Invalid size unit: ${sourceSize.sizeUnit}`)
  }
}

const setFormat = function setFormat (documentProfile) {
  let mime = documentProfile['es:Format'][0]['es:MIME-Type'][0]['$']
  if (!mime.type) {
    throw new EAktaError(`Missing required property: type`)
  }
  if (!mime.subtype) {
    throw new EAktaError(`Missing required property: subtype`)
  }

  return mime
}

const setCreationDate = function setCreationDate (documentProfile) {
  if (!documentProfile['es:CreationDate'] || !documentProfile['es:CreationDate'][0]) {
    throw new EAktaError('Missing property: creationDate')
  }

  let date = new Date(documentProfile['es:CreationDate'][0])

  if (isNaN(date)) {
    throw new EAktaError(`Invalid date ${documentProfile['es:CreationDate'][0]}`)
  }
  return date
}

const setCategory = function setCategory (documentProfile) {
  let category = documentProfile['es:E-category'] ? documentProfile['es:E-category'][0] : undefined
  if (!category) {
    return category
  }
  if (!EAktaDocument.getAvailableCategoryTypes.includes(category)) {
    throw new EAktaError(`Unknown category type: ${category}`)
  }
  return category
}

const setId = function setId (document) {
  let id
  try {
    id = document['ds:Object'][0]['$']['Id']
  } catch (err) {
    throw new EAktaError('Missing property: id. ' + err.message)
  }
  return id
}

class EAktaDocument {
  constructor (doc) {
    let documentProfile, documentSignature

    try {
      documentProfile = doc['es:DocumentProfile'][0]
      documentSignature = doc['ds:Signature'] ? doc['ds:Signature'][0] : undefined
    } catch (err) {
      throw new EAktaError('Missing property: ' + err.message)
    }

    this.id = setId(doc)
    this.document = setDocument(doc)

    this.title = setTitle(documentProfile)
    this.category = setCategory(documentProfile)
    this.creationDate = setCreationDate(documentProfile)
    this.format = setFormat(documentProfile)
    this.sourceSize = setSourceSize(documentProfile)
    this.baseTransform = setBaseTransform(documentProfile)

    // TODO: if the document is encrypted, the RecipientCertificate(s) is/are located here
    this.recipientCertificateList = null

    // TODO: custom random properties in the profile
    this.metadata = null

    this.signature = documentSignature ? new EAktaSignature(documentSignature) : undefined
  }

  static get getAvailableTransformTypes () {
    return ['zip', 'encrypt', 'base64']
  }

  static get getAvailableCategoryTypes () {
    return [
      'electronic data',
      'electronic document',
      'electronic record',
      'elektronikus adat',
      'elektronikus dokumentum',
      'elektronikus irat',
      'electronic profile',
      'elektronikus adatlap']
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

  toString () {
    return this.title
  }
}

module.exports = EAktaDocument
