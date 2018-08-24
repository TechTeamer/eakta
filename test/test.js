/* eslint-disable no-console */

const EAkta = require('../lib/EAkta')

let files = [
  'ill.igazolas',
  '161213_RentYourDeveloper Kft._valtozasbejegyzo vegzes',
  'RentYourDeveloper Kft._beadas',
  'terti',
  'TULLAP06052018080814323000-60117337389-117337414-3076765450697434536457534'
]

let es3File = `./files/${files[0]}.es3`

EAkta
  .createEAktaFromFile(es3File)
  .then((eakta) => {
    return eakta
  })
  .catch((err) => { console.error(err) })
