#!/usr/bin/env python3
"""
build.py - generates the static HTML pages so the header, footer, fonts and
icon library are defined ONCE instead of copy-pasted into every file.

    python3 build.py

Edit the templates below (or the page bodies), run it again, commit the HTML.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "_src"

FONTS = ("https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800"
         "&family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap")
ICONS = "vendor/boxicons/css/boxicons.min.css"
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
           "%3Crect width='64' height='64' rx='14' fill='%23111'/%3E%3Ctext x='32' y='43' font-size='30' "
           "text-anchor='middle' fill='%23fff' font-family='Georgia,serif'%3EVV%3C/text%3E%3C/svg%3E")
IMG_FALLBACK = "onerror=\"this.onerror=null;this.src='img/placeholder.svg'\""

NAV = [("home", "index.html", "home"), ("shop", "shop.html", "shop all"),
       ("story", "ourstory.html", "our story"), ("contact", "contact.html", "contact")]


def header(active):
    items = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == active else ""
        items.append(f'            <li><a href="{href}"{cur}>{label}</a></li>')
    cur = ' aria-current="page"' if active == "login" else ""
    items.append(f'            <li><a href="login.html" data-auth-link{cur}>sign in</a></li>')
    return f"""    <a class="skip-link" href="#main">Skip to content</a>
    <header>
        <a href="index.html" class="logo"><h1>velvet vogue</h1></a>
        <ul class="navmenu">
{chr(10).join(items)}
        </ul>
        <div class="nav-icon">
            <a href="shop.html" aria-label="Search"><i class='bx bx-search-alt'></i></a>
            <a href="login.html" aria-label="Sign in"><i class='bx bx-user'></i></a>
            <a href="cart.html" aria-label="Cart"><i class='bx bx-cart'></i></a>
            <a href="wishlist.html" aria-label="Wishlist"><i class='bx bx-heart'></i></a>
            <div class="bx bx-menu" id="menu-icon"></div>
        </div>
    </header>"""


FOOTER = """    <footer class="contact">
        <div class="contact-info">
            <div class="first-info">
                <h1>Velvet Vogue</h1>
                <p>32, Unknown Street, Colombo, Sri Lanka.</p>
                <p><a href="tel:+94113456782">0113456782</a></p>
                <p><a href="mailto:info@velvetvogue.lk">info@velvetvogue.lk</a></p>
            </div>

            <div class="social">
                <h4>Follow Us On</h4>
                <p><a href="https://facebook.com" rel="noopener"><i class='bx bxl-facebook'></i> Facebook</a></p>
                <p><a href="https://twitter.com" rel="noopener"><i class='bx bxl-twitter'></i> Twitter</a></p>
                <p><a href="https://instagram.com" rel="noopener"><i class='bx bxl-instagram'></i> Instagram</a></p>
                <p><a href="https://linkedin.com" rel="noopener"><i class='bx bxl-linkedin'></i> Linkedin</a></p>
            </div>

            <div class="second-info">
                <h4>Quick Links</h4>
                <p><a href="index.html">Home</a></p>
                <p><a href="shop.html">Shop All</a></p>
                <p><a href="wishlist.html">Wishlist</a></p>
                <p><a href="ourstory.html">Our Story</a></p>
                <p><a href="contact.html">Contact Us</a></p>
            </div>

            <div class="third-info">
                <h4>Support</h4>
                <p><a href="faq.html">FAQ</a></p>
                <p><a href="shipping-returns.html">Shipping &amp; Returns</a></p>
                <p><a href="privacy-terms.html">Terms &amp; Privacy</a></p>
                <p><a href="profile.html">My Orders</a></p>
            </div>

            <div class="fourth-info">
                <h4>Categories</h4>
                <p><a href="shop.html?category=new-arrivals">New Arrivals</a></p>
                <p><a href="shop.html?category=denim">Denim Collection</a></p>
                <p><a href="shop.html?category=casual-wear">Casual Wear</a></p>
                <p><a href="shop.html?category=formal-wear">Formal Wear</a></p>
                <p><a href="shop.html?category=summer-collection">Summer Collection</a></p>
                <p><a href="shop.html?category=luxury-collection">Luxury Collection</a></p>
            </div>
        </div>
    </footer>"""


def page(fname, title, desc, main, active=None, css=None, js=None, footer=True, fix_imgs=False):
    css_links = "".join(f'\n    <link rel="stylesheet" href="css/pages/{c}.css">' for c in (css or []))
    js_links = "".join(f'\n    <script src="js/pages/{j}.js"></script>' for j in (js or []))
    if fix_imgs:
        main = re.sub(r"<img (?!onerror)", f"<img {IMG_FALLBACK} ", main)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="theme-color" content="#111111">
    <link rel="icon" href="{FAVICON}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="{FONTS}" rel="stylesheet">
    <link href="{ICONS}" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">{css_links}
</head>
<body>
{header(active)}

    <main id="main">
{main}
    </main>
{FOOTER if footer else ""}
    <script src="js/products.js"></script>
    <script src="js/backend.js"></script>
    <script src="js/app.js"></script>{js_links}
</body>
</html>
"""
    (ROOT / fname).write_text(html, encoding="utf-8")
    print("built", fname)


