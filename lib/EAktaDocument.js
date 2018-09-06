const {Readable} = require('stream')
const util = require('./util')
const EAktaError = require('./EAktaError')

const setTitle = function setTitle (documentProfile) {
  let title = documentProfile.firstChild ? documentProfile.firstChild.nodeValue : undefined
  if (!title) {
    throw new EAktaError('Missing property: title')
  }

  return title
}

const setBaseTransform = function setBaseTransform (documentProfile) {
  let transformList = []
  let baseTransform = documentProfile.getElementsByTagName('es:Transform')

  if (!baseTransform || !baseTransform.length) {
    throw new EAktaError('Missing property: baseTransform')
  }

  Array.prototype.forEach.call(baseTransform, (transform) => {
    let trans = transform.attributes.getNamedItem('Algorithm').nodeValue
    if (!EAktaDocument.getAvailableTransformTypes.includes(trans)) {
      throw new EAktaError(`Unknown transformation algorithm: ${trans}`)
    }
    transformList.push(trans)
  })

  return transformList
}

const setDocument = function setDocument (doc) {
  let document = doc.firstChild ? doc.firstChild.nodeValue : undefined

  if (!document) {
    throw new EAktaError('Missing document object')
  }
  return document
}

const setSourceSize = function setSourceSize (documentProfile) {
  let attributes = documentProfile.attributes

  if (!attributes || !attributes.length) {
    throw new EAktaError('Missing required property: SourceSize')
  }

  const sourceSize = {
    sizeUnit: attributes.getNamedItem('sizeUnit').nodeValue,
    sizeValue: attributes.getNamedItem('sizeValue').nodeValue
  }

  if (!sourceSize.sizeUnit) {
    throw new EAktaError('Missing property: sizeUnit')
  }

  if (!sourceSize.sizeValue) {
    throw new EAktaError('Missing property: sizeValue')
  }

  if (Number.isNaN(Number.parseInt(sourceSize.sizeValue, 10))) {
    throw new EAktaError(`Invalid type for size unit: ${sourceSize.sizeValue}`)
  }

  if (sourceSize.sizeUnit !== 'B') {
    throw new EAktaError(`Invalid size unit: ${sourceSize.sizeUnit}`)
  }

  return sourceSize
}

const setFormat = function setFormat (documentProfile) {
  let attributes = documentProfile.getElementsByTagName('es:MIME-Type')[0]
    ? documentProfile.getElementsByTagName('es:MIME-Type')[0].attributes
    : undefined

  if (!attributes || !attributes.length) {
    throw new EAktaError('Missing required property: MIME-Types')
  }

  let mimes = {
    charset: attributes.getNamedItem('charset') ? attributes.getNamedItem('charset').nodeValue : undefined,
    extension: attributes.getNamedItem('extension') ? attributes.getNamedItem('extension').nodeValue : undefined,
    subtype: attributes.getNamedItem('subtype') ? attributes.getNamedItem('subtype').nodeValue : undefined,
    type: attributes.getNamedItem('type') ? attributes.getNamedItem('type').nodeValue : undefined
  }

  if (!mimes.type) {
    throw new EAktaError(`Missing required property: type`)
  }
  if (!mimes.subtype) {
    throw new EAktaError(`Missing required property: subtype`)
  }

  return mimes
}

const setCreationDate = function setCreationDate (documentProfile) {
  let creationDate = documentProfile.firstChild ? documentProfile.firstChild.nodeValue : undefined
  if (!creationDate) {
    throw new EAktaError('Missing property: creationDate')
  }

  let date = new Date(creationDate)

  if (isNaN(date)) {
    throw new EAktaError(`Invalid date ${creationDate}`)
  }
  return creationDate
}

const setCategory = function setCategory (documentProfile) {
  let category = documentProfile ? documentProfile.firstChild.nodeValue : undefined
  if (!category) {
    return category
  }
  if (!EAktaDocument.getAvailableCategoryTypes.includes(category)) {
    throw new EAktaError(`Unknown category type: ${category}`)
  }
  return category
}

const setId = function setId (document) {
  let id = document.getAttributeNode('Id')
  if (!id) {
    throw new EAktaError('Missing property: id')
  }
  return id.nodeValue
}

class EAktaDocument {
  constructor (doc) {
    let documentProfile, documentSignatures

    documentProfile = doc.getElementsByTagName('es:DocumentProfile')[0]

    if (!documentProfile) {
      throw new EAktaError('Missing property: DocumentProfile')
    }

    documentSignatures = doc.getElementsByTagName('ds:Signature')

    this.id = setId(documentProfile)
    this.document = setDocument(doc.getElementsByTagName('ds:Object')[0])

    this.title = setTitle(doc.getElementsByTagName('es:Title')[0])
    this.category = setCategory(doc.getElementsByTagName('es:E-category')[0])
    this.creationDate = setCreationDate(doc.getElementsByTagName('es:CreationDate')[0])
    this.format = setFormat(doc.getElementsByTagName('es:Format')[0])
    this.sourceSize = setSourceSize(doc.getElementsByTagName('es:SourceSize')[0])
    this.baseTransform = setBaseTransform(doc.getElementsByTagName('es:BaseTransform')[0])

    this.signatures = new Map()

    // TODO: custom random properties in the profile
    this.metadata = null

    if (documentSignatures && documentSignatures.length) {
      const Signature = require('./EAktaSignature')
      Array.prototype.forEach.call(documentSignatures, (signature) => {
        let sign = new Signature(signature)
        this.signatures.set(sign.id, sign)
      })
    }
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
