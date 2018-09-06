const c14n = require('xml-c14n')()
const {C14nCanonicalization} = require('./recC14n')

c14n.registerAlgorithm('http://www.w3.org/TR/2001/REC-xml-c14n-20010315', function (node, cb) {
  return new C14nCanonicalization(node, cb)
})

module.exports = c14n
