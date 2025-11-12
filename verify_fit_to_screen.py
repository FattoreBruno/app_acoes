from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    file_path = "file://" + os.path.abspath("docs/index.html")
    page.goto(file_path)

    # 1. Load a rectangular (non-square) image
    image_content = '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="teal" /></svg>'
    dummy_image_filename = "dummy_rectangular_image.svg"
    with open(dummy_image_filename, "w") as f:
        f.write(image_content)

    page.set_input_files('input[type="file"]', dummy_image_filename)
    page.wait_for_selector("#editor-canvas:not(.hidden)", timeout=5000)
    time.sleep(1)

    # 2. Zoom In
    page.click("#zoom-in-btn")
    time.sleep(0.5)
    page.click("#zoom-in-btn") # Zoom in twice
    time.sleep(1)

    # 3. Reset Zoom
    page.click("#reset-zoom-btn")
    time.sleep(1)

    # 4. Activate Draw Mode and draw a line
    page.click('button[title="Desenhar"]')
    time.sleep(0.5)
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()
    time.sleep(0.5)

    # 5. Take a screenshot
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
    screenshot_path = os.path.join(screenshot_dir, "fit_to_screen_verification.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()
    os.remove(dummy_image_filename)

with sync_playwright() as playwright:
    run(playwright)
