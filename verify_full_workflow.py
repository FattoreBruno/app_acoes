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
    image_content = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="lightyellow" /></svg>'
    dummy_image_filename = "dummy_image.svg"
    with open(dummy_image_filename, "w") as f:
        f.write(image_content)

    page.set_input_files('input[type="file"]', dummy_image_filename)
    page.wait_for_selector("#editor-canvas:not(.hidden)", timeout=5000)
    time.sleep(1)

    # 2. Activate Draw Mode
    page.click('button[title="Desenhar"]')
    time.sleep(0.5)

    # 3. Set Color to Magenta
    magenta_swatch = page.locator(".bg-pink-500")
    magenta_swatch.click()
    time.sleep(0.5)

    # 4. Set Brush Size to Large
    size_slider = page.locator("#brush-size-slider")
    size_slider.fill("80")
    time.sleep(0.5)

    # Close the pencil menu
    page.click("#close-pencil-menu")
    time.sleep(0.5)

    # 5. Draw a diagonal line
    canvas = page.locator("#drawing-canvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(150, 150)
    page.mouse.move(450, 350)
    page.mouse.up()
    time.sleep(0.5)

    # 6. Activate Eraser Mode
    page.click('button[title="Borracha"]')
    time.sleep(0.5)

    # 7. Set Eraser (Brush) Size to Medium
    page.click('button[title="Desenhar"]')
    time.sleep(0.5)
    size_slider.fill("40")
    time.sleep(0.5)
    page.click("#close-pencil-menu")
    time.sleep(0.5)

    # 8. Erase a chunk in the middle of the line
    page.mouse.down()
    page.mouse.move(280, 230)
    page.mouse.move(320, 270)
    page.mouse.up()
    time.sleep(0.5)

    # 9. Take final screenshot
    screenshot_dir = "verification"
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
    screenshot_path = os.path.join(screenshot_dir, "final_drawing_verification.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()
    os.remove(dummy_image_filename)

with sync_playwright() as playwright:
    run(playwright)
