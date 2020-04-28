const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const mongoose = require('mongoose')
const Listing = require('./model/Listing')

const MONGO_URI = 'mongodb+srv://node-scrap:Giftfifa000@cluster0-nyvwf.mongodb.net/joblist'

const mongoConnection = async () => {
    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    console.log('MongoDB Connected!')
}

const sleep = (millisecond) => {
    return new Promise(resolve => setTimeout(resolve, millisecond))
}

const scrapListing = async (page) => {
    await page.goto('https://sfbay.craigslist.org/search/jjj')
    const html = await page.content()
    const $ = cheerio.load(html)

    const results = $('.result-info').map((index, element) => {
        const titleElement = $(element).find('.result-title')
        const timeElement = $(element).find('.result-date')
        const hoodElement = $(element).find('.result-hood')

        const title = $(titleElement).text()
        const url = $(titleElement).attr('href')

        const datePosted = new Date($(timeElement).attr('datetime'))

        const hood = $(hoodElement).text().trim().replace('(', '').replace(')', '')
        return {title, url, datePosted, hood}
    }).get()
    return results
}

const scrapeWithJobDesc = async (listings, page) => {
    for(let i = 0; i < listings.length; i++){
        await page.goto(listings[i].url)
        const html = await page.content()
        const $ = cheerio.load(html)

        const jobDescription = $('#postingbody').text().replace(/\s\s+/g, '').replace('QR Code Link to This Post', '')
        const compensation = $('p.attrgroup > span:nth-child(1) > b').text()
        listings[i].jobDescription = jobDescription
        listings[i].compensation = compensation
        const newList = new Listing(listings[i])
        await newList.save()
        await sleep(2000)
    }
}

(async () => {
    await mongoConnection()
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    const listings = await scrapListing(page)
    await scrapeWithJobDesc(listings, page)
})()
