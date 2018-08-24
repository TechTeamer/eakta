class EAktaError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, EAktaError)
  }
}

module.exports = EAktaError
