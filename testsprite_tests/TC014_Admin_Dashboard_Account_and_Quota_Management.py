import asyncio
from playwright import async_api
from playwright.async_api import expect

async def find_locator(page, selector: str):
    loc = page.locator(selector)
    try:
        if await loc.count() > 0:
            return loc.first
    except Exception:
        pass
    for fr in page.frames:
        loc = fr.locator(selector)
        try:
            if await loc.count() > 0:
                return loc.first
        except Exception:
            continue
    raise AssertionError(f"Selector not found: {selector}")


async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--no-sandbox",              # Required in some environments
                "--disable-gpu"             # Avoid GPU issues
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(10000)
        context.set_default_navigation_timeout(15000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        page.set_default_timeout(10000)
        
        # Navigate to your target URL and wait until the network request is committed
        try:
            await page.goto("http://localhost:5000", wait_until="domcontentloaded", timeout=20000)
        except async_api.Error:
            # Retry once if the page gets closed during Clerk handshake
            page = await context.new_page()
            page.set_default_timeout(10000)
            await page.goto("http://localhost:5000", wait_until="domcontentloaded", timeout=20000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=8000)
            await page.wait_for_load_state("networkidle", timeout=8000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input super admin email and continue login.
        frame = context.pages[-1]
        # Input super admin email address.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('sergio.louzan@dicorel.com')
        

        frame = context.pages[-1]
        # Click continue button to proceed with login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input super admin password and click continue to complete login.
        frame = context.pages[-1]
        # Input super admin password.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('145@DicoreL')
        

        frame = context.pages[-1]
        # Click continue button to submit password and login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the verification code received by email and continue login.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click continue button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the 2FA verification code and click 'Continuar' to complete login.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Find a way to input the 2FA code and submit it, or use an alternative method to bypass or complete 2FA verification.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Input the 2FA verification code into the input field and click 'Continuar' to complete login.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the 2FA verification code and click 'Continuar' to complete login.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Utilize outro método' link to explore alternative verification methods to complete login.
        frame = context.pages[-1]
        # Click 'Utilize outro método' link to try alternative 2FA verification methods.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Enviar código para sergio.louzan@dicorel.com' button to resend the verification code to email.
        frame = context.pages[-1]
        # Click 'Enviar código para sergio.louzan@dicorel.com' button to resend the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the new 2FA verification code and click 'Continuar' to complete login.
        frame = context.pages[-1]
        # Input the new 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit the new 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the 2FA verification code and click 'Continuar' to complete login.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Voltar' to return to the previous 2FA code input screen to input the verification code.
        frame = context.pages[-1]
        # Click 'Voltar' link to return to the 2FA code input screen.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the 2FA verification code and click 'Continuar' to complete login and access the admin dashboard.
        frame = context.pages[-1]
        # Input the 2FA verification code.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        # Click 'Continuar' button to submit 2FA code and complete login.
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Quota request approved successfully').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test case failed: Super admin capabilities test failed because the quota request approval confirmation message was not found, indicating the quota was not updated properly or tenant was not notified as required by the test plan.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    