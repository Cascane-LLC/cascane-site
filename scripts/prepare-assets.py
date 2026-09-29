"""Copy + crop the store images and the app icon into the site.

Originals are only ever opened for reading:
  ~/Desktop/app store photos dupe/app store files/*.png   (1320x2868 store images)
  ~/Downloads/cascane/assets/icons/app_icon.png           (1024x1024 app icon)
Outputs are written inside this repo. Re-running is safe (overwrites outputs).
"""
from pathlib import Path
from PIL import Image, ImageDraw

HOME = Path.home()
STORE = HOME / 'Desktop/app store photos dupe/app store files'
ICON = HOME / 'Downloads/cascane/assets/icons/app_icon.png'
ROOT = Path(__file__).resolve().parent.parent
SCREENS = ROOT / 'src/assets/screens'
AVATARS = ROOT / 'src/assets/avatars'
PUBLIC = ROOT / 'public'

# The phone panel sits at the same place in every store image (measured 2026-09-29).
PANEL = (164, 614, 1155, 2706)  # left, top, right, bottom -> 991 x 2092
PANEL_RADIUS = 122
SS = 4  # supersampling factor for anti-aliased masks

SCREEN_NAMES = ['chat_page', 'convos_page', 'inbox_page', 'channel_info_page', 'profile_page']

# Avatar centres in chat_page.png (full-res px) and the crop radius that stays
# inside each photo circle, clear of the ring and reaction badges.
AVATAR_CENTRES = {
    'ethan': (659, 1148), 'natalie': (933, 1371), 'austin': (659, 1585),
    'anna': (376, 1808), 'nate': (659, 2037), 'tyler': (933, 2254),
}
AVATAR_RADIUS = 80
AVATAR_SIZE = 160

# A "photo" for the photo-attachment illustration: the Starspace channel artwork
# in channel_info_page.png, cropped square from inside its grey circle.
PHOTO_BOX = (577, 930, 767, 1120)  # 190 x 190
PHOTOS = ROOT / 'src/assets/photos'


def rounded_mask(size, radius, inset=0):
    w, h = size
    m = Image.new('L', (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        (inset * SS, inset * SS, (w - inset) * SS - 1, (h - inset) * SS - 1),
        radius=radius * SS, fill=255)
    return m.resize(size, Image.LANCZOS)


def circle_mask(size):
    m = Image.new('L', (size * SS, size * SS), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size * SS - 1, size * SS - 1), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def screens():
    SCREENS.mkdir(parents=True, exist_ok=True)
    for name in SCREEN_NAMES:
        with Image.open(STORE / f'{name}.png') as src:
            assert src.size == (1320, 2868), f'{name}: unexpected size {src.size}'
            panel = src.convert('RGB').crop(PANEL)
        panel.putalpha(rounded_mask(panel.size, PANEL_RADIUS, inset=1))
        panel.save(SCREENS / f'{name}.png', optimize=True)
        print('screen', name, panel.size)


def avatars():
    AVATARS.mkdir(parents=True, exist_ok=True)
    with Image.open(STORE / 'chat_page.png') as src:
        rgb = src.convert('RGB')
    for name, (cx, cy) in AVATAR_CENTRES.items():
        r = AVATAR_RADIUS
        face = rgb.crop((cx - r, cy - r, cx + r, cy + r)).resize((AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)
        face.putalpha(circle_mask(AVATAR_SIZE))
        face.save(AVATARS / f'{name}.png', optimize=True)
        print('avatar', name)


def icons():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    with Image.open(ICON) as src:
        icon = src.convert('RGB')
    assert icon.size == (1024, 1024)
    icon.save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    for size, name in [(48, 'favicon-48.png'), (96, 'favicon-96.png'), (180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
        icon.resize((size, size), Image.LANCZOS).save(PUBLIC / name, optimize=True)
    # Rounded mark used in the nav, footer and download band (cyan tile, five dots).
    mark = icon.resize((256, 256), Image.LANCZOS)
    mark.putalpha(rounded_mask(mark.size, 58))
    (ROOT / 'src/assets').mkdir(parents=True, exist_ok=True)
    mark.save(ROOT / 'src/assets/mark.png', optimize=True)
    print('icons ok')


def photos():
    PHOTOS.mkdir(parents=True, exist_ok=True)
    with Image.open(STORE / 'channel_info_page.png') as src:
        art = src.convert('RGB').crop(PHOTO_BOX)
    art.save(PHOTOS / 'starspace.png', optimize=True)
    print('photo starspace', art.size)


if __name__ == '__main__':
    screens()
    avatars()
    icons()
    photos()
