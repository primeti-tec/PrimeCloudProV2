import asyncio
from playwright import async_api
from playwright.async_api import expect

async def find_locator(page, selector: str):
    try:
        await page.wait_for_selector(selector, timeout=8000)
    except Exception:
        pass
    loc = page.locator(selector)
    try:
        if await loc.count() > 0:
            return loc.first
    except Exception:
        pass
    for fr in page.frames:
        try:
            await fr.wait_for_selector(selector, timeout=8000)
        except Exception:
            pass
        loc = fr.locator(selector)
        try:
            if await loc.count() > 0:
                return loc.first
        except Exception:
            continue
    raise AssertionError(f"Selector not found: {selector}")


async def find_button(page):
    for sel in [
        'button:has-text("Continuar")',
        'button:has-text("Continue")',
        'button[type="submit"]'
    ]:
        try:
            btn = await find_locator(page, sel)
            return btn
        except Exception:
            continue
    raise AssertionError("Button not found: Continuar/Continue/submit")


async def run_test():
    pw = None
    browser = None
    context = None
    # Diagnostic output paths
    diag_dir = "testsprite_tests/tmp"
    
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
            await page.goto("http://localhost:5000/sign-up", wait_until="domcontentloaded", timeout=20000)
        except async_api.Error:
            # Retry once if the page gets closed during Clerk handshake
            page = await context.new_page()
            page.set_default_timeout(10000)
            await page.goto("http://localhost:5000/sign-up", wait_until="domcontentloaded", timeout=20000)
        
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
        # -> Try sign-up first (test email)
        await page.goto("http://localhost:5000/sign-up", wait_until="domcontentloaded", timeout=20000)
        # Email
        elem = await find_locator(page, '#emailAddress-field, input[name="emailAddress"]')
        await page.wait_for_timeout(1000); await elem.fill('sergio.louzan@primeti.tec.br')
        # Password
        elem = await find_locator(page, '#password-field, input[name="password"]:not([name="hiddenPassword"]):visible')
        await page.wait_for_timeout(1000); await elem.fill('&Ex066249')
        # Submit
        elem = await find_locator(page, 'button.cl-formButtonPrimary')
        await page.wait_for_timeout(1000); await elem.click(timeout=5000)

        # -> If verification code is required, use Clerk test code 424242.
        try:
            await page.wait_for_selector('input[data-input-otp="true"]', timeout=15000)
            code_input = await find_locator(page, 'input[data-input-otp="true"], input[autocomplete="one-time-code"], input[name*="code"], input[type="tel"]')
            await page.wait_for_timeout(1000); await code_input.fill('424242')
            try:
                btn = await find_locator(page, 'button.cl-formButtonPrimary, button:has-text("Continuar"), button:has-text("Verify"), button:has-text("Confirmar")')
                await btn.click(timeout=5000)
            except Exception:
                pass
        except Exception:
            pass

        # Diagnostics after signup attempt
        try:
            await page.wait_for_timeout(3000)
            await page.screenshot(path=f"{diag_dir}/tc001-after-signup.png", full_page=True)
            html = await page.content()
            with open(f"{diag_dir}/tc001-after-signup.html", "w", encoding="utf-8") as f:
                f.write(html)
        except Exception:
            pass

        # If still not authenticated, try sign-in flow
        try:
            await page.wait_for_function("() => window.Clerk && window.Clerk.session && window.Clerk.session.id", timeout=8000)
        except Exception:
            await page.goto("http://localhost:5000/sign-in", wait_until="domcontentloaded", timeout=20000)
            elem = await find_locator(page, '#identifier-field, input[name="identifier"]')
            await page.wait_for_timeout(1000); await elem.fill('sergio.louzan@primeti.tec.br')
            elem = await find_locator(page, '#password-field, input[name="password"]:not([name="hiddenPassword"]):visible')
            await page.wait_for_timeout(1000); await elem.fill('&Ex066249')
            elem = await find_locator(page, 'button.cl-formButtonPrimary')
            await page.wait_for_timeout(1000); await elem.click(timeout=5000)
            try:
                code_input = await find_locator(page, 'input[autocomplete="one-time-code"], input[name*="code"], input[type="tel"]')
                await page.wait_for_timeout(1000); await code_input.fill('424242')
                try:
                    btn = await find_locator(page, 'button:has-text("Continuar"), button:has-text("Verify"), button:has-text("Confirmar")')
                    await btn.click(timeout=5000)
                except Exception:
                    pass
            except Exception:
                pass

        # Diagnostics after login attempt
        try:
            await page.wait_for_timeout(3000)
            await page.screenshot(path=f"{diag_dir}/tc001-after-login.png", full_page=True)
            html = await page.content()
            with open(f"{diag_dir}/tc001-after-login.html", "w", encoding="utf-8") as f:
                f.write(html)
        except Exception:
            pass

        # Wait for Clerk session to be established before accessing dashboard
        try:
            await page.wait_for_function("() => window.Clerk && window.Clerk.session && window.Clerk.session.id", timeout=20000)
        except Exception:
            try:
                with open(f"{diag_dir}/tc001-after-login-url.txt", "w", encoding="utf-8") as f:
                    f.write(page.url)
            except Exception:
                pass

        # --> Assertions to verify final state
        try:
            # Ensure we can access the dashboard after login
            await page.goto("http://localhost:5000/dashboard", wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_load_state("networkidle", timeout=8000)
            current_url = page.url
            if "/sign-in" in current_url or "/sign-up" in current_url:
                # Capture diagnostics before failing
                try:
                    await page.screenshot(path=f"{diag_dir}/tc001-final.png", full_page=True)
                    html = await page.content()
                    with open(f"{diag_dir}/tc001-final.html", "w", encoding="utf-8") as f:
                        f.write(html)
                except Exception:
                    pass
                raise AssertionError("Test case failed: Redirected to sign-in/up instead of dashboard.")
            if "/dashboard" not in current_url:
                try:
                    await page.screenshot(path=f"{diag_dir}/tc001-final.png", full_page=True)
                    html = await page.content()
                    with open(f"{diag_dir}/tc001-final.html", "w", encoding="utf-8") as f:
                        f.write(html)
                except Exception:
                    pass
                raise AssertionError(f"Test case failed: Expected /dashboard, got {current_url}")
        except async_api.Error:
            raise AssertionError("Test case failed: Unable to reach /dashboard after registration/login.")
        await asyncio.sleep(2)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    
