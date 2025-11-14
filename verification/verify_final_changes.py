import os
from playwright.sync_api import sync_playwright, expect

def run_verification(page):
    # Get the absolute path for the local HTML file
    file_path = os.path.abspath('docs/index.html')
    page.goto(f'file://{file_path}')

    # Use a known image from the verification folder
    image_path = os.path.abspath('verification/fit_to_screen_verification.png')

    # Directly set the file on the hidden file input
    page.locator('#file-input').set_input_files(image_path)

    # Wait for the image to be loaded and the canvas to be drawn
    page.wait_for_function("() => window.imageLoaded === true")

    # Verify that the zoom level is initially 100%
    expect(page.locator("#zoom-percentage-input")).to_have_value("100%")

    # Click the zoom in button and verify the zoom level changes
    page.get_by_title("Zoom In").click()
    expect(page.locator("#zoom-percentage-input")).to_have_value("110%")

    # Click the reset zoom button and verify it returns to 100%
    page.get_by_title("Redefinir Zoom").click()
    expect(page.locator("#zoom-percentage-input")).to_have_value("100%")

    # Test drawing on the canvas
    canvas = page.locator('#drawing-canvas')
    canvas.click(position={'x': 100, 'y': 100})
    canvas.drag_to(page.locator('#drawing-canvas'), target_position={'x': 200, 'y': 200})

    # Take a screenshot for visual confirmation
    page.screenshot(path="verification/final_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()
