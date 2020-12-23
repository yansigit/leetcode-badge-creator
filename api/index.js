const path = require("path");
const app = require('express')();
// const fs = require('fs')

// const badge_filepath = path.join(__dirname, "badge.png")
const error_filepath = path.join(__dirname, "no-profile-available.png")

const getBadge = async (username) => {

    // if (fs.existsSync(badge_filepath)) {
    //     fs.unlinkSync(badge_filepath);
    // }

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
        await page.setViewport({ width: 500, height: 768});
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.95 Mobile/15E148 Safari/604.1');

        const response = await page.goto(`https://leetcode.com/${username}`);

        if (response.status() === 404) {
            return false
        }

        await page.waitForSelector('div.ant-card-small');

        const el = await page.$$('div.ant-card-small');
        const buffer = await el[1].screenshot();
        await browser.close();
        return buffer
    })();

}

app.get('/api/leetcode/:username', async (req, res) => {
    const { username } = req.params;
    const result = await getBadge(username);
    // console.log(result)
    if (result === false) {
        res.status(200).sendFile(error_filepath, ()=>{console.log('badge output')});
    } else {
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': result.length
        });
        res.status(200).end(result);
    }
});

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    module.exports = app;
} else {
    app.listen(80, () => {
        console.log(`Example app listening at http://localhost`)
    })
}