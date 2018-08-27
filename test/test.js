/* eslint-disable no-console */
const assert = require('assert')
const {EAkta, EAktaDocument} = require('../index')

const testFiles = [
  {
    name: 'RentYourDeveloper Kft._beadas',
    expectedProperties: {
      title: 'Változás bejegyzési kérelem',
      creationDate: '2016-12-11T06:41:15Z',
      category: 'electronic dossier'
    },
    expectedDocuments: [
      {
        title: 'A kérelem formanyomtatványa'
      },
      {
        title: 'Változásbejegyzés esetén a legfőbb szervnek vagy a legfőbb szerv helyett eljáró, döntésre jogosult szervnek a változás alapjául szolgáló határozata'
      },
      {
        title: 'A létesítő okirat - változásokkal egybefoglalt - hatályosított szövege'
      },
      {
        title: 'A jogi képviselő meghatalmazása, illetve képviseleti jogának igazolása'
      },
      {
        title: 'Az illeték megfizetésének igazolása'
      },
      {
        title: 'A közzétételi költségtérítés megfizetésének igazolása'
      },
      {
        title: 'Tagjegyzék'
      },
      {
        title: 'Ügyvéd által ellenjegyzett aláírás-minta - Bodnár Zsigmond'
      }
    ]
  }
  // ,
  // 'ill.igazolas': {},
  // '161213_RentYourDeveloper Kft._valtozasbejegyzo vegzes': {},
  // 'terti': {},
  // 'TULLAP06052018080814323000-60117337389-117337414-3076765450697434536457534': {}
]

describe(`Processing 'RentYourDeveloper Kft._beadas`, function () {
  it('Creates EAkta object from file', function () {
    return EAkta.createEAktaFromFile(`/workspace/eakta/test/files/RentYourDeveloper Kft._beadas.es3`)
      .then(function (eakta) {
        assert.ok(eakta instanceof EAkta)
      })
  })
})

describe('Parsing test', function () {
  testFiles.forEach(function (test) {
    describe(`[${test.name}]`, function () {
      describe(`Properties`, function () {
        it(`Title should be '${test.expectedProperties.title}'`, function () {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.title, test.expectedProperties.title)
            })
        })

        it(`Category should be '${test.expectedProperties.category}'`, function () {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.category, test.expectedProperties.category)
            })
        })

        it(`Creation Date should be '${test.expectedProperties.creationDate}'`, function () {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.creationDate, test.expectedProperties.creationDate)
            })
        })
      })

      describe(`Documents`, function () {
        test.expectedDocuments.forEach(expectedDoc => {
          it(`${expectedDoc.title}`, function () {
            EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
              .then(function (eakta) {
                assert.ok(eakta.documents.has(expectedDoc.title))
              })
          })
        })
      })
    })
  })
})

/*
let es3File = `./files/RentYourDeveloper Kft._beadas.es3`

EAkta
  .createEAktaFromFile(es3File)
  .then((eakta) => {
    return eakta.documents.forEach(doc => console.log(doc.title))
  })
  .catch((err) => { console.error(err) })
*/
