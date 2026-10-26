/* ============================================================
   products.js - the whole catalogue lives here (no server needed).
   To add or change a product, edit this file. Images are looked up
   in /img by the file name given in `image`.
   ============================================================ */
(function () {
    'use strict';

    const CATEGORIES = [
        { id: 1, name: 'New Arrivals',      slug: 'new-arrivals' },
        { id: 2, name: 'Casual Wear',       slug: 'casual-wear' },
        { id: 3, name: 'Formal Wear',       slug: 'formal-wear' },
        { id: 4, name: 'Summer Collection', slug: 'summer-collection' },
        { id: 5, name: 'Winter Collection', slug: 'winter-collection' },
        { id: 6, name: 'Luxury Collection', slug: 'luxury-collection' },
        { id: 7, name: 'Sale',              slug: 'sale' },
        { id: 8, name: 'Denim Collection',  slug: 'denim' },
    ];

    const S = (str) => str.split(',');
    const XS_XL = S('XS,S,M,L,XL'), XS_L = S('XS,S,M,L'), S_XL = S('S,M,L,XL'), S_L = S('S,M,L');

    // [name, description, price (LKR), category slug, image, sizes, colours, stock, rating, isNew]
    const DRESSES = [
        ["Women's Watercolor Satin Maxi Dress",  'A fluid satin slip maxi in a smoky watercolor print, with a cowl neckline and delicate straps. Made for evening events.',  9500, 'luxury-collection', 'img/c1.jpg', XS_L,  S('Olive,Bronze'),   10, 4.5, true],
        ["Women's Floral Tiered Mini Dress",     'A flirty black mini with a ribbed henley top and a ditsy-floral ruffle skirt. Sweet and romantic for weekend plans.',       6500, 'casual-wear',      'img/c2.jpg', XS_L,  S('Black,Brown'),    20, 4.5, true],
        ["Women's Butter Yellow Chiffon Midi",   'A dreamy chiffon midi with blush pink lilies, a tiny bow and a swishy flounce hem. Perfect for garden parties and brunch.', 7800, 'summer-collection','img/c3.jpg', XS_XL, S('Yellow,Pink'),    16, 4.5, true],
        ["Women's Vintage Floral Mini Dress",    'A vintage-inspired mini with lace-trimmed ruffle straps, a satin bow and a tiered hem. Soft, cottagecore charm.',           6800, 'casual-wear',      'img/c4.jpg', XS_L,  S('Brown,Pink'),     18, 4.0, true],
        ["Women's Rose Print Sheer Midi Dress",  'A romantic sheer midi with oversized rose blooms, cap sleeves and a flowing A-line skirt. Ideal for dinners and date nights.', 8200, 'formal-wear',    'img/c5.jpg', S_XL,  S('Black,Pink'),     12, 4.5, true],
        ["Women's Lace Hem Smoking Midi Dress",  'A sleek midi with satin lapels, a draped waist and a scalloped lace hem. Made for cocktail events and formal evenings.',    9500, 'formal-wear',      'img/c6.jpg', S_L,   S('Black,Navy'),     10, 4.5, true],
        ["Women's Olive Satin Maxi Dress",       'A liquid satin maxi in rich olive with a deep V-neckline and a bias-cut mermaid silhouette. Made for galas and weddings.', 9800, 'luxury-collection', 'img/c7.jpg', XS_L,  S('Olive,Emerald'),  14, 4.5, true],
        ["Women's Ruched Crinkle Maxi Dress",    'A minimalist maxi in textured crinkle fabric with a boat neckline and ruched waist. Effortless evening elegance.',          8500, 'formal-wear',      'img/c8.jpg', XS_XL, S('Black,Charcoal'), 15, 4.0, true],
    ]

    // Denim: image d1..d18 follows the numbering in "Img Decs.txt"
    const DENIM = [
        ['Dark Blue Cropped Denim Jacket',             'A fitted, dark-wash cropped denim jacket with gold-tone buttons and a rounded collar.',                                                                                                                  9500, XS_L,  S('Dark Blue'),            12, 4.5, false],
        ['Classic Dark Blue Denim Jacket',             'A traditional denim jacket featuring flap chest pockets, metal buttons, and a straight cut.',                                                                                                           10500, S_XL,  S('Dark Blue'),            10, 4.5, false],
        ['Light Blue Ruffled Denim Mini Skirt',        'A light-wash denim mini skirt with layered stitching and a subtle ruffle hem.',                                                                                                                          5500, XS_L,  S('Light Blue'),           20, 4.0, false],
        ['Off-Shoulder Corset-Style Denim Top',        'A structured dark denim top with an off-shoulder foldover neckline and corset-style seams.',                                                                                                             6500, XS_L,  S('Dark Blue'),            14, 4.5, false],
        ['Star-Patch Wide-Leg Jeans',                  'Medium-wash wide-leg jeans adorned with large frayed star patches on the legs.',                                                                                                                         9800, XS_XL, S('Medium Wash'),          11, 4.5, false],
        ['Light Blue Asymmetrical Buttoned Midi Skirt','A long denim skirt with an asymmetrical wrap-style front and side button closure.',                                                                                                                      7200, XS_L,  S('Light Blue'),           13, 4.0, false],
        ['Dark Blue High-Waisted Flared Jeans',        'High-rise flared jeans in a deep indigo wash, featuring side embroidery near the pocket.',                                                                                                               9200, XS_XL, S('Indigo'),               15, 4.5, false],
        ['Light Blue Cargo-Pocket Denim Mini Skirt',   'A light-wash mini skirt with utility-style pockets on both sides and a classic front button closure.',                                                                                                   6000, XS_L,  S('Light Blue'),           17, 4.0, false],
        ['Light Blue Pleated A-Line Denim Maxi Skirt', 'A long A-line skirt with soft pleating and a tie waistband in a pale denim wash.',                                                                                                                       7800, XS_L,  S('Light Blue'),           12, 4.5, false],
        ['Patchwork Wide-Leg Denim Jeans',             'Loose-fit jeans made from multiple denim panels in different washes with exposed seam details.',                                                                                                        10200, XS_XL, S('Mixed Wash'),            3, 4.5, false],
        ['Light Blue Off-Shoulder Denim Jacket Top',   'A cropped, off-the-shoulder denim top in a light wash with a folded collar, voluminous long sleeves, and an oversized knotted bow detail at the front.',                                                 8400, XS_L,  S('Light Blue'),           10, 4.5, true],
        ['Dark Blue Strapless Denim Corset Top',       'A fitted strapless corset-style top in a deep indigo wash, with contrast white topstitching, vertical seam detailing, and side lace-up panels finished with long trailing ties.',                         6900, XS_L,  S('Indigo'),               16, 4.5, true],
        ['Dark Vintage Wash Cargo Jeans',              'Baggy wide-leg jeans in a faded blue-grey wash with flap cargo pockets and dangling buckle straps.',                                                                                                     9900, XS_XL, S('Blue Grey'),            14, 4.5, true],
        ['Light Blue Faded Wide-Leg Jeans',            'Relaxed wide-leg jeans in a soft light-blue wash with whiskering and fading at the thighs and knees, finished with an elasticated back waistband and a classic front button closure.',                    8600, XS_XL, S('Light Blue'),           18, 4.0, true],
        ['Dark Vintage Brown-Washed Baggy Jeans',      'Oversized baggy jeans in a dark indigo base with a heavy tan-brown tinted wash over the thighs and knees, whiskered creasing at the hips, and contrast golden-brown topstitching.',                      9400, XS_XL, S('Indigo,Brown Wash'),    12, 4.5, true],
        ['Grey-Blue Vintage Wide-Leg Jeans',           'Loose, slouchy wide-leg jeans in a muted grey-blue wash with a subtle greenish tint, whiskering at the hips, and faded knees for a worn-in, vintage look.',                                              8900, XS_XL, S('Grey Blue'),            15, 4.0, true],
        ['Light Blue Bow-Detail Wide-Leg Jeans',       'High-rise wide-leg jeans in a light faded wash, decorated with denim tie bows running down both outer side seams, with panelled seams for a playful, feminine detail.',                                  9600, XS_XL, S('Light Blue'),            9, 4.5, true],
        ['Dark Faded Brown-Tinted Baggy Jeans',        'Oversized wide-leg jeans in a dark charcoal-indigo wash with sun-faded brown tones across the thighs and knees, heavy whiskering at the front, and an elasticated back waistband.',                      9700, XS_XL, S('Charcoal Indigo'),      11, 4.5, true],
    ];

    const catBySlug = {};
    CATEGORIES.forEach((c) => (catBySlug[c.slug] = c));

    const PRODUCTS = [];
    DRESSES.forEach((r, i) => PRODUCTS.push({
        id: i + 1, name: r[0], description: r[1], price: r[2], category_slug: r[3], category: catBySlug[r[3]].name,
        image: r[4], sizes: r[5], colours: r[6], stock: r[7], rating: r[8], is_new: r[9],
    }));
    DENIM.forEach((r, i) => PRODUCTS.push({
        id: DRESSES.length + i + 1, name: r[0], description: r[1], price: r[2], category_slug: 'denim', category: 'Denim Collection',
        image: 'img/d' + (i + 1) + '.jpg', sizes: r[3], colours: r[4], stock: r[5], rating: r[6], is_new: r[7],
    }));

    window.VV_DATA = {
        CATEGORIES,
        PRODUCTS,
        PROMOS: { VELVET10: 10, VOGUE20: 20, NEWUSER: 15 },
        DELIVERY_FEE: 350,
        FREE_DELIVERY_OVER: 5000,
        MAX_LINE_QTY: 10,
    };
})();
