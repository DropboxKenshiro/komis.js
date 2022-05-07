

function makeErrorJson(err) {
    return {
        success: false,
        errorType: err.name,
        errorDescription: err.message
    }
}

module.exports = {makeErrorJson}