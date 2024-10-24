require('dotenv').config()
const compression = require('compression')
const express = require('express')
const { default: helmet } = require('helmet')
const morgan = require('morgan')
const app = express()

// init middlewares
app.use(morgan("dev"))  //dev, combined (PROD use), common, short, tiny
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))


// init db
require('./dbs/init.mongodb')

// init routes
app.use('/', require('./routes'))

// handle error
app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    return res.status(statusCode).json({
        status: 'Error',
        code: statusCode,
        message: error.message || 'Internal Server Error'
    })
})

module.exports = app