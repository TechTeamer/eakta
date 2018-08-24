class EAktaTimestamp {
  constructor (qualifyingProperties) {
    this.signedProperties = qualifyingProperties['SignedProperties'][0]
    this.unSignedProperties = qualifyingProperties['UnsignedProperties'][0]['UnsignedSignatureProperties'][0]
  }

  toString () {
    return this.unSignedProperties[0]['EncapsulatedTimeStamp'][0]['_']
  }
}

module.exports = EAktaTimestamp
