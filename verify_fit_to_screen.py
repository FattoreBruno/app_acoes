
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

    file_path = "file://" + os.path.abspath("docs/index.html")
    page.goto(file_path)

    # 1. Load a rectangular (non-square) image
    dummy_image_path = os.path.join(screenshot_dir, "dummy_rectangular_image.svg")
    with open(dummy_image_path, "w") as f:
        f.write('<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="teal" /></svg>')

    page.set_input_files('input[type="file"]', dummy_image_path)
    expect(page.locator("#editor-canvas")).not_to_have_class("hidden", timeout=5000)

    # 2. Zoom In
    zoom_in_button = page.locator("#zoom-in-btn")
    zoom_in_button.click()
    zoom_in_button.click() # Zoom in twice
    expect(page.locator("#zoom-percentage-input")).to_have_value("120%")


    # 3. Reset Zoom
    page.locator("#reset-zoom-btn").click()
    expect(page.locator("#zoom-percentage-input")).to_have_value("100%")

    # 4. Activate Draw Mode and draw a line
    draw_button = page.locator('button[title="Desenhar"]')
    draw_button.click()
    pencil_menu = page.locator("#pencil-menu")
    expect(pencil_menu).to_be_visible()
    draw_button.click() # Close the menu
    expect(pencil_menu).to_be_hidden()

    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.move(400, 250)
    page.mouse.up()

    # 5. Take a screenshot
    screenshot_path = os.path.join(screenshot_dir, "fit_to_screen_verification.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()
    os.remove(dummy_image_path)

with sync_playwright() as playwright:
    run(playwright)