def src(name):
    s = (SRC / name).read_text(encoding="utf-8")
    s = re.sub(r"<!--\s*Footer\s*-->", "", s)
    return s.strip()


def section(html, cls):
    m = re.search(rf'<section class="{cls}"[^>]*>.*?</section>', html, re.S)
    return m.group(0)


def grid(id_, label):
    return f'<div class="products" id="{id_}" aria-live="polite" aria-label="{label}">\n            <!-- filled by js/pages/index.js -->\n        </div>'


# ═════════════════════════ HOME ═════════════════════════
orig_index = (SRC / "index.orig.html").read_text(encoding="utf-8").replace("\r", "")
hero = section(orig_index, "main-home").replace('href="shop.html" class="main-button"', 'href="shop.html?category=denim" class="main-button"')
reviews = section(orig_index, "client-review")
updates = section(orig_index, "new-updates")

index_main = f"""        {hero}

        <section class="best-sellers" id="new">
            <div class="center-text">
                <h2><span>New </span>Arrivals</h2>
            </div>
            {grid("arrivals", "New arrivals")}
            <p style="text-align:center;margin-top:10px"><a class="btn secondary" href="shop.html?category=new-arrivals">See all new arrivals</a></p>
        </section>

        <section class="denim-edit">
            <div class="section-head">
                <div class="center-text" style="flex:1"><h2 style="background:transparent"><span>The </span>Denim Edit</h2></div>
            </div>
            {grid("denim", "Denim collection")}
            <p style="text-align:center;margin-top:10px"><a class="btn" href="shop.html?category=denim">Shop the Denim Collection</a></p>
        </section>

        {reviews}

        {updates}"""
page("index.html", "Velvet Vogue | Women's Fashion, Colombo",
     "Velvet Vogue is a Colombo women's fashion store: dresses, denim and everyday pieces with islandwide delivery.",
     index_main, active="home", js=["index"], fix_imgs=True)

# ═════════════════════════ SHOP ═════════════════════════
shop_main = """        <section class="page-hero">
            <p class="crumbs"><a href="index.html">Home</a> › <span id="crumb-current">Shop All</span></p>
            <h2 id="shop-title">Shop All</h2>
            <p id="shop-sub">Dresses, denim and everyday pieces, designed in Colombo.</p>
        </section>

        <section class="shop-wrap">
            <div class="shop-toolbar">
                <div class="chips" id="chips" role="group" aria-label="Filter by category"></div>
                <div class="shop-controls">
                    <input type="search" id="shop-q" placeholder="Search products" aria-label="Search products" maxlength="80">
                    <select id="shop-price" aria-label="Filter by price">
                        <option value="">Any price</option>
                        <option value="0-6999">Under LKR 7,000</option>
                        <option value="7000-9000">LKR 7,000 - 9,000</option>
                        <option value="9001-">Over LKR 9,000</option>
                    </select>
                    <select id="shop-sort" aria-label="Sort products">
                        <option value="">Featured</option>
                        <option value="price_asc">Price: low to high</option>
                        <option value="price_desc">Price: high to low</option>
                        <option value="rating">Top rated</option>
                        <option value="name">Name: A to Z</option>
                    </select>
                </div>
            </div>
            <p class="shop-count" id="shop-count" aria-live="polite">Loading products...</p>
            <div class="products" id="shop-grid"></div>
            <nav class="pagination" id="pagination" aria-label="Pagination"></nav>
        </section>"""
page("shop.html", "Shop All | Velvet Vogue", "Browse every Velvet Vogue piece. Filter by category, search, sort by price.",
     shop_main, active="shop", js=["shop"])

