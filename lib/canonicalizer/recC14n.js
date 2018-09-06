
exports.C14nCanonicalization = C14nCanonicalization
exports.C14nCanonicalizationWithComments = C14nCanonicalizationWithComments

const xmlSpecialToEncodedAttribute = {
  '&': '&amp;',
  '<': '&lt;',
  '"': '&quot;',
  '\r': '&#xD;',
  '\n': '&#xA;',
  '\t': '&#x9;'
}

const xmlSpecialToEncodedText = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '\r': '&#xD;'
}

function encodeSpecialCharactersInAttribute (attributeValue) {
  return attributeValue
    .replace(/[\r\n\t ]/g, ' ') // White space normalization (Note: this should normally be done by the xml parser) See: https://www.w3.org/TR/xml/#AVNormalize
    .replace(/([&<"\r\n\t])/g, function (str, item) {
      // Special character normalization. See:
      // - https://www.w3.org/TR/xml-c14n#ProcessingModel (Attribute Nodes)
      // - https://www.w3.org/TR/xml-c14n#Example-Chars
      return xmlSpecialToEncodedAttribute[item]
    })
}

function encodeSpecialCharactersInText (text) {
  return text
    .replace(/\r\n?/g, '\n') // Line ending normalization (Note: this should normally be done by the xml parser). See: https://www.w3.org/TR/xml/#sec-line-ends
    .replace(/([&<>\r])/g, function (str, item) {
      // Special character normalization. See:
      // - https://www.w3.org/TR/xml-c14n#ProcessingModel (Text Nodes)
      // - https://www.w3.org/TR/xml-c14n#Example-Chars
      return xmlSpecialToEncodedText[item]
    })
}

function C14nCanonicalization () {
  this.includeComments = false
}

C14nCanonicalization.prototype.attrCompare = function (a, b) {
  if (!a.namespaceURI && b.namespaceURI) { return -1 }
  if (!b.namespaceURI && a.namespaceURI) { return 1 }

  let left = a.namespaceURI + a.localName
  let right = b.namespaceURI + b.localName

  if (left === right) return 0
  else if (left < right) return -1
  else return 1
}

C14nCanonicalization.prototype.nsCompare = function (a, b) {
  let attr1 = a.prefix
  let attr2 = b.prefix
  if (attr1 === attr2) { return 0 }
  return attr1.localeCompare(attr2)
}

C14nCanonicalization.prototype.renderAttrs = function (node, defaultNS) {
  let a; let i; let attr
  let res = []
  let attrListToRender = []

  if (node.nodeType === 8) { return this.renderComment(node) }

  if (node.attributes) {
    for (i = 0; i < node.attributes.length; ++i) {
      attr = node.attributes[i]
      // ignore namespace definition attributes
      if (attr.name.indexOf('xmlns') === 0) { continue }
      attrListToRender.push(attr)
    }
  }

  attrListToRender.sort(this.attrCompare)

  for (a in attrListToRender) {
    if (!attrListToRender.hasOwnProperty(a)) { continue }

    attr = attrListToRender[a]
    res.push(' ', attr.name, '="', encodeSpecialCharactersInAttribute(attr.value), '"')
  }

  return res.join('')
}

/**
 * Create the string of all namespace declarations that should appear on this element
 *
 * @param {Node} node. The node we now render
 * @param {Array} prefixesInScope. The prefixes defined on this node
 *                parents which are a part of the output set
 * @param {String} defaultNs. The current default namespace
 * @param {String} defaultNsForPrefix.
 * @param {String} ancestorNamespaces - Import ancestor namespaces if it is specified
 * @return {String}
 * @api private
 */
C14nCanonicalization.prototype.renderNs = function (node, prefixesInScope, defaultNs, defaultNsForPrefix, ancestorNamespaces) {
  let a; let i; let p; let attr
  let res = []
  let newDefaultNs = defaultNs
  let nsListToRender = []
  let currNs = node.namespaceURI || ''

  // handle the namespaceof the node itself
  if (node.prefix) {
    if (prefixesInScope.indexOf(node.prefix) === -1) {
      nsListToRender.push({'prefix': node.prefix, 'namespaceURI': node.namespaceURI || defaultNsForPrefix[node.prefix]})
      prefixesInScope.push(node.prefix)
    }
  } else if (defaultNs !== currNs) {
    // new default ns
    newDefaultNs = node.namespaceURI
    res.push(' xmlns="', newDefaultNs, '"')
  }

  // handle the attributes namespace
  if (node.attributes) {
    for (i = 0; i < node.attributes.length; ++i) {
      attr = node.attributes[i]

      // handle all prefixed attributes that are included in the prefix list and where
      // the prefix is not defined already. New prefixes can only be defined by `xmlns:`.
      if (attr.prefix === 'xmlns' && prefixesInScope.indexOf(attr.localName) === -1) {
        nsListToRender.push({'prefix': attr.localName, 'namespaceURI': attr.value})
        prefixesInScope.push(attr.localName)
      }

      // handle all prefixed attributes that are not xmlns definitions and where
      // the prefix is not defined already
      if (attr.prefix && prefixesInScope.indexOf(attr.prefix) === -1 && attr.prefix !== 'xmlns' && attr.prefix !== 'xml') {
        nsListToRender.push({'prefix': attr.prefix, 'namespaceURI': attr.namespaceURI})
        prefixesInScope.push(attr.prefix)
      }
    }
  }

  if (Array.isArray(ancestorNamespaces) && ancestorNamespaces.length > 0) {
    // Remove namespaces which are already present in nsListToRender
    for (let p1 in ancestorNamespaces) {
      if (!ancestorNamespaces.hasOwnProperty(p1)) continue
      let alreadyListed = false
      for (let p2 in nsListToRender) {
        if (nsListToRender[p2].prefix === ancestorNamespaces[p1].prefix &&
            nsListToRender[p2].namespaceURI === ancestorNamespaces[p1].namespaceURI) {
          alreadyListed = true
        }
      }

      if (!alreadyListed) {
        nsListToRender.push(ancestorNamespaces[p1])
      }
    }
  }

  nsListToRender.sort(this.nsCompare)

  // render namespaces
  for (a in nsListToRender) {
    if (!nsListToRender.hasOwnProperty(a)) { continue }

    p = nsListToRender[a]
    res.push(' xmlns:', p.prefix, '="', p.namespaceURI, '"')
  }

  return {'rendered': res.join(''), 'newDefaultNs': newDefaultNs}
}

C14nCanonicalization.prototype.processInner = function (node, prefixesInScope, defaultNs, defaultNsForPrefix, ancestorNamespaces) {
  if (node.nodeType === 8) { return this.renderComment(node) }
  if (node.data) { return encodeSpecialCharactersInText(node.data) }

  let i; let pfxCopy
  let ns = this.renderNs(node, prefixesInScope, defaultNs, defaultNsForPrefix, ancestorNamespaces)
  let res = ['<', node.tagName, ns.rendered, this.renderAttrs(node, ns.newDefaultNs), '>']

  for (i = 0; i < node.childNodes.length; ++i) {
    pfxCopy = prefixesInScope.slice(0)
    res.push(this.processInner(node.childNodes[i], pfxCopy, ns.newDefaultNs, defaultNsForPrefix, []))
  }

  res.push('</', node.tagName, '>')
  return res.join('')
}

// Thanks to deoxxa/xml-c14n for comment renderer
C14nCanonicalization.prototype.renderComment = function (node) {
  if (!this.includeComments) { return '' }

  let isOutsideDocument = (node.ownerDocument === node.parentNode)

  let isBeforeDocument = null

  let isAfterDocument = null

  if (isOutsideDocument) {
    let nextNode = node

    let previousNode = node

    while (nextNode !== null) {
      if (nextNode === node.ownerDocument.documentElement) {
        isBeforeDocument = true
        break
      }

      nextNode = nextNode.nextSibling
    }

    while (previousNode !== null) {
      if (previousNode === node.ownerDocument.documentElement) {
        isAfterDocument = true
        break
      }

      previousNode = previousNode.previousSibling
    }
  }

  return (isAfterDocument ? '\n' : '') + '<!--' + encodeSpecialCharactersInText(node.data) + '-->' + (isBeforeDocument ? '\n' : '')
}

/**
 * Perform canonicalization of the given node
 *
 * @param {Node} node
 * @return {String}
 * @api public
 */
C14nCanonicalization.prototype.canonicalise = function (node, cb) {
  let res
  setImmediate(() => {
    try {
      // let defaultNs = options.defaultNs || ''
      // let defaultNsForPrefix = options.defaultNsForPrefix || {}
      // let ancestorNamespaces = options.ancestorNamespaces || []
      res = this.processInner(node, [], '', {}, [])
    } catch (e) {
      return cb(e)
    }
    return cb(null, res)
  })
}

C14nCanonicalization.prototype.name = function () {
  return 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
}

// Add c14n#WithComments here (very simple subclass)
exports.C14nCanonicalizationWithComments = C14nCanonicalizationWithComments

function C14nCanonicalizationWithComments () {
  C14nCanonicalization.call(this)
  this.includeComments = true
}

C14nCanonicalizationWithComments.prototype = Object.create(C14nCanonicalization.prototype)

C14nCanonicalizationWithComments.prototype.constructor = C14nCanonicalizationWithComments

C14nCanonicalizationWithComments.prototype.name = function () {
  return 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments'
}
