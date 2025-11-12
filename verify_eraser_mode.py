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
    # Create a dummy SVG file for upload, as it's a valid image format
    image_content = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red" /></svg>'
    dummy_image_filename = "dummy_image.svg"
    with open(dummy_image_filename, "w") as f:
        f.write(image_content)

    page.set_input_files('input[type="file"]', dummy_image_filename)

    # Wait for the image to be loaded and the canvas to be visible
    page.wait_for_selector("#editor-canvas:not(.hidden)", timeout=5000)
    time.sleep(1) # Give it a moment to render

    # 2. Click the "Draw" button
    page.click('button[title="Desenhar"]')
    time.sleep(0.5)

    # 3. Draw a line on the canvas
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()
    time.sleep(0.5)

    # 4. Click the "Eraser" button
    page.click('button[title="Borracha"]')
    time.sleep(0.5)

    # 5. "Draw" (erase) over the line
    page.mouse.down()
    page.mouse.move(250, 180)
    page.mouse.move(350, 280)
    page.mouse.up()
    time.sleep(0.5)

    # 6. Take a screenshot
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
    screenshot_path = os.path.join(screenshot_dir, "eraser_mode_verification.png")
    page.screenshot(path=screenshot_path)

    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

    # Clean up the dummy file
    os.remove(dummy_image_filename)

with sync_playwright() as playwright:
    run(playwright)