# ═════════════════════════ PRODUCT ═════════════════════════
product_main = """        <div class="pd-wrap">
            <p class="crumbs"><a href="index.html">Home</a> › <a href="shop.html">Shop All</a> › <span id="pd-crumb">Product</span></p>
            <div id="pd-root" aria-live="polite">
                <div class="pd-grid"><div class="skeleton pd-image"></div><div><div class="skeleton" style="height:40px;margin-bottom:16px"></div><div class="skeleton" style="height:24px;width:40%;margin-bottom:16px"></div><div class="skeleton" style="height:120px"></div></div></div>
            </div>
            <section class="related" id="related" hidden style="padding:0">
                <h2>You may also like</h2>
                <div class="products" id="related-grid"></div>
            </section>
        </div>"""
page("product.html", "Product | Velvet Vogue", "Product details, sizes and colours.", product_main, active="shop", js=["product"])

# ═════════════════════════ CART (original design, new logic) ═════════════════════════
cart_main = src("cart.main.html").replace("Home</a> › <a", "Home</a> › <a")
page("cart.html", "Your Cart | Velvet Vogue", "Review the items in your cart.", cart_main, css=["cart"], js=["cart"], fix_imgs=True)

# ═════════════════════════ CHECKOUT ═════════════════════════
checkout_main = """        <div class="co-wrap">
            <p class="crumbs"><a href="index.html">Home</a> › <a href="cart.html">Cart</a> › Checkout</p>
            <h1>Checkout</h1>
            <p style="color:#666">Delivery within Sri Lanka. Pay in cash when your order arrives.</p>

            <div class="co-grid">
                <form id="checkout-form" class="co-card" novalidate>
                    <h3>Delivery details</h3>
                    <div class="form-msg" id="co-msg" role="alert"></div>
                    <div class="vf-row">
                        <div class="vf-group"><label for="co-name">Full name</label><input id="co-name" name="delivery_name" autocomplete="name" required maxlength="150"></div>
                        <div class="vf-group"><label for="co-phone">Phone number</label><input id="co-phone" name="delivery_phone" type="tel" autocomplete="tel" placeholder="077 123 4567" required maxlength="20"></div>
                    </div>
                    <div class="vf-group"><label for="co-address">Street address</label><input id="co-address" name="delivery_address" autocomplete="street-address" placeholder="House no., street, area" required maxlength="500"></div>
                    <div class="vf-group"><label for="co-city">City</label><input id="co-city" name="delivery_city" autocomplete="address-level2" placeholder="Colombo" required maxlength="100"></div>
                    <div class="vf-group"><label for="co-notes">Order notes <span style="font-weight:400;color:#888">(optional)</span></label><textarea id="co-notes" name="notes" maxlength="500" placeholder="Landmarks, preferred delivery time..."></textarea></div>

                    <h3 style="margin-top:26px">Payment</h3>
                    <div class="pay-option"><i class='bx bx-money'></i><div><b>Cash on delivery</b><span>Pay the courier when your order arrives.</span></div></div>
                    <div class="pay-option disabled"><i class='bx bx-credit-card'></i><div><b>Card payment</b><span>Coming soon.</span></div></div>

                    <button class="btn block" id="co-submit" type="submit" style="margin-top:22px"><i class='bx bx-check-circle'></i> Place order</button>
                </form>

                <aside class="co-summary" aria-label="Order summary">
                    <h3>Order summary</h3>
                    <div id="co-items"></div>
                    <div id="co-totals"></div>
                    <a href="cart.html" style="display:block;margin-top:14px;font-size:.88rem;color:#5277bc;font-weight:600">Edit cart</a>
                </aside>
            </div>
        </div>"""
page("checkout.html", "Checkout | Velvet Vogue", "Enter your delivery details and place your order.", checkout_main, js=["checkout"])

# ═════════════════════════ ORDER CONFIRMATION ═════════════════════════
conf_main = """        <div class="conf-wrap" id="conf-root" aria-live="polite">
            <div class="state-box"><i class='bx bx-loader-alt bx-spin'></i><p>Loading your order...</p></div>
        </div>"""
page("order-confirmation.html", "Order Confirmed | Velvet Vogue", "Your Velvet Vogue order.", conf_main, js=["confirmation"])

