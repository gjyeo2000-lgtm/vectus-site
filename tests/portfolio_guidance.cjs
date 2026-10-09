const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {chromium} = require('playwright');

(async()=>{
  const root=path.resolve(__dirname,'..');
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'vectus-site-guidance-'));
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for (const lang of ['ko','en']) {
      const file=lang==='ko'?'index.html':'en/index.html';
      for (const width of [1440,375]) {
        await page.setViewportSize({width,height:1000});
        await page.goto(`file:///${root.replaceAll('\\','/')}/${file}`);
        const list=page.locator('.follow-list');
        await list.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200);
        assert.equal(await list.locator('.follow-item').count(),13);
        assert.deepEqual(await list.locator('.follow-idx').allTextContents(),Array.from({length:13},(_,i)=>String(i+1).padStart(2,'0')));
        for (const feature of ['holdings-overlap','holdings-history']) {
          const card=page.locator(`[data-feature="${feature}"]`);
          await card.scrollIntoViewIfNeeded();
          assert.equal(await card.evaluate(n=>n.scrollWidth<=n.clientWidth),true);
          await card.screenshot({path:path.join(output,`${lang}-${width}-${feature}.png`)});
        }
        const history=await page.locator('[data-feature="holdings-history"]').innerText();
        assert.match(history,lang==='ko'?/직접 등록한/:/you enter/);
        assert.match(history,lang==='ko'?/자동으로 가져오거나 자동 매매하는 서비스는 아닙니다/:/does not automatically import/);
      }
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,screenshots:output}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
