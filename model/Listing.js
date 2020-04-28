const {Schema, model} = require('mongoose')

const listingSchema = new Schema({
    title: String,
    url: String,
    datePosted: Date,
    hood: String,
    jobDescription: String,
    compensation: String
})

module.exports = model('listings', listingSchema)
