from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Get the absolute path to the HTML file
    file_path = "file://" + os.path.abspath("docs/index.html")
    page.goto(file_path)

    # 1. Load an image
    image_content = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="lightgray" /></svg>'
    dummy_image_filename = "dummy_image.svg"
    with open(dummy_image_filename, "w") as f:
        f.write(image_content)

    page.set_input_files('input[type="file"]', dummy_image_filename)

    page.wait_for_selector("#editor-canvas:not(.hidden)", timeout=5000)
    time.sleep(1)

    # 2. Click the "Draw" button
    page.click('button[title="Desenhar"]')
    time.sleep(0.5)

    # 3. Change brush color to blue
    # The color input is hidden, so we need to evaluate JS to set its value
    page.evaluate("document.querySelector('input[type=color]').value = '#0000FF'")
    # Dispatch an 'input' event to trigger the color change listener
    page.evaluate("document.querySelector('input[type=color]').dispatchEvent(new Event('input'))")
    time.sleep(0.5)

    # 4. Change brush size to large
    page.click("#brush-size-lg-btn")
    time.sleep(0.5)

    # 5. Draw a line
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()
    time.sleep(0.5)

    # 6. Take a screenshot
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
    screenshot_path = os.path.join(screenshot_dir, "color_size_verification.png")
    page.screenshot(path=screenshot_path)

    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

    os.remove(dummy_image_filename)

with sync_playwright() as playwright:
    run(playwright)
