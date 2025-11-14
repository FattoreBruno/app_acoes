
from playwright.sync_api import sync_playwright, expect
import os

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
        f.write('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="lightgray" /></svg>')

    page.set_input_files('input[type="file"]', dummy_image_path)

    expect(page.locator("#editor-canvas")).not_to_have_class("hidden", timeout=5000)

    # 2. Click the "Draw" button to open the menu
    draw_button = page.locator('button[title="Desenhar"]')
    draw_button.click()
    pencil_menu = page.locator("#pencil-menu")
    expect(pencil_menu).to_be_visible()

    # 3. Change brush color to blue
    blue_swatch = page.locator(".bg-blue-500")
    blue_swatch.click()

    # 4. Change brush size using the correct slider ID
    size_slider = page.locator("#size-slider")
    size_slider.fill("80")

    # 5. Close the pencil menu by clicking the Draw button again
    draw_button.click()
    expect(pencil_menu).to_be_hidden()

    # 6. Draw a line
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()

    # 7. Take a screenshot
    screenshot_path = os.path.join(screenshot_dir, "color_size_verification.png")
    page.screenshot(path=screenshot_path)

    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

    # Clean up the dummy image
    os.remove(dummy_image_path)

with sync_playwright() as playwright:
    run(playwright)
