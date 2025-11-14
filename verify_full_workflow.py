
from playwright.sync_api import sync_playwright, expect
import os
import re

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Create verification directory
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)

    file_path = "file://" + os.path.abspath("docs/index.html")
    page.goto(file_path)

    # 1. Load an image
    dummy_image_path = os.path.join(screenshot_dir, "dummy_image.svg")
    with open(dummy_image_path, "w") as f:
        f.write('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="lightyellow" /></svg>')

    page.set_input_files('input[type="file"]', dummy_image_path)
    expect(page.locator("#editor-canvas")).not_to_have_class("hidden", timeout=5000)

    # 2. Open Pencil Menu to set brush properties
    draw_button = page.locator('button[title="Desenhar"]')
    draw_button.click()
    pencil_menu = page.locator("#pencil-menu")
    expect(pencil_menu).to_be_visible()

    # 3. Set Color to Magenta
    magenta_swatch = page.locator(".bg-pink-500")
    magenta_swatch.click()

    # 4. Set Brush Size to Large
    size_slider = page.locator("#size-slider")
    size_slider.fill("80")

    # 5. Close the pencil menu
    draw_button.click()
    expect(pencil_menu).to_be_hidden()

    # 6. Draw a diagonal line
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(150, 150)
    page.mouse.move(450, 350)
    page.mouse.up()

    # 7. Activate Eraser Mode
    eraser_button = page.locator('button[title="Borracha"]')
    eraser_button.click()
    expect(eraser_button).to_have_attribute("class", re.compile(r"bg-primary/20"))

    # 8. Erase a chunk in the middle of the line (Brush size is already large)
    page.mouse.down()
    page.mouse.move(280, 230)
    page.mouse.move(320, 270)
    page.mouse.up()

    # 9. Take final screenshot
    screenshot_path = os.path.join(screenshot_dir, "full_workflow_verification.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()
    os.remove(dummy_image_path)

with sync_playwright() as playwright:
    run(playwright)
