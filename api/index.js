const path = require("path");
const app = require('express')();
const fs = require('fs')

const badge_filepath = path.join(__dirname, "badge.png")
const error_filepath = path.join(__dirname, "no-profile-available.png")

const getBadge = async (username) => {

    if (fs.existsSync(badge_filepath)) {
        fs.unlinkSync(badge_filepath);
    }

    let chromium = {};
    let puppeteer;
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        // running on the Vercel platform.
        chromium = require('chrome-aws-lambda');
        puppeteer = require('puppeteer-core');
    } else {
        // running locally.
        puppeteer = require('puppeteer');
    }

    return await (async () => {
        let browser;
        try {
            if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
                browser = await puppeteer.launch({
                    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath,
                    headless: true,
                    ignoreHTTPSErrors: true,
                });
            } else {
                browser = await puppeteer.launch();
            }
        } catch (err) {
            console.error(err);
            return null;
        }

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

// module.exports = app;

app.listen(80, () => {
    console.log(`Example app listening at http://localhost`)
})