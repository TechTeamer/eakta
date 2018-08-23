/* eslint-disable no-console */

const EAkta = require('../lib/EAkta')

let es3File = './files/ill.igazolas.temp.es3'

EAkta
  .createEAktaFromFile(es3File)
  .then((eakta) => {
    return eakta
  })
  .catch((err) => { console.error(err) })
