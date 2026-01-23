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
        # -> Input user email and click continue to proceed with login.
        frame = context.pages[-1]
        # Input the email of a user with permissions to create tenant accounts
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin@example.com')
        

        frame = context.pages[-1]
        # Click the continue button to proceed with login
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Registre-se' to register a new user with permissions to create tenant accounts.
        frame = context.pages[-1]
        # Click on 'Registre-se' to register a new user
        elem = frame.locator('xpath=html/body/div/div/div/div/div[2]/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input new user email and password, then click continue to register.
        frame = context.pages[-1]
        # Input new user email for tenant admin registration
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('tenantadmin@example.com')
        

        frame = context.pages[-1]
        # Input password for tenant admin registration
        elem = await find_locator(page, 'input[type=\"password\"], input[name=\"password\"]')
        await page.wait_for_timeout(3000); await elem.fill('StrongPassword123!')
        

        frame = context.pages[-1]
        # Click continue button to submit registration form
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Tenant Account Successfully Created').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test failed: Tenant account creation and branding configuration did not complete successfully as per the test plan.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    