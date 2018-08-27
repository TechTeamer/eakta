const util = require('./util')
const fs = require('fs-extra')

const EAktaSignature = require('./EAktaSignature')
const EAktaDocument = require('./EAktaDocument')
const EAktaError = require('./EAktaError')

const setTitle = function setTitle (root) {
  if (!root['es:Title'] || !root['es:Title'][0]) {
    throw new EAktaError('Missing property: title')
  }

  return root['es:Title'][0]
}

const setCreationDate = function setCreationDate (root) {
  if (!root['es:CreationDate'] || !root['es:CreationDate'][0]) {
    throw new EAktaError('Missing property: creationDate')
  }

  let date = root['es:CreationDate'][0]

  if (isNaN(new Date(date))) {
    throw new EAktaError(`Invalid date: ${root['es:CreationDate'][0]}`)
  }
  return date
}

const setCategory = function setCategory (root) {
  let category = root['es:E-category'] ? root['es:E-category'][0] : undefined
  if (!category) {
    return category
  }
  if (!EAkta.getAvailableCategoryTypes.includes(category)) {
    throw new EAktaError(`Unknown category type: ${category}`)
  }
  return category
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

  static get getAvailableCategoryTypes () {
    return [
      'electronic dossier',
      'electronic acknowledgement',
      'elektronikus akta', // old
      'elektronikus átvételi elismervény'] // old
  }

  constructor (es3) {
    let dossier, dossierProfile, signature, documentList, metaData
    try {
      dossier = es3['es:Dossier']
      dossierProfile = dossier['es:DossierProfile'][0]
      signature = dossier['ds:Signature'] ? dossier['ds:Signature'][0] : undefined
      documentList = dossier['es:Documents'] ? dossier['es:Documents'][0]['es:Document'] : undefined
      metaData = dossierProfile['es:Metadata'] ? dossierProfile['es:Metadata'][0]['mireg:metadata'][0]['mireg:mireg'][0] : undefined
    } catch (err) {
      throw new EAktaError('Missing property: ' + err)
    }

    this.title = setTitle(dossierProfile)
    this.creationDate = setCreationDate(dossierProfile)
    this.category = setCategory(dossierProfile)

    this.signature = signature ? new EAktaSignature(signature) : undefined

    this.documents = new Map()
    this.metadata = new Map()

    if (metaData) {
      for (let meta in metaData) {
        if (metaData.hasOwnProperty(meta)) {
          this.metadata.set(meta, metaData[meta])
        }
      }
    }

    if (documentList && documentList.length) {
      for (let doc of documentList) {
        let eaktaDocument = new EAktaDocument(doc)
        this.documents.set(eaktaDocument.title, eaktaDocument)
      }
    }
  }

  getDocuments () {
    return this.documents
  }

  getMetadata () {
    return this.metadata
  }

  getSignature () {
    return this.signature
  }

  toString () {
    return this.title
  }
}

module.exports = EAkta