# ═════════════════════════ LOGIN (original design) ═════════════════════════
login_main = src("login.main.html")
login_main = login_main.replace("Min. 6 characters", "Min. 8 characters, with a number")
login_main = login_main.replace('<a href="#">Forgot your password?</a>', '<a href="contact.html?topic=account">Forgot your password?</a>')
login_main = login_main.replace('<a href="#" style="color:#5277bc;">Terms & Privacy Policy</a>', '<a href="privacy-terms.html" target="_blank" rel="noopener" style="color:#5277bc;">Terms &amp; Privacy Policy</a>')
login_main = re.sub(r'<a href="#" style="color:#5277bc; font-weight:600;" onclick="switchTab\(\'register\'\)">',
                    '<a href="#" class="switch-link" data-switch="register" style="color:#5277bc; font-weight:600;">', login_main)
login_main = re.sub(r'<a href="#" style="color:#5277bc; font-weight:600;" onclick="switchTab\(\'login\'\)">',
                    '<a href="#" class="switch-link" data-switch="login" style="color:#5277bc; font-weight:600;">', login_main)
login_main = login_main.replace('<div class="auth-alert" id="auth-alert"></div>', '<div class="auth-alert" id="auth-alert" role="alert"></div>')
page("login.html", "Sign In | Velvet Vogue", "Sign in or create your Velvet Vogue account.", login_main,
     active="login", css=["login"], js=["login"], footer=False)

# ═════════════════════════ PROFILE (original design) ═════════════════════════
profile_main = src("profile.main.html")
profile_main = profile_main.replace(
    '<div class="profile-avatar">\n                <i class=\'bx bx-user\'></i>\n            </div>',
    '<div class="profile-avatar" id="avatar" role="button" tabindex="0" aria-label="Change profile photo">\n'
    '                <i class=\'bx bx-user\' id="avatar-icon"></i>\n'
    '                <span class="avatar-edit">Change</span>\n'
    '                <input type="file" id="avatar-input" accept="image/jpeg,image/png,image/webp" hidden>\n'
    '            </div>')
profile_main = profile_main.replace(
    '<input type="email" id="pf-email" placeholder="your@email.com">',
    '<input type="email" id="pf-email" placeholder="your@email.com" disabled>\n                    <p class="pf-hint">To change your email, contact us.</p>')
profile_main = profile_main.replace('placeholder="Min. 6 characters"', 'placeholder="Min. 8 characters, with a number"')
profile_main = profile_main.replace('onclick="saveProfile()"', 'id="save-profile"').replace('onclick="changePassword()"', 'id="change-password"').replace('onclick="logout()"', 'id="logout"')
profile_main = profile_main.replace('<div class="profile-tab', '<div role="button" tabindex="0" class="profile-tab')
page("profile.html", "My Account | Velvet Vogue", "Your orders, details and password.", profile_main, css=["profile"], js=["profile"])

# ═════════════════════════ WISHLIST ═════════════════════════
wish_main = """        <section class="page-hero">
            <p class="crumbs"><a href="index.html">Home</a> › Wishlist</p>
            <h2>Your wishlist</h2>
            <p>Pieces you have saved for later.</p>
        </section>
        <section class="shop-wrap">
            <div id="wish-root" aria-live="polite"><div class="products">__SK__</div></div>
        </section>""".replace("__SK__", "".join('<div class="skeleton card" aria-hidden="true"></div>' for _ in range(4)))
page("wishlist.html", "Wishlist | Velvet Vogue", "Items you have saved.", wish_main, js=["wishlist"])

# ═════════════════════════ CONTACT (original design) ═════════════════════════
contact_main = src("contact.main.html")
contact_main = contact_main.replace('<option value="other">Other</option>', '<option value="account">Account &amp; Password</option>\n                    <option value="other">Other</option>')
contact_main = contact_main.replace('<div class="cf-alert" id="cf-alert"></div>',
    '<div class="cf-alert" id="cf-alert" role="alert"></div>\n'
    '            <div style="position:absolute;left:-9999px;" aria-hidden="true"><label for="cf-website">Leave this empty</label><input type="text" id="cf-website" tabindex="-1" autocomplete="off"></div>')
contact_main = contact_main.replace('<p>+94 11 345 6782</p>', '<p><a href="tel:+94113456782">+94 11 345 6782</a></p>')
contact_main = contact_main.replace('<p>info@velvetvogue.lk</p>', '<p><a href="mailto:info@velvetvogue.lk">info@velvetvogue.lk</a></p>')
contact_main = contact_main.replace("Standard delivery within Colombo takes 2–3 business days. Island-wide delivery takes 4–7 business days.",
                                    "Colombo orders arrive in 2–3 business days. Island-wide delivery takes 4–7 business days.")
