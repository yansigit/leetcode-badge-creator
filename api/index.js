const path = require("path");
const app = require('express')();
const fs = require('fs')

const badge_filepath = path.join(__dirname, "badge.png")
const error_filepath = path.join(__dirname, "no-profile-available.png")

const getBadge = async (username) => {
    const puppeteer = require('puppeteer');

    if (fs.existsSync(badge_filepath)) {
        fs.unlinkSync(badge_filepath);
    }

    return await (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4230.1 Safari/537.36');

        const response = await page.goto(`https://leetcode.com/${username}`);

        if (response.status() === 404) {
            return false
        }

        await page.waitForSelector('div.ant-card-body');

        const el = await page.$$('div.ant-card-body');
        await el[1].screenshot({path: 'badge.png'});
        await browser.close();
        return true
    })();

}

app.get('/api/leetcode/:username', async (req, res) => {
    const { username } = req.params;
    const result = await getBadge(username);
    console.log(result)
    if (result === true) {
        res.status(200).sendFile(badge_filepath, ()=>{console.log('badge output')});
    } else {
        res.status(200).sendFile(error_filepath, ()=>{console.log('error output')});
    }
});

module.exports = app;

// app.listen(80, () => {
//     console.log(`Example app listening at http://localhost`)
// })