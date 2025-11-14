
from playwright.sync_api import sync_playwright, expect
import os
import re

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Create verification directory if it doesn't exist
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)

    # Get the absolute path to the HTML file
    file_path = "file://" + os.path.abspath("docs/index.html")
    page.goto(file_path)

    # 1. Load an image
    dummy_image_path = os.path.join(screenshot_dir, "dummy_image.svg")
    with open(dummy_image_path, "w") as f:
        f.write('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red" /></svg>')

    page.set_input_files('input[type="file"]', dummy_image_path)
    expect(page.locator("#editor-canvas")).not_to_have_class("hidden", timeout=5000)

    # 2. Activate draw mode to be able to draw a line
    draw_button = page.locator('button[title="Desenhar"]')
    draw_button.click()
    pencil_menu = page.locator("#pencil-menu")
    expect(pencil_menu).to_be_visible()
    # Close the menu to be able to draw on the canvas
    draw_button.click()
    expect(pencil_menu).to_be_hidden()

    # 3. Draw a line on the canvas
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()

    # 4. Click the "Eraser" button and verify it's active
    eraser_button = page.locator('button[title="Borracha"]')
    eraser_button.click()
    expect(eraser_button).to_have_attribute("class", re.compile(r"bg-primary/20"))


    # 5. "Draw" (erase) over the line
    page.mouse.down()
    page.mouse.move(250, 180)
    page.mouse.move(350, 280)
    page.mouse.up()

    # 6. Take a screenshot
    screenshot_path = os.path.join(screenshot_dir, "eraser_mode_verification.png")
    page.screenshot(path=screenshot_path)

    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

    # Clean up the dummy file
    os.remove(dummy_image_path)

with sync_playwright() as playwright:
    run(playwright)
