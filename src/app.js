const compression = require('compression')
const express = require('express')
const { default: helmet } = require('helmet')
const morgan = require('morgan')
const app = express()

// init middlewares
app.use(morgan("dev"))  //dev, combined (PROD use), common, short, tiny
app.use(helmet())
app.use(compression())


// init db
require('./dbs/init.mongodb')

// init routes
app.get('/', (req, res, next) => {
    return res.status(200).json({
        message: 'Welcome!'
    })
})

// handle error

module.exports = app