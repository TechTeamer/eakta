const util = require('./util')
const fs = require('fs-extra')
const xpath = require('xpath')
const EAktaSignature = require('./EAktaSignature')
const EAktaDocument = require('./EAktaDocument')
const EAktaError = require('./EAktaError')

const setTitle = function setTitle (root) {
  try {
    return root.getElementsByTagName('es:Title')[0].childNodes[0].nodeValue
  } catch (err) {
    throw new EAktaError('Missing property: title ' + err)
  }
}

const setCreationDate = function setCreationDate (root) {
  try {
    return root.getElementsByTagName('es:CreationDate')[0].childNodes[0].nodeValue
  } catch (err) {
    throw new EAktaError('Missing property: creationDate' + err)
  }
}

const setCategory = function setCategory (root) {
  let category = root.getElementsByTagName('es:E-category')[0]
    ? root.getElementsByTagName('es:E-category')[0].childNodes[0].nodeValue
    : undefined

  if (!category) {
    return category
  }

  if (!EAkta.getAvailableCategoryTypes.includes(category)) {
    throw new EAktaError(`Unknown category type: ${category}`)
  }
  return category
}

class EAkta {
  constructor (es3) {
    let dossierProfile, signatures, documentList
    const select = xpath.useNamespaces({
      ds: es3.documentElement.attributes.getNamedItem('xmlns:ds').nodeValue,
      es: es3.documentElement.attributes.getNamedItem('xmlns:es').nodeValue
    })
    try {
      dossierProfile = select('//es:DossierProfile', es3)[0]
      signatures = select('//es:Dossier/ds:Signature', es3)
      documentList = select('//es:Dossier/es:Documents/es:Document', es3)
      // metaData = dossierProfile['es:Metadata'] ? dossierProfile['es:Metadata'][0]['mireg:metadata'][0]['mireg:mireg'][0] : undefined
    } catch (err) {
      throw new EAktaError('Missing property: ' + err)
    }

    this.title = setTitle(dossierProfile)
    this.creationDate = setCreationDate(dossierProfile)
    this.category = setCategory(dossierProfile)

    this.signatures = new Map()
    this.documents = new Map()
    this.metadatas = new Map()

    if (signatures && signatures.length) {
      for (let signature of signatures) {
        let sign = new EAktaSignature(signature)
        this.signatures.set(sign.id, sign)
      }
    }

    /*
    if (metaData) {
      for (let meta in metaData) {
        if (metaData.hasOwnProperty(meta)) {
          this.metadatas.set(meta, metaData[meta])
        }
      }
    }
    */

    if (documentList && documentList.length) {
      for (let doc of documentList) {
        let eaktaDocument = new EAktaDocument(doc)
        this.documents.set(eaktaDocument.title, eaktaDocument)
      }
    }
  }

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

  getDocuments () {
    return this.documents
  }

  getMetadata () {
    return this.metadatas
  }

  getSignatures () {
    return this.signatures
  }

  toString () {
    return this.title
  }
}

module.exports = EAkta
