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
  },
  {
    name: 'ill.igazolas',
    expectedProperties: {
      title: 'Mak.1035532017247420/illeték/15.000 Ft.',
      creationDate: '2016-12-07T18:06:14Z',
      category: 'elektronikus akta'
    },
    expectedDocuments: [
      {
        title: 'Illetékbefizetési igazolás'
      }
    ]
  },
  {
    name: '161213_RentYourDeveloper Kft._valtozasbejegyzo vegzes',
    expectedProperties: {
      title: 'Cg.01-09-962028/29/végzés',
      creationDate: '2016-12-13T14:17:14Z',
      category: 'electronic dossier'
    },
    expectedDocuments: [
      {
        title: 'Változás bejegyzése'
      },
      {
        title: 'A létesítő okirat - változásokkal egybefoglalt - hatályosított szövege'
      }
    ]
  },
  {
    name: 'terti',
    expectedProperties: {
      title: 'Átvételi elismervény',
      creationDate: '2018-04-25T08:11:09Z',
      category: 'electronic acknowledgement'
    },
    expectedDocuments: [
      {
        title: 'acknowledgement.xml'
      }
    ]
  },
  {
    name: 'TULLAP06052018080814323000-60117337389-117337414-3076765450697434536457534',
    expectedProperties: {
      title: 'tulajdoni lap',
      creationDate: '2018-08-08T12:33:56Z',
      category: 'electronic dossier'
    },
    expectedDocuments: [
      {
        title: 'tulajdoni lap'
      }
    ]
  }
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
        it(`Title should be '${test.expectedProperties.title}'`, function (done) {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.title, test.expectedProperties.title)
            }).then(() => {
              done()
            }).catch((err) => {
              done(err)
            })
        })

        it(`Category should be '${test.expectedProperties.category}'`, function (done) {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.category, test.expectedProperties.category)
            }).then(() => {
              done()
            }).catch((err) => {
              done(err)
            })
        })

        it(`Creation Date should be '${test.expectedProperties.creationDate}'`, function (done) {
          EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
            .then(function (eakta) {
              assert.strictEqual(eakta.creationDate, test.expectedProperties.creationDate)
            }).then(() => {
              done()
            }).catch((err) => {
              done(err)
            })
        })
      })

      describe(`Documents`, function () {
        test.expectedDocuments.forEach(expectedDoc => {
          it(`${expectedDoc.title}`, function (done) {
            EAkta.createEAktaFromFile(`/workspace/eakta/test/files/${test.name}.es3`)
              .then(function (eakta) {
                assert.ok(eakta.documents.has(expectedDoc.title))
              }).then(() => {
                done()
              }).catch((err) => {
                done(err)
              })
          })
        })
      })
    })
  })
})