contact_main = contact_main.replace("Once your order is dispatched, you'll receive an email with a tracking number. You can also check your order status in your account dashboard.",
                                    "Sign in and open My Account to see the status of every order you have placed.")
contact_main = contact_main.replace('<h2>Frequently Asked Questions</h2>', '<h2>Frequently Asked Questions</h2>\n        <p style="text-align:center;margin:-8px 0 26px"><a href="faq.html" style="color:#5277bc;font-weight:600">See all questions</a></p>')
page("contact.html", "Contact Us | Velvet Vogue", "Questions about sizing, orders or returns? Send us a message.",
     contact_main, active="contact", css=["contact"], js=["contact"])

# ═════════════════════════ OUR STORY (original content) ═════════════════════════
story = (SRC / "ourstory.orig.html").read_text(encoding="utf-8").replace("\r", "")
story_main = section(story, "our-story-hero") + "\n\n        " + section(story, "story-details")
page("ourstory.html", "Our Story | Velvet Vogue", "How Velvet Vogue started and what we believe in.",
     story_main, active="story", fix_imgs=True)

# ═════════════════════════ FAQ ═════════════════════════
def faq(q, a):
    return f'<details class="faq"><summary>{q}</summary><p>{a}</p></details>'

faq_main = """        <section class="page-hero">
            <p class="crumbs"><a href="index.html">Home</a> › FAQ</p>
            <h2>Frequently asked questions</h2>
            <p>Quick answers about ordering, delivery and returns. Can't find yours? <a href="contact.html" style="color:#5277bc;font-weight:600">Message us</a>.</p>
        </section>
        <div class="faq-wrap">
            <div class="faq-group"><h3>Ordering</h3>
                __O__
            </div>
            <div class="faq-group"><h3>Delivery</h3>
                __D__
            </div>
            <div class="faq-group"><h3>Returns and refunds</h3>
                __R__
            </div>
            <div class="faq-group"><h3>Your account</h3>
                __A__
            </div>
        </div>"""
faq_main = faq_main.replace("__O__", "\n".join([
    faq("Do I need an account to shop?", "You can browse and fill your cart as a guest. You need an account to check out, so we can show your order history. Your guest cart moves into your account when you sign in."),
    faq("How do I pay?", "Cash on delivery is available now: pay the courier when your order arrives. Card payments are planned."),
    faq("How do promo codes work?", "Enter a code in your cart before checking out. The discount applies to the items, not to delivery."),
    faq("How do I choose my size?", "Pick a size and colour on the product page. If you are unsure, send us your measurements through the <a href='contact.html?topic=sizing' style='color:#5277bc'>contact form</a> and we will help."),
]))
faq_main = faq_main.replace("__D__", "\n".join([
    faq("How long does delivery take?", "Colombo orders arrive in 2–3 business days. The rest of Sri Lanka takes 4–7 business days."),
    faq("How much is delivery?", "LKR 350 per order. Delivery is free when your items total LKR 5,000 or more, before any promo discount."),
    faq("Do you ship internationally?", "Not yet. We deliver within Sri Lanka only."),
    faq("How do I check my order status?", "Sign in and open My Account. Each order shows its current status: pending, processing, shipped or delivered."),
]))
faq_main = faq_main.replace("__R__", "\n".join([
    faq("What is your return policy?", "You can return an item within 14 days of delivery if it is unworn, unwashed and has its tags attached. See <a href='shipping-returns.html' style='color:#5277bc'>Shipping &amp; Returns</a> for the full steps."),
    faq("When will I get my refund?", "Once we receive and check your return, we refund you within 7 business days."),
]))
faq_main = faq_main.replace("__A__", "\n".join([
    faq("I forgot my password. What do I do?", "Automatic password reset is not available yet. Send us a message from the <a href='contact.html?topic=account' style='color:#5277bc'>contact page</a> and we will help you get back in."),
    faq("How do I change my details or password?", "Open My Account, then choose Account Details or Password &amp; Security."),
]))
page("faq.html", "FAQ | Velvet Vogue", "Answers about ordering, delivery, returns and your account.", faq_main, active=None)

# ═════════════════════════ SHIPPING & RETURNS ═════════════════════════
ship_main = """        <section class="page-hero">
            <p class="crumbs"><a href="index.html">Home</a> › Shipping &amp; Returns</p>
            <h2>Shipping &amp; returns</h2>
            <p>What to expect after you place an order, and how to send something back.</p>
        </section>
        <div class="prose-wrap prose">
            <h3>Delivery</h3>
            <p>We deliver within Sri Lanka. Orders are packed and handed to our courier partner after they are placed.</p>
            <table>
                <thead><tr><th>Area</th><th>Delivery time</th><th>Fee</th></tr></thead>
                <tbody>
                    <tr><td>Colombo</td><td>2–3 business days</td><td>LKR 350, or free from LKR 5,000</td></tr>
                    <tr><td>Rest of Sri Lanka</td><td>4–7 business days</td><td>LKR 350, or free from LKR 5,000</td></tr>
                </tbody>
            </table>
            <p>The free delivery threshold is measured on the value of your items before any promo code discount.</p>

            <h3>Payment</h3>
            <p>Pay in cash when your order arrives. Please keep the amount ready for the courier.</p>

            <h3>Returns</h3>
            <p>We accept returns within 14 days of delivery. To be eligible, an item must be:</p>
            <ul>
                <li>unworn and unwashed</li>
                <li>in its original packaging with all tags attached</li>
            </ul>
            <p>To start a return, <a href="contact.html?topic=returns">send us a message</a> with your order number (it begins with VV-) and the item you want to return. We will reply with the next steps.</p>

            <h3>Refunds</h3>
            <p>When your return reaches us and passes a quick check, we refund the item price within 7 business days. The original delivery fee is not refunded unless the item was faulty or sent in error.</p>

            <h3>Damaged or wrong item</h3>
            <p>If something arrives damaged or is not what you ordered, <a href="contact.html?topic=order">contact us</a> within 48 hours of delivery with a photo and we will make it right.</p>
        </div>"""
page("shipping-returns.html", "Shipping & Returns | Velvet Vogue", "Delivery times, fees and our 14-day returns policy.", ship_main)

# ═════════════════════════ TERMS & PRIVACY ═════════════════════════
legal_main = """        <section class="page-hero">
            <p class="crumbs"><a href="index.html">Home</a> › Terms &amp; Privacy</p>
            <h2>Terms &amp; privacy</h2>
            <p>The short version of how we handle your orders and your data.</p>
        </section>
        <div class="prose-wrap prose">
            <p class="updated">Last updated: October 2026</p>

            <h3>Privacy: what we collect</h3>
            <p>Velvet Vogue runs entirely in your browser. There is no server behind this site, so nothing you enter is sent anywhere.</p>
            <ul>
                <li><b>Account details:</b> your name, email and a hashed password, saved on this device only.</li>
                <li><b>Optional details:</b> phone number, delivery address and profile photo, if you add them.</li>
                <li><b>Orders, cart and wishlist:</b> saved on this device only.</li>
                <li><b>Contact messages:</b> checked in your browser and kept on this device.</li>
            </ul>

            <h3>Cookies and storage</h3>
            <p>We do not use cookies. We use your browser's local storage to remember your cart, wishlist, account and orders. Clearing your browser data removes all of it. Fonts are loaded from Google Fonts, so that service will see a normal page request.</p>

            <h3>Your choices</h3>
            <p>You can update your details any time in My Account. To remove everything, clear this site's data in your browser settings.</p>

            <h3>Terms of sale</h3>
            <ul>
                <li>Prices are shown in Sri Lankan rupees (LKR). The price you see in your cart at checkout is the price you pay.</li>
                <li>An order is confirmed when you see your order number. We may cancel an order if an item turns out to be unavailable, and will tell you if so.</li>
                <li>Delivery and returns are covered in <a href="shipping-returns.html">Shipping &amp; Returns</a>.</li>
                <li>Promo codes cannot be combined and may expire.</li>
            </ul>

            <h3>Questions</h3>
            <p>Email <a href="mailto:info@velvetvogue.lk">info@velvetvogue.lk</a> or use the <a href="contact.html">contact form</a>.</p>
        </div>"""
page("privacy-terms.html", "Terms & Privacy | Velvet Vogue", "How Velvet Vogue handles your data and orders.", legal_main)

# ═════════════════════════ 404 ═════════════════════════
nf_main = """        <section class="notfound">
            <div>
                <h1>404</h1>
                <p>That page doesn't exist, or it has moved.</p>
                <a class="btn" href="index.html">Back to the home page</a>
                <a class="btn secondary" href="shop.html" style="margin-left:8px">Browse the shop</a>
            </div>
        </section>"""
page("404.html", "Page not found | Velvet Vogue", "Page not found.", nf_main, footer=False)
