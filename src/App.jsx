import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
  Mail,
  MapPin,
  Phone,
  Clock3,
  Facebook,
  Instagram,
  MessageCircle,
  Star,
  Trash2,
} from "lucide-react";
import { categories, money, products } from "./data/products";
import homepageSlides from "./data/homepage-slides.json";
import coupons from "./data/coupons.json";
import customerReviews from "./data/reviews.json";
import {
  contactEmailConfigured,
  emailConfigured,
  missingOrderEmailSettings,
  placeOrder,
  reviewEmailConfigured,
  sendContactMessage,
  sendReviewMessage,
} from "./lib/services";
import { isSEOProduct, usePageSEO } from "./lib/seo";

const Store = createContext(null);
const useStore = () => useContext(Store);
const canPurchase = (product) => {
  if (product?.inStock === false) return false;
  if (product?.inStock === true) return true;
  return product?.stock == null || Number(product.stock) > 0;
};
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

function WatchArt({ product, large = false }) {
  if (product?.image)
    return (
      <img
        className={`watch-art ${large ? "watch-art-large" : ""}`}
        src={product.image}
        alt={`${product.name} product photo`}
      />
    );
  const label = product?.name
    ? `Real product photo for ${product.name} has not been matched yet`
    : "No confirmed products are available yet";
  return (
    <div
      className={`photo-awaiting ${large ? "photo-awaiting-large" : ""}`}
      role="img"
      aria-label={label}
    >
      <span>
        {product ? (
          <>
            PHOTO
            <br />
            AWAITING
            <br />
            MATCH
          </>
        ) : (
          <>
            PRODUCTS
            <br />
            COMING
            <br />
            SOON
          </>
        )}
      </span>
    </div>
  );
}

function App() {
  const catalog = products;
  const [cart, setCart] = useState(() => read("chronova.cart", []));
  const [wishlist, setWishlist] = useState(() => read("chronova.wishlist", []));
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFirstVisitPopup, setShowFirstVisitPopup] = useState(false);
  const popupProducts = catalog
    .filter((product) => product.popupFeatured)
    .slice(0, 3);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("chronova.first-visit.popup-seen") === "1")
        return;
    } catch {}
    const timer = window.setTimeout(() => setShowFirstVisitPopup(true), 450);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    write("chronova.cart", cart);
  }, [cart]);
  useEffect(() => {
    write("chronova.wishlist", wishlist);
  }, [wishlist]);
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const nodes = [
      ...document.querySelectorAll(
        "main .collection-tile,main .product-card,main .service-strip>div,main .editorial-band,main .journal-teaser,main .last-word,main .detail-visual,main .detail-info,main .journal-row,main .faq-list details,main .contact-form",
      ),
    ];
    nodes.forEach((node, index) => {
      node.classList.add("reveal-on-scroll");
      node.style.setProperty(
        "--reveal-delay",
        `${Math.min(index % 5, 4) * 65}ms`,
      );
    });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -28px 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [location.pathname]);
  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__chronovaToast);
    window.__chronovaToast = window.setTimeout(() => setToast(""), 2600);
  };
  const add = (product, quantity = 1) => {
    if (!canPurchase(product)) {
      notify(`${product.name} is currently out of stock`);
      return;
    }
    setCart((current) => {
      const found = current.find((x) => x.id === product.id);
      return found
        ? current.map((x) =>
            x.id === product.id
              ? {
                  ...x,
                  quantity: x.quantity + quantity,
                  premiumBoxQuantity: Math.min(
                    2,
                    x.premiumBoxQuantity || 0,
                    x.quantity + quantity,
                  ),
                }
              : x,
          )
        : [
            ...current,
            { ...product, quantity, premiumBoxId: "", premiumBoxQuantity: 0 },
          ];
    });
    notify(`${product.name} added to your bag`);
  };
  const changeQty = (id, delta) =>
    setCart((current) =>
      current.map((x) =>
        x.id === id
          ? {
              ...x,
              quantity: Math.max(1, x.quantity + delta),
              premiumBoxQuantity: Math.min(
                2,
                x.premiumBoxQuantity || 0,
                Math.max(1, x.quantity + delta),
              ),
            }
          : x,
      ),
    );
  const setPremiumPackaging = (id, boxId, quantity) =>
    setCart((current) =>
      current.map((x) => {
        if (x.id !== id) return x;
        const max = Math.min(2, x.quantity);
        return {
          ...x,
          premiumBoxId: boxId || "",
          premiumBoxQuantity: boxId
            ? Math.max(0, Math.min(max, Number(quantity) || 0))
            : 0,
        };
      }),
    );
  const remove = (id) =>
    setCart((current) => current.filter((x) => x.id !== id));
  const toggleWish = (id) => {
    setWishlist((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
    notify(
      wishlist.includes(id) ? "Removed from saved pieces" : "Saved for later",
    );
  };
  const dismissPopup = () => {
    try {
      sessionStorage.setItem("chronova.first-visit.popup-seen", "1");
    } catch {}
    setShowFirstVisitPopup(false);
  };
  const value = {
    catalog,
    cart,
    setCart,
    add,
    changeQty,
    setPremiumPackaging,
    remove,
    wishlist,
    toggleWish,
    notify,
  };
  return (
    <Store.Provider value={value}>
      <div className="site-shell">
        <Announcement />
        <Header
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          setSearchOpen={setSearchOpen}
        />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/collections/:collection" element={<Shop />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/order-confirmation/:orderNumber"
              element={<Confirmation />}
            />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/write-review" element={<ReviewForm />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/shipping-returns"
              element={<Policy kind="shipping" />}
            />
            <Route path="/privacy" element={<Policy kind="privacy" />} />
            <Route path="/terms" element={<Policy kind="terms" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <CartDock />
        <MobileCartDock />
        {toast && (
          <div className="toast" role="status">
            <Check size={16} />
            {toast}
          </div>
        )}
        {searchOpen && <SearchOverlay close={() => setSearchOpen(false)} />}
      </div>
      {showFirstVisitPopup && popupProducts.length > 0 && (
        <FirstVisitPopup
          products={popupProducts}
          onClose={dismissPopup}
          onPurchase={(product) => {
            add(product);
            dismissPopup();
          }}
        />
      )}
    </Store.Provider>
  );
}
function FirstVisitPopup({ products, onClose, onPurchase }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);
  return (
    <div
      className="first-visit-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="first-visit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-visit-title"
      >
        <header className="first-visit-header">
          <div>
            <span className="eyebrow">A FIRST LOOK · CHRONOVA BD</span>
            <h2 id="first-visit-title">Three pieces worth a closer look.</h2>
            <p>
              Choose one to add to your bag, or close this note to keep
              browsing.
            </p>
          </div>
          <button
            className="first-visit-close"
            type="button"
            onClick={onClose}
            aria-label="Close featured products"
          >
            <X size={20} />
          </button>
        </header>
        <div className="first-visit-products">
          {products.map((product) => {
            const available = canPurchase(product);
            return (
              <article className="first-visit-product" key={product.id}>
                <Link
                  className="first-visit-photo"
                  to={`/product/${product.id}`}
                  onClick={onClose}
                >
                  <WatchArt product={product} />
                  <span className="first-visit-category">
                    {product.category}
                  </span>
                </Link>
                <div className="first-visit-product-copy">
                  <Link
                    className="first-visit-product-name"
                    to={`/product/${product.id}`}
                    onClick={onClose}
                  >
                    {product.name}
                  </Link>
                  <strong>{money(product.price)}</strong>
                </div>
                <button
                  className="first-visit-buy"
                  type="button"
                  disabled={!available}
                  onClick={() => onPurchase(product)}
                >
                  {available ? "Add to bag" : "Out of stock"}
                  <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
        </div>
        <div className="first-visit-footer">
          <span>Original fictional concept designs · preview only</span>
          <button type="button" onClick={onClose}>
            Continue browsing <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
function Announcement() {
  return (
    <div className="announcement">
      <span>Considered design. Everyday precision.</span>
      <span className="announcement-right">
        Every order reviewed personally by our team <ArrowRight size={13} />
      </span>
    </div>
  );
}
function Header({ mobileOpen, setMobileOpen, setSearchOpen }) {
  const { cart, wishlist } = useStore();
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  const links = [
    ["Shop", "/shop"],
    ["Our story", "/about"],
    ["Reviews", "/reviews"],
  ];
  return (
    <header className="header">
      <Link to="/" className="brandmark" aria-label="Chronova home">
        <img
          className="brand-symbol brand-logo-image"
          src="/chronova-mark.webp"
          alt=""
        />
        <span className="brand-word">
          CHRONOVA<small>TIME YOU CAN TRUST</small>
        </span>
      </Link>
      <nav className="desktop-nav">
        {links.map(([t, to]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {t}
          </NavLink>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="icon-button"
          aria-label="Search"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={19} />
        </button>
        <Link
          className="icon-button wish-link"
          to="/wishlist"
          aria-label={`Wishlist ${wishlist.length}`}
        >
          <Heart size={19} />
          {wishlist.length > 0 && <i />}
        </Link>
        <Link className="header-bag" to="/cart">
          <ShoppingBag size={17} />
          <span>Bag</span>
          <span className="bag-count">{count}</span>
        </Link>
        <button
          className="menu-toggle"
          aria-label="Open menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {[links[0], links[1], links[2], ["Saved pieces", "/wishlist"]].map(
            ([t, to]) => (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                {t}
                <ArrowUpRight size={15} />
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
function toWhatsAppUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/(?:wa\.me|whatsapp\.com)/i.test(raw)) {
    const phone =
      raw.match(/[?&]phone=([^&#]+)/i)?.[1] ||
      raw.match(/(?:wa\.me|api\.whatsapp\.com)\/(?:send\/?)?([^?&#]+)/i)?.[1] ||
      "";
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    const text = raw.match(/[?&]text=([^&#]*)/i)?.[1];
    return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}` : "";
}
function Footer() {
  const facebook =
    import.meta.env.VITE_FACEBOOK_URL ||
    "https://www.facebook.com/share/19eC6JhkrP/";
  const instagram = import.meta.env.VITE_INSTAGRAM_URL || "";
  const whatsapp = toWhatsAppUrl(
    import.meta.env.VITE_WHATSAPP_URL || "+880 1410-604446",
  );
  const email = import.meta.env.VITE_STORE_EMAIL || "";
  const phone = import.meta.env.VITE_STORE_PHONE || "";
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-logo-link" aria-label="Chronova home">
            <img
              className="footer-logo"
              src="/chronova-logo.webp"
              alt="Chronova — Time You Can Trust"
            />
          </Link>
          <p>Timepieces selected for the details that make a day your own.</p>
        </div>
        <div className="footer-col">
          <span className="footer-kicker">Explore</span>
          <Link to="/shop">All watches</Link>
          <Link to="/about">Our story</Link>
          <Link to="/reviews">Customer reviews</Link>
        </div>
        <div className="footer-col">
          <span className="footer-kicker">Service</span>
          <Link to="/faq">FAQs</Link>
          <Link to="/shipping-returns">Returns &amp; refunds</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
        <div className="footer-contact-wrap">
          <div className="footer-contact-group">
            <span className="footer-kicker">Follow Chronova</span>
            <div className="footer-icon-links">
              <a
                className="social-link social-facebook"
                href={facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              {instagram && (
                <a
                  className="social-link social-instagram"
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {whatsapp && (
                <a
                  className="social-link social-whatsapp"
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
              )}
            </div>
          </div>
          <div className="footer-contact-group">
            <span className="footer-kicker">Contact</span>
            <div className="footer-contact-links">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} /> Chat on WhatsApp
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}>
                  <Mail size={15} /> {email}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`}>
                  <Phone size={15} /> {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Chronova BD. All rights reserved.
        </span>
        <span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <span>Made for time well spent.</span>
        </span>
      </div>
    </footer>
  );
}
function CartDock() {
  const { cart } = useStore();
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  if (!count) return null;
  return (
    <Link to="/cart" className="cart-dock">
      <ShoppingBag size={18} />
      <span>Your bag</span>
      <span className="dock-count">{count}</span>
      <span className="dock-total">
        {money(cart.reduce((s, x) => s + x.price * x.quantity, 0))}
      </span>
    </Link>
  );
}
function MobileCartDock() {
  const { cart } = useStore();
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  if (!count) return null;
  return (
    <Link to="/cart" className="mobile-cart-dock">
      <ShoppingBag size={18} />
      <span>View bag · {count}</span>
      <strong>
        {money(cart.reduce((s, x) => s + x.price * x.quantity, 0))}
      </strong>
      <ArrowRight size={16} />
    </Link>
  );
}
function SectionHeading({ eyebrow, title, body, link, href = "/shop" }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
      {link && (
        <Link className="text-link" to={href}>
          {link}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
const fallbackHeroSlide = {
  id: "catalogue-coming-soon",
  eyebrow: "CHRONOVA BD",
  title: "A considered",
  emphasis: "collection.",
  body: "Confirmed product details and photography will appear here when the collection is ready.",
  caption: "Product information will be confirmed before launch.",
  imageCaption: "CONFIRMED PRODUCT PHOTOGRAPHY COMING SOON",
  primaryLabel: "Explore the collection",
  primaryHref: "/shop",
  secondaryLabel: "Our story",
  secondaryHref: "/about",
};
const heroSlides =
  Array.isArray(homepageSlides) && homepageSlides.length
    ? homepageSlides
    : [fallbackHeroSlide];
function SlideLink({ href, className, children }) {
  const destination = href || "/shop";
  if (destination.startsWith("https://"))
    return (
      <a
        className={className}
        href={destination}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  return (
    <Link className={className} to={destination}>
      {children}
    </Link>
  );
}
function HeroCarousel() {
  const [carousel, setCarousel] = useState({ active: 0, previous: null });
  const { active, previous } = carousel;
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(
      () =>
        setCarousel(({ active: current }) => ({
          active: (current + 1) % heroSlides.length,
          previous: current,
        })),
      5000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (previous === null) return;
    const timeout = window.setTimeout(
      () =>
        setCarousel((current) =>
          current.previous === previous
            ? { ...current, previous: null }
            : current,
        ),
      1050,
    );
    return () => window.clearTimeout(timeout);
  }, [previous]);
  const move = (delta) =>
    setCarousel(({ active: current }) => ({
      active: (current + delta + heroSlides.length) % heroSlides.length,
      previous: current,
    }));
  const slide = heroSlides[active];
  return (
    <section
      className="hero hero-carousel"
      aria-roledescription="carousel"
      aria-label="Chronova watch collection highlights"
    >
      <div className="hero-copy hero-copy-slide" key={`hero-copy-${active}`}>
        <span className="eyebrow">{slide.eyebrow}</span>
        <h1>
          {slide.title}
          <br />
          <em>{slide.emphasis}</em>
        </h1>
        <p>{slide.body}</p>
        <div className="hero-actions">
          <SlideLink href={slide.primaryHref} className="button button-dark">
            {slide.primaryLabel || "Explore the collection"}{" "}
            <ArrowRight size={16} />
          </SlideLink>
          {slide.secondaryLabel && (
            <SlideLink
              href={slide.secondaryHref}
              className="button button-text"
            >
              {slide.secondaryLabel} <ArrowUpRight size={15} />
            </SlideLink>
          )}
        </div>
        <div className="hero-caption">
          <span className="caption-rule" />
          {slide.caption}
        </div>
      </div>
      <div
        className="hero-image"
        role="group"
        aria-label={`Featured collection ${active + 1} of ${heroSlides.length}`}
      >
        {slide.src ? (
          <img
            className="hero-slide-image is-active"
            src={slide.src}
            alt={slide.imageAlt || slide.title}
            loading="eager"
            fetchpriority="high"
          />
        ) : (
          <div className="hero-placeholder-art" aria-hidden="true">
            <span className="hero-placeholder-dial">C</span>
            <span className="hero-placeholder-note">
              PRODUCT PHOTOGRAPHY
              <br />
              COMING SOON
            </span>
          </div>
        )}
        <div className="hero-image-note">
          <span>CHRONOVA BD</span>
          <span>{slide.imageCaption}</span>
        </div>
        {heroSlides.length > 1 && (
          <>
            <div className="hero-index">
              0{active + 1} / 0{heroSlides.length}
            </div>
            <button
              className="hero-arrow hero-arrow-prev"
              type="button"
              aria-label="Previous featured watch"
              onClick={() => move(-1)}
            >
              <ArrowLeft size={17} />
            </button>
            <button
              className="hero-arrow hero-arrow-next"
              type="button"
              aria-label="Next featured watch"
              onClick={() => move(1)}
            >
              <ArrowRight size={17} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function ProductReviewPreview({ reviews = [] }) {
  const published = reviews.filter((review) => review.approved !== false);
  const approved = published.slice(0, 2);
  const average = published.length
    ? published.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      published.length
    : 0;
  return (
    <section
      className={`reviews-teaser${approved.length ? " has-testimonials" : ""}`}
    >
      <div className="review-preview-intro">
        <span className="eyebrow">WORDS FROM OUR CUSTOMERS</span>
        <h2>
          {approved.length
            ? "A little something from those who wear it."
            : "A new space for customer stories."}
        </h2>
        <p>
          {approved.length
            ? "Thoughts shared by customers after their Chronova order arrived."
            : "After delivery, we invite customers to share an honest review. Approved stories will find a home here."}
        </p>
        {approved.length > 0 && (
          <span className="review-preview-average">
            <Star size={14} fill="currentColor" /> {average.toFixed(1)} average
            from published reviews
          </span>
        )}
        <Link to="/reviews" className="text-link">
          Read all customer reviews <ArrowRight size={15} />
        </Link>
      </div>
      {approved.length ? (
        <div className="review-preview-quotes">
          {approved.map((review, index) => (
            <article key={review.id || `${review.name}-${index}`}>
              <div
                className="review-stars"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={
                      star <= Number(review.rating) ? "currentColor" : "none"
                    }
                  />
                ))}
              </div>
              <blockquote>
                “{review.reviewText || review.review_text}”
              </blockquote>
              <div className="review-byline">
                <strong>
                  {review.name || review.reviewerName || review.reviewer_name}
                </strong>
                <span>Verified order</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="review-preview-empty">
          <span className="review-preview-stars">★★★★★</span>
          <strong>Verified customer reviews</strong>
          <small>Published only after staff review</small>
        </div>
      )}
    </section>
  );
}
function Home() {
  const { catalog } = useStore();
  const hasSearchableProducts = catalog.some(isSEOProduct);
  const siteOrigin = String(import.meta.env.VITE_SITE_URL || "").replace(
    /\/+$/,
    "",
  );
  const brandSchema =
    siteOrigin && import.meta.env.VITE_INDEXING_ENABLED === "true"
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Chronova BD",
              url: siteOrigin,
              logo: `${siteOrigin}/chronova-logo.webp`,
              areaServed: { "@type": "Country", name: "Bangladesh" },
            },
            { "@type": "WebSite", name: "Chronova BD", url: siteOrigin },
          ],
        }
      : null;
  usePageSEO({
    title: "Thoughtfully selected watches in Bangladesh",
    description:
      "Explore Chronova BD watches, confirmed product details, prices and Bangladesh-wide delivery information.",
    path: "/",
    robots: hasSearchableProducts ? "index,follow" : "noindex,follow",
    structuredData: brandSchema,
  });
  const featured = catalog.filter((p) => p.popupFeatured).slice(0, 4);
  const showcase = featured.length ? featured : catalog.slice(0, 4);
  return (
    <>
      <HeroCarousel />
      <div className="service-strip">
        <div>
          <ShieldCheck />
          <span>
            <strong>Thoughtfully selected</strong>
            <small>Pieces reviewed by our team</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            <strong>Delivery across Bangladesh</strong>
            <small>Clear delivery details at checkout</small>
          </span>
        </div>
        <div>
          <Clock3 />
          <span>
            <strong>Personal assistance</strong>
            <small>We’re here before and after</small>
          </span>
        </div>
      </div>
      <section className="collection-section">
        <SectionHeading
          eyebrow="THE COLLECTION"
          title="A watch for every kind of day."
          body="From clean, everyday profiles to pieces with a little more presence."
          link="View all watches"
        />
        <div className="collection-grid">
          {[
            {
              name: "The classics",
              type: "Classic",
              note: "Enduring shapes, refined details",
              tone: "collection-cream",
            },
            {
              name: "Made to move",
              type: "Sport",
              note: "Ready for the day ahead",
              tone: "collection-blue",
            },
            {
              name: "Together, in time",
              type: "Couple",
              note: "A considered pair",
              tone: "collection-rose",
            },
          ].map((c, i) => (
            <Link
              key={c.name}
              to={`/collections/${c.type.toLowerCase()}`}
              className={`collection-tile ${c.tone}`}
            >
              <span className="collection-number">0{i + 1} / COLLECTION</span>
              <div className="collection-art">
                <WatchArt
                  product={
                    catalog.find(
                      (p) => p.popupFeatured && p.category === c.type,
                    ) ||
                    catalog.find((p) => p.category === c.type) ||
                    catalog[i]
                  }
                />
              </div>
              <div className="collection-copy">
                <div>
                  <span>{c.note}</span>
                  <h3>{c.name}</h3>
                </div>
                <span className="circle-arrow">
                  <ArrowUpRight size={17} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="featured-section">
        <SectionHeading
          eyebrow="A FEW FAVOURITES"
          title="Quietly distinctive."
          body="The pieces our customers return to, and the ones we keep close."
          link="Shop the collection"
        />
        <ProductGrid products={showcase} />
      </section>
      <section className="editorial-band">
        <div className="editorial-number">
          02
          <br />
          <small>OUR POINT OF VIEW</small>
        </div>
        <div>
          <span className="eyebrow">LESS, BUT BETTER</span>
          <h2>
            Good design doesn’t
            <br />
            need to announce itself.
          </h2>
          <p>
            We look for balance: a dial that reads clearly, a case that feels
            right on the wrist, and details that reward a second look.
          </p>
          <Link to="/about" className="button button-light">
            A little about us <ArrowRight size={16} />
          </Link>
        </div>
        <div className="editorial-side-note">
          SELECTED WITH
          <br />
          INTENTION
        </div>
      </section>
      <ProductReviewPreview reviews={customerReviews} />
      <section className="last-word">
        <span className="eyebrow">CHRONOVA BD</span>
        <h2>
          Time is personal.
          <br />
          <em>Choose accordingly.</em>
        </h2>
        <Link to="/shop" className="button button-dark">
          Discover the collection <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
function ProductCard({ product, index = 0 }) {
  const { add, wishlist, toggleWish } = useStore();
  const available = canPurchase(product);
  return (
    <article className={`product-card${available ? "" : " is-out-of-stock"}`}>
      <Link
        className={`product-visual visual-${index % 4}`}
        to={`/product/${product.id}`}
      >
        <div className="product-art">
          <WatchArt product={product} />
        </div>
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        {!available && (
          <span className="product-stock-badge">Out of stock</span>
        )}
        <button
          className={`wish-button ${wishlist.includes(product.id) ? "is-saved" : ""}`}
          aria-label="Save product"
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.id);
          }}
        >
          <Heart
            size={17}
            fill={wishlist.includes(product.id) ? "currentColor" : "none"}
          />
        </button>
        <span className="quick-view">
          View details <ArrowUpRight size={14} />
        </span>
      </Link>
      <div className="product-card-meta">
        <div>
          <span className="product-category">
            {product.category} · {product.brand}
          </span>
          <Link to={`/product/${product.id}`} className="product-name">
            {product.name}
          </Link>
        </div>
        <button
          className={`add-round${available ? "" : " is-disabled"}`}
          type="button"
          disabled={!available}
          aria-label={
            available
              ? `Add ${product.name} to bag`
              : `${product.name} is out of stock`
          }
          title={available ? "Add to bag" : "Out of stock"}
          onClick={() => add(product)}
        >
          <Plus size={17} />
        </button>
      </div>
      <div className="product-price-row">
        <span>{money(product.price)}</span>
        {product.compareAt && <del>{money(product.compareAt)}</del>}
        <span className="product-reference">{product.id}</span>
      </div>
    </article>
  );
}
function Shop() {
  const { catalog } = useStore();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const init =
    searchParams.get("category") ||
    searchParams.get("collection") ||
    collection ||
    "";
  const [category, setCategory] = useState(
    init ? init[0].toUpperCase() + init.slice(1) : "All watches",
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [max, setMax] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    const value =
      searchParams.get("category") ||
      searchParams.get("collection") ||
      collection;
    if (value) setCategory(value[0].toUpperCase() + value.slice(1));
    else setCategory("All watches");
  }, [searchParams, collection]);
  let list = catalog.filter(
    (p) =>
      (category === "All watches" ||
        p.category.toLowerCase() === category.toLowerCase()) &&
      p.price <= max &&
      `${p.name} ${p.category} ${p.brand}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "price-low") list.sort((a, b) => a.price - b.price);
  if (sort === "price-high") list.sort((a, b) => b.price - a.price);
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "featured")
    list.sort(
      (a, b) =>
        Number(Boolean(b.popupFeatured)) - Number(Boolean(a.popupFeatured)),
    );
  const seoTitle = collection
    ? `${collection[0].toUpperCase() + collection.slice(1)} watches in Bangladesh`
    : "Shop watches in Bangladesh";
  const seoPath = collection
    ? `/collections/${encodeURIComponent(collection.toLowerCase())}`
    : "/shop";
  usePageSEO({
    title: seoTitle,
    description:
      "Browse confirmed Chronova BD watches with clear product details, prices and Bangladesh-wide delivery information.",
    path: seoPath,
    robots: catalog.some(
      (product) =>
        isSEOProduct(product) &&
        (!collection ||
          String(product.category || "").toLowerCase() ===
            collection.toLowerCase()),
    )
      ? "index,follow"
      : "noindex,follow",
  });
  return (
    <div className="page-wrap shop-page">
      <PageTitle
        kicker="THE COLLECTION"
        title={collection ? `${category} watches` : "All watches"}
        text="A considered selection of watches for workdays, weekends and the hours in between."
      />
      <div className="shop-toolbar">
        <div className="filter-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="shop-controls">
          <label className="shop-search">
            <Search size={16} />
            <input
              placeholder="Search the collection"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            className={`filter-toggle ${showFilters ? "selected" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort watches"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      {showFilters && (
        <div className="filter-panel">
          <label>
            Maximum price <strong>{money(max)}</strong>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </label>
          <button
            className="clear-filter"
            onClick={() => {
              setMax(10000);
              setCategory("All watches");
              setQuery("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="results-line">
        <span>{list.length} pieces</span>
        <span>Prices shown in BDT</span>
      </div>
      {list.length ? (
        <ProductGrid products={list} />
      ) : (
        <EmptyState
          title="No watches found"
          text="Try another search or clear the filters."
          action={
            <button
              className="text-link"
              onClick={() => {
                setCategory("All watches");
                setQuery("");
                setMax(10000);
              }}
            >
              Reset collection <ArrowRight size={15} />
            </button>
          }
        />
      )}
    </div>
  );
}
function ProductGallery({ product }) {
  const images = [
    ...new Set(
      [
        ...(Array.isArray(product.images) ? product.images : []),
        product.image,
      ].filter(Boolean),
    ),
  ];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  useEffect(() => {
    setActive(0);
    setLightbox(false);
  }, [product.id]);
  const move = (delta) =>
    setActive((current) => (current + delta + images.length) % images.length);
  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox, images.length]);
  const lightboxView =
    lightbox && images.length > 0
      ? createPortal(
          <div
            className="gallery-lightbox"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setLightbox(false);
            }}
          >
            <section
              className="gallery-lightbox-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`${product.name} image viewer`}
            >
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setLightbox(false)}
                aria-label="Close image viewer"
              >
                <X size={21} />
              </button>
              {images.length > 1 && (
                <button
                  type="button"
                  className="gallery-lightbox-arrow previous"
                  onClick={() => move(-1)}
                  aria-label="Previous image"
                >
                  <ArrowLeft size={22} />
                </button>
              )}
              <img
                className="gallery-lightbox-image"
                src={images[active]}
                alt={`${product.name} view ${active + 1}`}
              />
              {images.length > 1 && (
                <button
                  type="button"
                  className="gallery-lightbox-arrow next"
                  onClick={() => move(1)}
                  aria-label="Next image"
                >
                  <ArrowRight size={22} />
                </button>
              )}
              <div className="gallery-lightbox-count">
                {active + 1} / {images.length}
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;
  return (
    <>
      <div className="detail-visual">
        <span className="detail-index">{product.id} / CHRONOVA EDITION</span>
        <div className="detail-art">
          {images.length ? (
            <button
              type="button"
              className="gallery-main-button"
              style={{ "--gallery-backdrop": `url(\"${images[active]}\")` }}
              onClick={() => setLightbox(true)}
              aria-label="Open product image viewer"
            >
              <img
                key={images[active]}
                className="gallery-main-image"
                src={images[active]}
                alt={`${product.name} view ${active + 1}`}
              />
              <span className="gallery-zoom-hint">View larger</span>
            </button>
          ) : (
            <WatchArt product={product} large />
          )}
        </div>
        {images.length > 1 && (
          <div
            className="gallery-thumbnails"
            role="list"
            aria-label="Product images"
          >
            {images.map((src, index) => (
              <button
                type="button"
                role="listitem"
                key={src}
                className={`gallery-thumb${index === active ? " is-selected" : ""}`}
                onClick={() => setActive(index)}
                aria-label={`Show product image ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
        <span className="detail-image-caption">
          {images.length
            ? `Image ${active + 1} of ${images.length} · Select image to enlarge`
            : "Product image will appear after it is uploaded"}
        </span>
      </div>
      {lightboxView}
    </>
  );
}
function PremiumBoxShowcase({ product }) {
  const boxes = product.premiumBoxes || [];
  const slides = boxes.flatMap((box) =>
    (box.images?.length ? box.images : [null]).map((src) => ({ box, src })),
  );
  const viewerSlides = slides.filter((slide) => slide.src);
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const activeSlide = slides[active] || slides[0];
  const moveViewer = (delta) =>
    setViewerIndex(
      (current) =>
        (current + delta + viewerSlides.length) % viewerSlides.length,
    );
  const openViewer = (index) => {
    const source = slides[index]?.src;
    const imageIndex = viewerSlides.findIndex((slide) => slide.src === source);
    if (imageIndex < 0) return;
    setActive(index);
    setViewerIndex(imageIndex);
    setLightbox(true);
  };
  useEffect(() => {
    setActive(0);
    setViewerIndex(0);
    setLightbox(false);
  }, [product.id]);
  useEffect(() => {
    if (lightbox || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [product.id, slides.length, lightbox]);
  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") moveViewer(1);
      if (event.key === "ArrowLeft") moveViewer(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox, viewerSlides.length]);
  if (!slides.length) return null;
  const lightboxView =
    lightbox && viewerSlides.length
      ? createPortal(
          <div
            className="gallery-lightbox"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setLightbox(false);
            }}
          >
            <section
              className="gallery-lightbox-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`${viewerSlides[viewerIndex]?.box.name || "Premium box"} image viewer`}
            >
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setLightbox(false)}
                aria-label="Close premium box image viewer"
              >
                <X size={21} />
              </button>
              {viewerSlides.length > 1 && (
                <button
                  type="button"
                  className="gallery-lightbox-arrow previous"
                  onClick={() => moveViewer(-1)}
                  aria-label="Previous premium box image"
                >
                  <ArrowLeft size={22} />
                </button>
              )}
              <img
                className="gallery-lightbox-image"
                src={viewerSlides[viewerIndex]?.src}
                alt={`${viewerSlides[viewerIndex]?.box.name || "Premium gift box"} image ${viewerIndex + 1}`}
              />
              {viewerSlides.length > 1 && (
                <button
                  type="button"
                  className="gallery-lightbox-arrow next"
                  onClick={() => moveViewer(1)}
                  aria-label="Next premium box image"
                >
                  <ArrowRight size={22} />
                </button>
              )}
              <div className="gallery-lightbox-count">
                {viewerIndex + 1} / {viewerSlides.length}
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;
  return (
    <>
      <section
        className="premium-box-showcase"
        aria-label="Premium gift box option"
      >
        <div className="premium-box-showcase-photo">
          {slides.map((slide, index) => (
            <div
              key={`${slide.box.id}-${index}`}
              className={`premium-box-showcase-slide${index === active ? " is-active" : ""}`}
              aria-hidden={index !== active}
            >
              {slide.src ? (
                <button
                  type="button"
                  className="premium-box-image-trigger"
                  onClick={() => openViewer(index)}
                  aria-label={`View ${slide.box.name} image larger`}
                  tabIndex={index === active ? 0 : -1}
                >
                  <img
                    src={slide.src}
                    alt={`${slide.box.name} premium gift box`}
                  />
                  <span className="gallery-zoom-hint">View larger</span>
                </button>
              ) : (
                <div
                  className="premium-box-placeholder-art"
                  role="img"
                  aria-label={`${slide.box.name} gift box photo will be added`}
                >
                  <span>GIFT BOX</span>
                </div>
              )}
            </div>
          ))}
          <span className="premium-box-showcase-label">OPTIONAL GIFT BOX</span>
          <span className="premium-box-showcase-dots">
            {slides.map((slide, index) => (
              <button
                key={`${slide.box.id}-dot-${index}`}
                type="button"
                className={index === active ? "is-active" : ""}
                onClick={() => setActive(index)}
                aria-label={`Show premium box image ${index + 1}`}
              />
            ))}
          </span>
        </div>
        <div className="premium-box-showcase-copy">
          <span className="eyebrow">A THOUGHTFUL FINISH</span>
          <h2>{activeSlide.box.heading}</h2>
          <p>{activeSlide.box.description}</p>
          <div className="premium-box-showcase-price">
            <span>Premium box, per unit</span>
            <strong>{money(activeSlide.box.price)}</strong>
          </div>
          <span className="premium-box-showcase-foot">
            Choose a box and quantity in your bag. Standard packaging remains
            complimentary.
          </span>
        </div>
      </section>
      {lightboxView}
    </>
  );
}
function ProductPage() {
  const { id } = useParams();
  const { catalog, add, wishlist, toggleWish } = useStore();
  const p =
    catalog.find((x) => x.id === id) || products.find((x) => x.id === id);
  const productReady = isSEOProduct(p);
  const productPath = p ? `/product/${encodeURIComponent(p.id)}` : "/shop";
  const productSchema =
    productReady &&
    import.meta.env.VITE_INDEXING_ENABLED === "true" &&
    import.meta.env.VITE_SITE_URL
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: [
            ...new Set(
              [...(Array.isArray(p.images) ? p.images : []), p.image].filter(
                Boolean,
              ),
            ),
          ].map(
            (src) =>
              new URL(
                src,
                `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, "")}/`,
              ).href,
          ),
          sku: p.id,
          brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
          offers: {
            "@type": "Offer",
            url: new URL(
              productPath,
              `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, "")}/`,
            ).href,
            priceCurrency: "BDT",
            price: String(p.price),
            availability: p.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : null;
  usePageSEO({
    title: p ? `${p.name} watch in Bangladesh` : "Watch not found",
    description: p?.description || "Browse confirmed watches from Chronova BD.",
    path: productPath,
    robots: productReady ? "index,follow" : "noindex,follow",
    type: "product",
    image: p?.image || p?.images?.[0] || "/chronova-logo.webp",
    structuredData: productSchema,
  });
  if (!p) return <NotFound />;
  return (
    <div className="page-wrap product-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <ChevronRight size={13} />
        <Link to="/shop">Shop</Link>
        <ChevronRight size={13} />
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <ProductGallery product={p} />
        <div className="detail-info">
          <span className="eyebrow">{p.category} COLLECTION</span>
          <h1>{p.name}</h1>
          <p className="detail-ref">Reference {p.id}</p>
          <div className="detail-price">
            {money(p.price)} {p.compareAt && <del>{money(p.compareAt)}</del>}
          </div>
          <p className="detail-description">{p.description}</p>
          <PremiumBoxShowcase product={p} />
          <div className="detail-stock">
            <span className={canPurchase(p) ? "stock-dot" : "stock-dot sold"} />
            {canPurchase(p)
              ? p.inStock === true || p.stock > 0
                ? "In stock"
                : "Availability confirmed before dispatch"
              : "Currently unavailable"}
          </div>
          <button
            disabled={!canPurchase(p)}
            className="button button-dark add-detail"
            onClick={() => add(p)}
          >
            {canPurchase(p) ? "Add to bag" : "Currently unavailable"}
            <ShoppingBag size={17} />
          </button>
          <button
            className={`detail-save ${wishlist.includes(p.id) ? "saved" : ""}`}
            onClick={() => toggleWish(p.id)}
          >
            <Heart
              size={17}
              fill={wishlist.includes(p.id) ? "currentColor" : "none"}
            />
            {wishlist.includes(p.id) ? "Saved to your list" : "Save for later"}
          </button>
          <div className="detail-accordions">
            <details open>
              <summary>
                Specifications <ChevronDown size={16} />
              </summary>
              <dl>
                <div>
                  <dt>Movement</dt>
                  <dd>{p.movement || "To be confirmed"}</dd>
                </div>
                <div>
                  <dt>Case</dt>
                  <dd>{p.case || "To be confirmed"}</dd>
                </div>
                <div>
                  <dt>Strap</dt>
                  <dd>{p.strap || "To be confirmed"}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{p.id}</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>
                Delivery & returns <ChevronDown size={16} />
              </summary>
              <p>
                Delivery options and estimated timing are shown during checkout.
                Please review our{" "}
                <Link to="/shipping-returns">
                  delivery and returns information
                </Link>
                .
              </p>
            </details>
            <details>
              <summary>
                Care & authenticity <ChevronDown size={16} />
              </summary>
              <p>
                Product details, authenticity terms, and warranty coverage will
                be confirmed by Chronova BD before launch.
              </p>
            </details>
          </div>
        </div>
      </div>
      <section className="related-section">
        <SectionHeading
          eyebrow="MORE TO DISCOVER"
          title="Consider another."
          link="View all watches"
        />
        <ProductGrid
          products={catalog
            .filter((x) => x.category === p.category && x.id !== p.id)
            .slice(0, 3)}
        />
      </section>
    </div>
  );
}
function CartPage() {
  usePageSEO({
    title: "Your shopping bag",
    description: "Review your selected Chronova BD watches.",
    path: "/cart",
    robots: "noindex,nofollow",
  });
  const { cart, catalog, changeQty, setPremiumPackaging, remove } = useStore();
  const cartItems = cart.map((item) => ({
    ...item,
    ...(catalog.find((product) => product.id === item.id) || {}),
    quantity: item.quantity,
  }));
  const hasUnavailable = cartItems.some((item) => !canPurchase(item));
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const packageTotal = cartItems.reduce((sum, item) => {
    const box = item.premiumBoxes?.find(
      (candidate) => String(candidate.id) === String(item.premiumBoxId),
    );
    return sum + (box ? box.price * (item.premiumBoxQuantity || 0) : 0);
  }, 0);
  return (
    <div className="page-wrap cart-page">
      <PageTitle
        kicker="YOUR SELECTION"
        title="Your bag"
        text="Take a moment to review your chosen pieces."
      />
      <div className="cart-layout">
        {cartItems.length ? (
          <>
            <div className="cart-items">
              {cartItems.map((p) => {
                const boxes = p.premiumBoxes || [];
                const selectedBox = boxes.find(
                  (box) => String(box.id) === String(p.premiumBoxId),
                );
                const maxBoxCount = Math.min(2, p.quantity);
                const premiumQty = selectedBox
                  ? Math.min(maxBoxCount, Number(p.premiumBoxQuantity) || 1)
                  : 0;
                return (
                  <div
                    className={`cart-row${canPurchase(p) ? "" : " is-out-of-stock"}`}
                    key={p.id}
                  >
                    <Link to={`/product/${p.id}`} className="cart-thumb">
                      <WatchArt product={p} />
                    </Link>
                    <div className="cart-desc">
                      <span className="product-category">
                        {p.category} · {p.id}
                      </span>
                      <Link
                        to={`/product/${p.id}`}
                        className="cart-product-name"
                      >
                        {p.name}
                      </Link>
                      <span className="cart-spec">
                        {p.strap} · {p.movement}
                      </span>
                      {!canPurchase(p) && (
                        <span className="cart-stock-warning">
                          Out of stock — remove this item to continue.
                        </span>
                      )}
                      <section className="bag-packaging">
                        <div className="bag-packaging-head">
                          <strong>Choose your presentation</strong>
                          <span>One choice for this product line</span>
                        </div>
                        <label
                          className={`packaging-choice${!selectedBox ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={`packaging-${p.id}`}
                            checked={!selectedBox}
                            onChange={() => setPremiumPackaging(p.id, "", 0)}
                          />
                          <span>
                            <strong>Standard Box</strong>
                            <small>Classic presentation · complimentary</small>
                          </span>
                          <b>FREE</b>
                        </label>
                        {boxes.length > 0 && (
                          <label
                            className={`packaging-choice${selectedBox ? " selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`packaging-${p.id}`}
                              checked={Boolean(selectedBox)}
                              onChange={() =>
                                setPremiumPackaging(
                                  p.id,
                                  boxes[0].id,
                                  Math.min(1, maxBoxCount),
                                )
                              }
                            />
                            <span>
                              <strong>Premium Box</strong>
                              <small>Gift-ready finish · selected below</small>
                            </span>
                            <b>
                              From{" "}
                              {money(
                                Math.min(...boxes.map((box) => box.price)),
                              )}
                            </b>
                          </label>
                        )}
                        {selectedBox && (
                          <div className="premium-box-line">
                            <div className="premium-box-line-photo">
                              {selectedBox.images?.[0] ? (
                                <img
                                  src={selectedBox.images[0]}
                                  alt={selectedBox.name}
                                />
                              ) : (
                                <span>
                                  PREMIUM
                                  <br />
                                  BOX
                                </span>
                              )}
                            </div>
                            <div className="premium-box-line-info">
                              <label>
                                Box design
                                <select
                                  value={String(selectedBox.id)}
                                  onChange={(e) =>
                                    setPremiumPackaging(
                                      p.id,
                                      e.target.value,
                                      Math.min(premiumQty, maxBoxCount),
                                    )
                                  }
                                >
                                  {boxes.map((box) => (
                                    <option key={box.id} value={box.id}>
                                      {box.name} · {money(box.price)} each
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Premium quantity
                                <select
                                  value={premiumQty}
                                  onChange={(e) =>
                                    setPremiumPackaging(
                                      p.id,
                                      selectedBox.id,
                                      Number(e.target.value),
                                    )
                                  }
                                >
                                  {Array.from(
                                    { length: maxBoxCount },
                                    (_, i) => i + 1,
                                  ).map((count) => (
                                    <option key={count} value={count}>
                                      {count} {count === 1 ? "box" : "boxes"}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <small>
                                {p.quantity - premiumQty} Standard Box
                                {p.quantity - premiumQty === 1 ? "" : "es"}{" "}
                                included · Premium total{" "}
                                {money(selectedBox.price * premiumQty)}
                              </small>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                    <div className="cart-item-actions">
                      <span className="cart-line-price">
                        {money(
                          p.price * p.quantity +
                            (selectedBox ? selectedBox.price * premiumQty : 0),
                        )}
                      </span>
                      <button
                        type="button"
                        className="cart-remove-icon"
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name} from bag`}
                        title="Remove from bag"
                      >
                        <Trash2 size={17} strokeWidth={1.7} />
                      </button>
                      <div className="quantity-stepper">
                        <button
                          onClick={() => changeQty(p.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{p.quantity}</span>
                        <button
                          disabled={!canPurchase(p)}
                          onClick={() => changeQty(p.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <aside className="order-summary">
              <span className="eyebrow">ORDER SUMMARY</span>
              <div>
                <span>Products</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div>
                <span>Premium boxes</span>
                <strong>{money(packageTotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <span>Calculated next</span>
              </div>
              <p>
                Standard boxes are free. Delivery and any premium-box charges
                are confirmed before you place your order.
              </p>
              {hasUnavailable ? (
                <p className="cart-stock-warning" role="status">
                  Remove out-of-stock items before continuing to checkout.
                </p>
              ) : (
                <Link to="/checkout" className="button button-dark full-button">
                  Continue to checkout <ArrowRight size={16} />
                </Link>
              )}
              <Link to="/shop" className="continue-link">
                <ArrowLeft size={14} /> Continue browsing
              </Link>
            </aside>
          </>
        ) : (
          <EmptyState
            title="Your bag is waiting."
            text="Explore the collection and find a piece that feels like you."
            action={
              <Link className="button button-dark" to="/shop">
                Browse watches <ArrowRight size={15} />
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

const BANGLADESH_DIVISIONS = [
  "Barishal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
];
function couponValue(coupon, subtotal, delivery) {
  if (!coupon) return { discount: 0, deliveryDiscount: 0 };
  const type = coupon.type || coupon.kind;
  if (type === "free_delivery")
    return { discount: 0, deliveryDiscount: delivery };
  const raw =
    type === "percent"
      ? (subtotal * Number(coupon.value || 0)) / 100
      : Number(coupon.value || 0);
  const capped =
    coupon.maximumDiscount == null
      ? raw
      : Math.min(raw, Number(coupon.maximumDiscount));
  return { discount: Math.min(subtotal, capped), deliveryDiscount: 0 };
}
function Checkout() {
  usePageSEO({
    title: "Checkout",
    description: "Enter delivery details for your Chronova BD order request.",
    path: "/checkout",
    robots: "noindex,nofollow",
  });
  const { cart, setCart, catalog } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [requestId] = useState(
    () =>
      sessionStorage.getItem("chronova.checkout.request") ||
      (crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`),
  );
  useEffect(() => {
    sessionStorage.setItem("chronova.checkout.request", requestId);
  }, [requestId]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    address: "",
    area: "Dhaka",
    city: "Dhaka",
    postalCode: "",
    notes: "",
    paymentMethod: "Cash on delivery",
  });
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const boxTotal = cart.reduce((sum, item) => {
    const p = catalog.find((product) => product.id === item.id) || item;
    const box = p.premiumBoxes?.find(
      (candidate) => String(candidate.id) === String(item.premiumBoxId),
    );
    return (
      sum + (box ? Number(box.price) * Number(item.premiumBoxQuantity || 0) : 0)
    );
  }, 0);
  const deliveryFee = form.area === "Dhaka" ? 80 : 130;
  const { discount, deliveryDiscount } = couponValue(
    appliedCoupon,
    subtotal,
    deliveryFee,
  );
  const total = Math.max(
    0,
    subtotal + boxTotal + deliveryFee - discount - deliveryDiscount,
  );
  const update = (e) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = coupons.find(
      (item) =>
        String(item.code).toUpperCase() === code && item.active !== false,
    );
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage(
        "That code is not active. Check the spelling or try another code.",
      );
      return;
    }
    const starts = Date.parse(coupon.startsAt || coupon.starts_at || "");
    const ends = Date.parse(coupon.endsAt || coupon.ends_at || "");
    if (
      (starts && !Number.isNaN(starts) && Date.now() < starts) ||
      (ends && !Number.isNaN(ends) && Date.now() > ends)
    ) {
      setAppliedCoupon(null);
      setCouponMessage("This coupon is outside its valid dates.");
      return;
    }
    if (
      subtotal < Number(coupon.minimumSubtotal ?? coupon.minimum_subtotal ?? 0)
    ) {
      setAppliedCoupon(null);
      setCouponMessage(
        `This code requires a product subtotal of at least ${money(coupon.minimumSubtotal ?? coupon.minimum_subtotal)}.`,
      );
      return;
    }
    const limit = Number(coupon.usageLimit ?? coupon.usage_limit ?? 0),
      used = Number(coupon.usageCount ?? coupon.usage_count ?? 0);
    if (limit > 0 && used >= limit) {
      setAppliedCoupon(null);
      setCouponMessage("This coupon has reached its redemption limit.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponMessage(
      `${code} applied${coupon.terms ? ` — ${coupon.terms}` : ""}`,
    );
  };
  if (!cart.length)
    return (
      <div className="page-wrap">
        <PageTitle kicker="CHECKOUT" title="Nothing to check out yet." />
        <Link to="/shop" className="button button-dark">
          Return to the collection
        </Link>
      </div>
    );
  if (
    cart.some(
      (item) =>
        !canPurchase(catalog.find((product) => product.id === item.id) || item),
    )
  )
    return (
      <div className="page-wrap">
        <PageTitle
          kicker="CHECKOUT"
          title="An item is out of stock."
          text="The item remains in your bag, but it can’t be ordered while unavailable."
        />
        <Link to="/cart" className="button button-dark">
          Review your bag <ArrowRight size={16} />
        </Link>
      </div>
    );
  if (
    cart.some(
      (item) =>
        (catalog.find((product) => product.id === item.id) || item).previewOnly,
    )
  )
    return (
      <div className="page-wrap">
        <PageTitle
          kicker="CONCEPT PREVIEW"
          title="This design isn’t available to order."
          text="The featured watch is a fictional design concept with provisional details. Replace it with a confirmed physical product before accepting orders."
        />
        <Link to="/cart" className="button button-dark">
          Review your bag <ArrowRight size={16} />
        </Link>
      </div>
    );
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const items = cart.map((item) => {
        const p = catalog.find((product) => product.id === item.id) || item;
        const box = p.premiumBoxes?.find(
          (candidate) => String(candidate.id) === String(item.premiumBoxId),
        );
        return {
          productId: item.id,
          name: p.name,
          price: p.price,
          quantity: item.quantity,
          premiumBoxId: box?.id || "",
          premiumBoxName: box?.name || "",
          premiumBoxQuantity: box
            ? Math.min(2, item.quantity, Number(item.premiumBoxQuantity) || 0)
            : 0,
          premiumBoxPrice: box?.price || 0,
        };
      });
      const payload = {
        requestId,
        customer: {
          name: form.name,
          email: form.email.trim(),
          phone: form.whatsapp,
          whatsapp: form.whatsapp,
          address: form.address,
          area: form.area,
          city: form.city,
          postalCode: form.postalCode,
          notes: form.notes,
        },
        items,
        subtotal,
        boxTotal,
        shippingFee: deliveryFee,
        discountAmount: discount,
        deliveryDiscount,
        couponCode: appliedCoupon?.code || "",
        couponTerms: appliedCoupon?.terms || "",
        total,
        paymentMethod: form.paymentMethod,
        shippingZone: form.area,
      };
      const result = await placeOrder(payload);
      const order = {
        ...result,
        customer: { ...form, email: form.email.trim() },
        items: cart.map((item) => ({ ...item })),
        subtotal,
        boxTotal,
        shippingFee: deliveryFee,
        discountAmount: discount,
        deliveryDiscount,
        couponCode: appliedCoupon?.code || "",
        total,
        createdAt: new Date().toISOString(),
        status: "Order received",
      };
      sessionStorage.setItem(
        `chronova.order.${result.orderNumber}`,
        JSON.stringify(order),
      );
      sessionStorage.removeItem("chronova.checkout.request");
      setCart([]);
      navigate(`/order-confirmation/${result.orderNumber}`, {
        state: { order },
      });
    } catch (e) {
      setError(e.message || "We could not place the order. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const boxSummary = (item) => {
    const p = catalog.find((product) => product.id === item.id) || item;
    const box = p.premiumBoxes?.find(
      (candidate) => String(candidate.id) === String(item.premiumBoxId),
    );
    return box && item.premiumBoxQuantity
      ? `${item.premiumBoxQuantity} × ${box.name} (${money(box.price)} each)`
      : "Standard Box · complimentary";
  };
  return (
    <div className="page-wrap checkout-page">
      <div className="checkout-top">
        <div>
          <span className="eyebrow">A FEW LAST DETAILS</span>
          <h1>Checkout</h1>
        </div>
        <div className="step-indicator">
          <span className={step === 1 ? "current" : ""}>
            01 <small>Details</small>
          </span>
          <i />
          <span className={step === 2 ? "current" : ""}>
            02 <small>Review</small>
          </span>
        </div>
      </div>
      {!emailConfigured && (
        <div className="setup-notice" role="status">
          <strong>Order email setup is incomplete for this build.</strong>
          <span>Missing: {missingOrderEmailSettings.join(", ")}.</span>
          <span>
            Set these Vite build variables in Cloudflare Pages, then create a
            new deployment.
          </span>
        </div>
      )}
      <div className="checkout-grid">
        <div className="checkout-main">
          {step === 1 ? (
            <form
              className="checkout-form"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div className="form-section-head">
                <span className="section-no">01</span>
                <div>
                  <h2>Delivery details</h2>
                  <p>
                    We’ll use these details to confirm and deliver your order.
                  </p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Full name{" "}
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={update}
                    placeholder="Your name"
                  />
                </label>
                <label>
                  WhatsApp number{" "}
                  <input
                    required
                    name="whatsapp"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={update}
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <label>
                  Division{" "}
                  <select
                    required
                    name="area"
                    value={form.area}
                    onChange={update}
                  >
                    {BANGLADESH_DIVISIONS.map((division) => (
                      <option key={division}>{division}</option>
                    ))}
                  </select>
                </label>
                <label>
                  District / city{" "}
                  <input
                    required
                    name="city"
                    value={form.city}
                    onChange={update}
                    placeholder="District or city"
                  />
                </label>
                <label className="span-two">
                  Street address{" "}
                  <input
                    required
                    name="address"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={update}
                    placeholder="House, road, area or landmark"
                  />
                </label>
                <label>
                  Postal code{" "}
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={update}
                    placeholder="Optional"
                  />
                </label>
                <label className="span-two">
                  Delivery notes{" "}
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={update}
                    placeholder="Landmark or a convenient delivery note (optional)"
                    rows="3"
                  />
                </label>
                <label className="span-two optional-email-field">
                  Email address <span>(optional — for an order copy)</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update}
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <div className="form-section-head section-gap">
                <span className="section-no">02</span>
                <div>
                  <h2>Delivery &amp; payment</h2>
                  <p>
                    Delivery is BDT 80 within Dhaka Division and BDT 130
                    elsewhere in Bangladesh.
                  </p>
                </div>
              </div>
              <div className="choice-list payment-choice">
                <label
                  className={
                    form.paymentMethod === "Cash on delivery"
                      ? "choice selected"
                      : ""
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on delivery"
                    checked={form.paymentMethod === "Cash on delivery"}
                    onChange={update}
                  />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>Pay when your order arrives</small>
                  </span>
                  <b>COD</b>
                </label>
                <label
                  className={
                    form.paymentMethod === "bKash manual"
                      ? "choice selected"
                      : ""
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bKash manual"
                    checked={form.paymentMethod === "bKash manual"}
                    onChange={update}
                  />
                  <span>
                    <strong>bKash — confirm with our team</strong>
                    <small>
                      We’ll share verified payment instructions after confirming
                      your order
                    </small>
                  </span>
                  <b>bKash</b>
                </label>
              </div>
              <button
                className="button button-dark checkout-next"
                type="submit"
              >
                Review your order <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="review-panel">
              <button className="back-button" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Edit details
              </button>
              <div className="form-section-head">
                <span className="section-no">03</span>
                <div>
                  <h2>Review before placing</h2>
                  <p>
                    Please check everything. Your order is submitted as a
                    request for staff confirmation.
                  </p>
                </div>
              </div>
              <div className="review-block">
                <div className="review-block-title">
                  Delivery to <button onClick={() => setStep(1)}>Edit</button>
                </div>
                <strong>{form.name}</strong>
                <span>WhatsApp: {form.whatsapp}</span>
                <span>
                  {form.address}, {form.area} Division, {form.city}{" "}
                  {form.postalCode}
                </span>
                {form.email && <span>Email: {form.email}</span>}
              </div>
              <div className="review-block">
                <div className="review-block-title">Delivery &amp; payment</div>
                <span>
                  {form.area === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"} ·{" "}
                  {money(deliveryFee)} delivery
                </span>
                <span>{form.paymentMethod}</span>
              </div>
              <div className="review-items">
                {cart.map((item) => {
                  const p =
                    catalog.find((product) => product.id === item.id) || item;
                  const box = p.premiumBoxes?.find(
                    (candidate) =>
                      String(candidate.id) === String(item.premiumBoxId),
                  );
                  const boxQty = box
                    ? Math.min(
                        2,
                        item.quantity,
                        Number(item.premiumBoxQuantity) || 0,
                      )
                    : 0;
                  return (
                    <div className="review-item-with-box" key={item.id}>
                      <span>
                        {item.quantity} × {item.name}
                        <small>{boxSummary(item)}</small>
                      </span>
                      <strong>
                        {money(
                          item.price * item.quantity +
                            (box ? box.price * boxQty : 0),
                        )}
                      </strong>
                    </div>
                  );
                })}
              </div>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button
                className="button button-dark checkout-next"
                disabled={busy || !emailConfigured}
                onClick={submit}
              >
                {busy ? "Submitting…" : "Place order request"}
                {!busy && <ArrowRight size={16} />}
              </button>
              <p className="checkout-consent">
                By placing your order, you agree to our{" "}
                <Link to="/terms">Terms &amp; Conditions</Link>,{" "}
                <Link to="/shipping-returns">Return &amp; refund policy</Link>{" "}
                and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>
        <aside className="order-summary checkout-summary">
          <span className="eyebrow">YOUR ORDER</span>
          {cart.map((item) => {
            const p = catalog.find((product) => product.id === item.id) || item;
            const box = p.premiumBoxes?.find(
              (candidate) => String(candidate.id) === String(item.premiumBoxId),
            );
            const boxQty = box
              ? Math.min(2, item.quantity, Number(item.premiumBoxQuantity) || 0)
              : 0;
            return (
              <div className="checkout-item checkout-item-box" key={item.id}>
                <div className="mini-thumb">
                  <WatchArt product={p} />
                </div>
                <span>
                  {item.quantity} × {p.name}
                  <small>
                    {box && boxQty
                      ? `${boxQty} × ${box.name} · ${item.quantity - boxQty} Standard free`
                      : "Standard Box · free"}
                  </small>
                </span>
                <strong>
                  {money(
                    p.price * item.quantity + (box ? box.price * boxQty : 0),
                  )}
                </strong>
              </div>
            );
          })}
          <div className="summary-row">
            <span>Products</span>
            <span>{money(subtotal)}</span>
          </div>
          {boxTotal > 0 && (
            <div className="summary-row">
              <span>Premium boxes</span>
              <span>{money(boxTotal)}</span>
            </div>
          )}
          <div className="coupon-entry">
            <label htmlFor="couponCode">Coupon code</label>
            <div>
              <input
                id="couponCode"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter a code"
                autoCapitalize="characters"
              />
              <button type="button" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            {couponMessage && (
              <small
                className={appliedCoupon ? "coupon-success" : "coupon-error"}
                role="status"
              >
                {couponMessage}
              </small>
            )}
          </div>
          <div className="summary-row">
            <span>
              {form.area === "Dhaka"
                ? "Delivery · Dhaka"
                : "Delivery · outside Dhaka"}
            </span>
            <span>{money(deliveryFee)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row discount-line">
              <span>Coupon · {appliedCoupon?.code}</span>
              <span>− {money(discount)}</span>
            </div>
          )}
          {deliveryDiscount > 0 && (
            <div className="summary-row discount-line">
              <span>Free delivery · {appliedCoupon?.code}</span>
              <span>− {money(deliveryDiscount)}</span>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <p>
            Prices in BDT. Coupon and delivery eligibility may be verified by
            our team.
          </p>
        </aside>
      </div>
    </div>
  );
}

function escapeReceipt(value) {
  return String(value ?? "").replace(
    /[&<>\"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}
function downloadOrderReceipt(order, orderNumber) {
  const rows = (order?.items || [])
    .map((item) => {
      const box = (item.premiumBoxes || []).find(
        (candidate) => String(candidate.id) === String(item.premiumBoxId),
      );
      const premiumQty = box
        ? Math.min(2, item.quantity, Number(item.premiumBoxQuantity) || 0)
        : 0;
      const boxLabel = premiumQty
        ? `${premiumQty} × ${box.name} at ${money(box.price)} each`
        : "Standard Box · complimentary";
      const line =
        item.price * item.quantity + (box ? box.price * premiumQty : 0);
      return `<tr><td>${escapeReceipt(item.name)}<small>${escapeReceipt(boxLabel)}</small></td><td>${item.quantity}</td><td>${money(line)}</td></tr>`;
    })
    .join("");
  const customer = order?.customer || {};
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Chronova order request ${escapeReceipt(orderNumber)}</title><style>
 *{box-sizing:border-box}body{margin:0;padding:24px;background:#f3efe6;color:#25334a;font:14px/1.55 Arial,sans-serif}
 .receipt-toolbar{position:sticky;top:12px;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:18px;max-width:800px;margin:0 auto 16px;padding:14px 16px;background:#fffdf8;border:1px solid #ded6c8;box-shadow:0 8px 24px rgba(37,51,74,.08)}
 .toolbar-copy strong,.toolbar-copy span{display:block}.toolbar-copy strong{font:500 17px Georgia,serif;color:#25334a}.toolbar-copy span{margin-top:3px;color:#6e7883;font-size:11px}
 .receipt-actions{display:flex;gap:8px;flex:0 0 auto}.receipt-actions button{min-height:42px;padding:0 15px;border:1px solid #762d3c;background:#762d3c;color:#fffdf8;font-size:10px;font-weight:700;letter-spacing:.06em;cursor:pointer}.receipt-actions button:hover{background:#25334a;border-color:#25334a}.receipt-actions .close-button{background:transparent;color:#25334a;border-color:#d8d0c2}
 .receipt{max-width:800px;margin:0 auto;padding:42px;background:#fffdf8;border:1px solid #ded6c8;box-shadow:0 12px 36px rgba(37,51,74,.06)}
 .brand{font:24px Georgia,serif;letter-spacing:.14em}.brand small{display:block;margin-top:5px;font:10px Arial,sans-serif;letter-spacing:.2em;color:#687482}
 .eyebrow{margin-top:35px;color:#8d3440;font-size:10px;letter-spacing:.18em}.ref{font:30px Georgia,serif;margin:8px 0 5px}.muted{color:#6e7883;font-size:12px}
 .notice{margin:22px 0;padding:12px 14px;background:#f4eee3;color:#746444;font-size:11px}
 table{width:100%;margin:25px 0;border-collapse:collapse}th,td{padding:12px 8px;border-bottom:1px solid #e8e2d7;text-align:left;font-size:12px}th{color:#7b8288;font-size:9px;letter-spacing:.12em}td:last-child,th:last-child{text-align:right}td small{display:block;margin-top:4px;color:#79828a;font-size:10px}
 .totals{max-width:320px;margin-left:auto}.totals div{display:flex;justify-content:space-between;padding:6px 0;color:#677381;font-size:12px}.totals .grand{margin-top:7px;padding-top:13px;border-top:1px solid #cfc7b8;color:#1e344e;font-size:16px;font-weight:bold}
 .foot{margin-top:30px;padding-top:16px;border-top:1px solid #e5dfd5;color:#727b84;font-size:10px}
 @page{size:auto;margin:14mm}@media print{body{padding:0;background:#fff}.receipt-toolbar{display:none!important}.receipt{max-width:none;border:0;padding:8mm;box-shadow:none}tr,.notice,.totals{break-inside:avoid}}
 @media(max-width:600px){body{padding:12px}.receipt-toolbar{top:6px;align-items:stretch;flex-direction:column;padding:12px}.receipt-actions button{flex:1}.receipt{padding:22px 18px}.ref{font-size:25px}th,td{padding:9px 5px;font-size:10px}}
 </style></head><body>
 <header class="receipt-toolbar"><div class="toolbar-copy"><strong>Your receipt is ready</strong><span>Choose “Save as PDF” in the print dialog to save it to this device.</span></div><div class="receipt-actions"><button type="button" onclick="window.print()">Save / print PDF</button><button type="button" class="close-button" onclick="window.close()">Close</button></div></header>
 <main class="receipt"><div class="brand">CHRONOVA<small>TIME YOU CAN TRUST</small></div><div class="eyebrow">ORDER REQUEST RECEIPT</div><h1 class="ref">${escapeReceipt(orderNumber)}</h1><p class="muted">Prepared ${new Date(order?.createdAt || Date.now()).toLocaleString("en-GB")} · Pending staff confirmation</p><div class="notice">This is a record of your order request, not a tax invoice or payment confirmation. Please wait for Chronova BD to confirm availability and delivery before making payment.</div><p><strong>${escapeReceipt(customer.name || "Customer")}</strong><br>${escapeReceipt(customer.address || "")}<br>${escapeReceipt(customer.area || "")}${customer.city ? `, ${escapeReceipt(customer.city)}` : ""}<br>WhatsApp: ${escapeReceipt(customer.whatsapp || customer.phone || "")}</p><table><thead><tr><th>ITEM &amp; PACKAGING</th><th>QTY</th><th>LINE TOTAL</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Products</span><span>${money(order?.subtotal || 0)}</span></div>${order?.boxTotal ? `<div><span>Premium boxes</span><span>${money(order.boxTotal)}</span></div>` : ""}<div><span>Delivery</span><span>${money(order?.shippingFee || 0)}</span></div>${order?.couponCode ? `<div><span>Coupon ${escapeReceipt(order.couponCode)}</span><span>− ${money(order.discountAmount || 0)}</span></div>` : ""}${order?.deliveryDiscount ? `<div><span>Delivery discount</span><span>− ${money(order.deliveryDiscount)}</span></div>` : ""}<div class="grand"><span>Request total</span><span>${money(order?.total || 0)}</span></div></div><div class="foot">Chronova BD · Bangladesh · Order details are subject to staff confirmation. Retain this receipt with your order reference.</div></main></body></html>`;
  const receiptWindow = window.open("", "_blank");
  if (!receiptWindow) {
    window.alert("Please allow pop-ups to open and print your receipt.");
    return;
  }
  receiptWindow.opener = null;
  receiptWindow.document.open();
  receiptWindow.document.write(html);
  receiptWindow.document.close();
}
function Confirmation() {
  const { orderNumber } = useParams();
  usePageSEO({
    title: "Order confirmation",
    description: "Chronova BD order request confirmation.",
    path: `/order-confirmation/${encodeURIComponent(orderNumber || "")}`,
    robots: "noindex,nofollow",
  });
  const { state } = useLocation();
  const [order] = useState(() => {
    if (state?.order) return state.order;
    try {
      return JSON.parse(
        sessionStorage.getItem(`chronova.order.${orderNumber}`),
      );
    } catch {
      return null;
    }
  });
  return (
    <div className="page-wrap confirmation-page">
      <div className="confirm-mark">
        <Check size={25} />
      </div>
      <span className="eyebrow">ORDER REQUEST EMAILED</span>
      <h1>Thank you, {order?.customer?.name?.split(" ")[0] || "there"}.</h1>
      <p className="confirm-lede">
        Your order request has been emailed to Chronova BD. Keep reference{" "}
        <strong>{orderNumber}</strong>; our team will confirm availability and
        delivery with you.
      </p>
      <div className="confirmation-card">
        <div className="confirmation-card-head">
          <span>ORDER SUMMARY</span>
          <span>
            {new Date(order?.createdAt || Date.now()).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            )}
          </span>
        </div>
        {order?.items?.map((p) => {
          const box = (p.premiumBoxes || []).find(
            (candidate) => String(candidate.id) === String(p.premiumBoxId),
          );
          const premiumQty = box
            ? Math.min(2, p.quantity, Number(p.premiumBoxQuantity) || 0)
            : 0;
          return (
            <div className="confirm-line confirm-line-product" key={p.id}>
              <span>
                {p.quantity} × {p.name}
                <small>
                  {premiumQty
                    ? `${premiumQty} × ${box.name} · ${p.quantity - premiumQty} Standard free`
                    : "Standard Box · complimentary"}
                </small>
              </span>
              <strong>
                {money(
                  p.price * p.quantity + (box ? box.price * premiumQty : 0),
                )}
              </strong>
            </div>
          );
        })}
        <div className="confirm-line">
          <span>Products</span>
          <span>{money(order?.subtotal || 0)}</span>
        </div>
        {order?.boxTotal > 0 && (
          <div className="confirm-line">
            <span>Premium boxes</span>
            <span>{money(order.boxTotal)}</span>
          </div>
        )}
        <div className="confirm-line">
          <span>Delivery</span>
          <span>{money(order?.shippingFee || 0)}</span>
        </div>
        {order?.couponCode && (
          <div className="confirm-line">
            <span>Coupon {order.couponCode}</span>
            <span>− {money(order.discountAmount || 0)}</span>
          </div>
        )}
        {order?.deliveryDiscount > 0 && (
          <div className="confirm-line">
            <span>Delivery discount</span>
            <span>− {money(order.deliveryDiscount)}</span>
          </div>
        )}
        <div className="confirm-total">
          <span>Total</span>
          <strong>{money(order?.total || 0)}</strong>
        </div>
        <div className="confirm-payment">
          <span>Payment preference</span>
          <strong>{order?.paymentMethod || "To be confirmed"}</strong>
        </div>
      </div>
      <div className="next-steps">
        <span className="section-no">NEXT</span>
        <div>
          <h3>What happens now?</h3>
          <p>
            The Chronova team will check availability and delivery details and
            contact you to confirm the request. For bKash, wait for verified
            instructions—do not send money before confirmation.
          </p>
        </div>
      </div>
      <div className="confirmation-actions">
        <button
          type="button"
          className="button button-dark"
          onClick={() => downloadOrderReceipt(order, orderNumber)}
          disabled={!order}
        >
          View / save receipt <ArrowDown size={15} />
        </button>
        <Link to="/shop" className="button button-outline">
          Continue browsing
        </Link>
      </div>
    </div>
  );
}
function Wishlist() {
  usePageSEO({
    title: "Saved watches",
    description: "Your saved Chronova BD watches.",
    path: "/wishlist",
    robots: "noindex,nofollow",
  });
  const { catalog, wishlist, add, toggleWish } = useStore();
  const saved = catalog.filter((p) => wishlist.includes(p.id));
  return (
    <div className="page-wrap">
      <PageTitle
        kicker="YOUR EDITS"
        title="Saved pieces"
        text="A shortlist, just for you."
      />
      {saved.length ? (
        <ProductGrid products={saved} />
      ) : (
        <EmptyState
          title="Nothing saved just yet."
          text="Keep the pieces you like close by."
          action={
            <Link to="/shop" className="button button-dark">
              Explore watches <ArrowRight size={15} />
            </Link>
          }
        />
      )}
    </div>
  );
}
function About() {
  usePageSEO({
    title: "Our story",
    description:
      "Learn about Chronova BD and the watch shopping experience we aim to provide across Bangladesh.",
    path: "/about",
  });
  return (
    <div className="page-wrap story-page">
      <div className="story-hero">
        <div>
          <span className="eyebrow">A SMALL NOTE FROM CHRONOVA</span>
          <h1>
            Time is personal.
            <br />
            <em>So is choosing a watch.</em>
          </h1>
          <p>
            Chronova BD is a considered watch shop built around a simple idea:
            the right piece should feel natural on your wrist, not just look
            good in a photograph.
          </p>
        </div>
        <div
          className="story-photo-placeholder"
          role="img"
          aria-label="Product photography will be added when confirmed"
        >
          <span>CHRONOVA BD</span>
          <strong>
            Product photography
            <br />
            coming soon
          </strong>
        </div>
      </div>
      <div className="story-columns">
        <span className="eyebrow">OUR POINT OF VIEW</span>
        <div>
          <h2>We believe in thoughtful choices.</h2>
          <p>
            We look for watches with balance, legibility, and details that
            reward a second look. Our collection is curated for the everyday: a
            meeting, a journey, a quiet Sunday, or a milestone worth
            remembering.
          </p>
          <p>
            As a growing independent retailer in Bangladesh, we want every order
            to feel personal. Our team reviews availability and delivery details
            with you before dispatch.
          </p>
          <Link to="/shop" className="text-link">
            Explore what we’ve selected <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <div className="story-note">
        <span>01 / OUR PROMISE</span>
        <p>
          Clear details. Considered selection. A real person to help when you
          need one.
        </p>
      </div>
    </div>
  );
}
function Reviews() {
  const entries = customerReviews.filter((review) => review.approved !== false);
  usePageSEO({
    title: "Customer reviews",
    description:
      "Read genuine reviews from Chronova BD customers after their orders are delivered.",
    path: "/reviews",
    robots: entries.length ? "index,follow" : "noindex,follow",
  });
  const average = entries.length
    ? entries.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      entries.length
    : 0;
  return (
    <div className="page-wrap reviews-page">
      <PageTitle
        kicker="CHRONOVA BD · CUSTOMER EXPERIENCES"
        title="Worn and loved."
        text="Reviews shared by customers after their order was delivered."
      />
      <div className="reviews-summary">
        <div>
          <strong>{entries.length ? average.toFixed(1) : "—"}</strong>
          <span>Average customer rating</span>
        </div>
        <div className="reviews-summary-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={19}
              fill={star <= Math.round(average) ? "currentColor" : "none"}
            />
          ))}
        </div>
        <span className="review-invitation-note">
          Review invitations are sent after delivery.
        </span>
      </div>
      {entries.length ? (
        <div className="review-cards">
          {entries.map((review, index) => (
            <article
              className="customer-review-card"
              key={review.id || `${review.name}-${index}`}
            >
              <div
                className="review-stars"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    fill={
                      star <= Number(review.rating) ? "currentColor" : "none"
                    }
                  />
                ))}
              </div>
              <blockquote>
                “{review.reviewText || review.review_text}”
              </blockquote>
              <div className="review-byline">
                <strong>
                  {review.name || review.reviewerName || review.reviewer_name}
                </strong>
                <span>
                  {review.createdAt || review.created_at
                    ? new Date(
                        review.createdAt || review.created_at,
                      ).toLocaleDateString("en-BD", {
                        month: "long",
                        year: "numeric",
                      })
                    : "Verified order"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="reviews-empty">
          <span className="eyebrow">NOTES FROM OUR CUSTOMERS</span>
          <h2>We’ll share the first stories here.</h2>
          <p>
            After your order arrives, use the private review link sent by
            Chronova BD to share your experience.
          </p>
        </div>
      )}
      <div className="reviews-bottom-note">
        Reviews are published after staff review. To leave feedback, use the
        order-linked invitation shared after delivery.
      </div>
    </div>
  );
}
function ReviewForm() {
  usePageSEO({
    title: "Private customer review",
    description: "Order-linked review form for Chronova BD customers.",
    path: "/write-review",
    robots: "noindex,nofollow",
  });
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "";
  const token = params.get("token") || "";
  const [form, setForm] = useState({
    name: "",
    address: "",
    whatsapp: "",
    rating: "5",
    reviewText: "",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const wordCount = form.reviewText.trim()
    ? form.reviewText.trim().split(/\s+/).length
    : 0;
  const update = (e) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!orderNumber || !token) {
      setError("This form needs the private order-linked review invitation.");
      return;
    }
    if (wordCount > 200) {
      setError("Please keep your review to 200 words or fewer.");
      return;
    }
    setBusy(true);
    try {
      await sendReviewMessage({
        orderNumber,
        token,
        name: form.name.trim(),
        address: form.address.trim(),
        whatsapp: form.whatsapp.trim(),
        rating: Number(form.rating),
        reviewText: form.reviewText.trim(),
        wordCount,
      });
      setSent(true);
    } catch (err) {
      setError(
        err.message || "The review could not be sent. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-wrap review-form-page">
      <PageTitle
        kicker="A NOTE AFTER DELIVERY"
        title="Share your experience"
        text="Your feedback helps us improve and helps the next customer choose with confidence."
      />
      {sent ? (
        <div className="review-thanks">
          <span className="review-thanks-mark">
            <Check size={31} />
          </span>
          <span className="eyebrow">THANK YOU</span>
          <h2>Your review is with our team.</h2>
          <p>
            We’ll check it before it appears on the customer reviews page. Order
            reference: {orderNumber}
          </p>
          <Link to="/reviews" className="text-link">
            Read customer reviews <ArrowRight size={15} />
          </Link>
        </div>
      ) : !orderNumber || !token ? (
        <div className="review-locked">
          <h2>Order invitation required</h2>
          <p>
            Review submissions are opened through the private link sent after
            delivery. Please use the link from your order message.
          </p>
          <Link to="/contact" className="text-link">
            Need help? Contact Chronova BD <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <form className="review-submission-form" onSubmit={submit}>
          <div className="review-order-chip">
            ORDER REFERENCE <strong>{orderNumber}</strong>
          </div>
          <label>
            Your name
            <input
              required
              name="name"
              value={form.name}
              onChange={update}
              maxLength="160"
              autoComplete="name"
            />
          </label>
          <label>
            Delivery address
            <input
              required
              name="address"
              value={form.address}
              onChange={update}
              maxLength="240"
              autoComplete="street-address"
            />
          </label>
          <label>
            WhatsApp number
            <input
              required
              name="whatsapp"
              value={form.whatsapp}
              onChange={update}
              maxLength="40"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
            />
          </label>
          <fieldset className="review-rating-field">
            <legend>Your rating</legend>
            <div className="rating-choice-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} aria-label={`${star} stars`}>
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={Number(form.rating) === star}
                    onChange={update}
                  />
                  <Star
                    size={25}
                    fill={Number(form.rating) >= star ? "currentColor" : "none"}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Your review
            <textarea
              required
              name="reviewText"
              value={form.reviewText}
              onChange={update}
              maxLength="1600"
              rows="6"
              placeholder="Tell us about your experience."
            />
          </label>
          <div className="review-word-count">{wordCount} / 200 words</div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!reviewEmailConfigured && (
            <p className="setup-notice">
              Review email settings are pending. This form will send when the
              Review Template ID is configured.
            </p>
          )}
          <button
            className="button button-dark"
            type="submit"
            disabled={busy || !reviewEmailConfigured || wordCount > 200}
          >
            {busy ? "Sending review…" : "Send review to Chronova"}
            <ArrowRight size={15} />
          </button>
          <p className="review-privacy-note">
            Your name, contact details and order reference are sent privately to
            Chronova BD for review verification; only the approved review text
            and display name may be published.
          </p>
        </form>
      )}
    </div>
  );
}
function FAQ() {
  usePageSEO({
    title: "Watch shopping FAQs",
    description:
      "Answers about buying watches from Chronova BD, delivery, payments and returns in Bangladesh.",
    path: "/faq",
  });
  const items = [
    [
      "Are the watches authentic?",
      "Chronova BD will confirm product provenance and authenticity terms for each item before launch. Contact us if you need details about a particular watch.",
    ],
    [
      "How long does delivery take?",
      "Delivery timing depends on your location and is confirmed by our team after we receive your order.",
    ],
    [
      "Can I pay cash on delivery?",
      "Cash on delivery is offered as a preference at checkout, subject to order and location confirmation by our team.",
    ],
    [
      "Can I return or exchange a watch?",
      "Please review our delivery and returns policy. Final eligibility and timelines should be confirmed by Chronova BD before launch.",
    ],
    [
      "How can I ask about my order?",
      "Use the WhatsApp number or email address you provided and include your order reference. If you did not provide an email, our team will use WhatsApp.",
    ],
    [
      "Can you help me choose?",
      "Yes. Send us the product name and what you’re looking for through our Contact page or Facebook.",
    ],
  ];
  return (
    <div className="page-wrap content-page">
      <PageTitle
        kicker="A FEW ANSWERS"
        title="Frequently asked questions"
        text="If something isn’t covered here, we’re only a message away."
      />
      <div className="faq-list">
        {items.map(([q, a], i) => (
          <details key={q}>
            <summary>
              <span className="faq-number">0{i + 1}</span>
              <strong>{q}</strong>
              <Plus size={18} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <div className="page-cta">
        <span>Still wondering?</span>
        <Link to="/contact" className="text-link">
          Talk to our team <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
function Contact() {
  usePageSEO({
    title: "Contact Chronova BD",
    description:
      "Contact the Chronova BD team about watches, order requests and Bangladesh-wide delivery.",
    path: "/contact",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      await sendContactMessage({
        name: form.get("name"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        topic: form.get("topic"),
        message: form.get("message"),
      });
      setSent(true);
      formElement.reset();
    } catch (err) {
      setError(
        err.message ||
          "Message could not be sent. Please email or message us on Facebook.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-wrap contact-page">
      <PageTitle
        kicker="WE’RE HERE TO HELP"
        title="A conversation, not a ticket."
        text="Choosing a watch or asking about an order? Send a note and the Chronova team will reply using the contact details you provide."
      />
      <div className="contact-grid">
        <div className="contact-details">
          {import.meta.env.VITE_STORE_EMAIL ? (
            <a href={`mailto:${import.meta.env.VITE_STORE_EMAIL}`}>
              <Mail />
              <span>
                <small>EMAIL</small>
                <strong>{import.meta.env.VITE_STORE_EMAIL}</strong>
              </span>
            </a>
          ) : (
            <div>
              <Mail />
              <span>
                <small>EMAIL</small>
                <strong>Add store email in setup</strong>
              </span>
            </div>
          )}
          {import.meta.env.VITE_STORE_PHONE && (
            <a
              href={`tel:${import.meta.env.VITE_STORE_PHONE.replace(/[^0-9+]/g, "")}`}
            >
              <Phone />
              <span>
                <small>PHONE</small>
                <strong>{import.meta.env.VITE_STORE_PHONE}</strong>
              </span>
            </a>
          )}
          <a
            href={
              import.meta.env.VITE_FACEBOOK_URL ||
              "https://www.facebook.com/share/19eC6JhkrP/"
            }
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight />
            <span>
              <small>FACEBOOK</small>
              <strong>Message Chronova BD</strong>
            </span>
          </a>
          <div>
            <MapPin />
            <span>
              <small>BASED IN</small>
              <strong>Bangladesh · Delivery nationwide</strong>
            </span>
          </div>
          <p>
            For order questions, include your order reference and the WhatsApp
            number used at checkout.
          </p>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <span className="eyebrow">SEND A NOTE</span>
          <label>
            Your name
            <input required name="name" placeholder="Name" />
          </label>
          <label>
            Email address <span>(optional)</span>
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <label>
            WhatsApp number{" "}
            <input name="whatsapp" type="tel" placeholder="01XXXXXXXXX" />
          </label>
          <label>
            What can we help with?
            <select name="topic">
              <option>Choosing a watch</option>
              <option>Question about an order</option>
              <option>Delivery or returns</option>
              <option>Something else</option>
            </select>
          </label>
          <label>
            Message
            <textarea
              required
              name="message"
              rows="4"
              placeholder="A little context helps us give you a useful answer."
            />
          </label>
          {!contactEmailConfigured && (
            <p className="success-note">
              Email setup is not finished yet. You can still contact us through
              Facebook.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="success-note" role="status">
              Your message was sent. The Chronova team will follow up using the
              contact details you provided.
            </p>
          )}
          <button
            className="button button-dark"
            disabled={busy || !contactEmailConfigured}
          >
            {busy
              ? "Sending…"
              : sent
                ? "Send another message"
                : "Send your note"}
            {!busy && <ArrowRight size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
function Policy({ kind }) {
  const pagePath = kind === "shipping" ? "/shipping-returns" : `/${kind}`;
  const pageSEO = {
    shipping: {
      title: "Delivery, returns and refunds",
      description:
        "Review Chronova BD delivery, return and refund information.",
    },
    privacy: {
      title: "Privacy policy",
      description:
        "Learn how Chronova BD handles information shared through the storefront.",
    },
    terms: {
      title: "Terms and conditions",
      description: "Read the terms for Chronova BD storefront order requests.",
    },
  }[kind];
  usePageSEO({ ...pageSEO, path: pagePath });
  const contents = {
    shipping: {
      title: "Delivery, returns & refunds",
      lead: "Clear expectations make a better experience.",
      sections: [
        [
          "Delivery areas",
          "We plan to deliver across Bangladesh. Delivery charges and estimated arrival times are shown at checkout and confirmed by our team. The current delivery fee examples must be approved by the business before launch.",
        ],
        [
          "Order confirmation",
          "Submitting an order is a request for confirmation. Our team will check availability and contact you before dispatch. Please wait for confirmed instructions before making any manual payment.",
        ],
        [
          "Returns & exchanges",
          "The owner should provide the final return window, eligible conditions, and exchange process before this page is published. Keep the item, packaging, tags and proof of purchase until your request is resolved.",
        ],
        [
          "Damaged or incorrect items",
          "Contact us promptly with your order reference and clear photos so we can review the issue.",
        ],
      ],
    },
    privacy: {
      title: "Privacy policy",
      lead: "We use the information you share to handle your request and order.",
      sections: [
        [
          "Information collected",
          "The checkout may collect your name, optional email, WhatsApp number, delivery address, selected items and order notes.",
        ],
        [
          "How it is used",
          "We use this information to review and fulfil orders, contact you about delivery, and provide customer support.",
        ],
        [
          "Storage & access",
          "Order details are sent through the configured email providers. Confirm their data-retention policies and restrict access to the connected mailbox. No shared order database is used in this email-only setup.",
        ],
        [
          "Questions",
          "Contact Chronova BD through the Contact page for privacy questions.",
        ],
      ],
    },
    terms: {
      title: "Terms & conditions",
      lead: "Please review these terms before placing an order.",
      sections: [
        [
          "Order requests",
          "An online order is a request for the business to confirm availability and delivery. The team will contact you to confirm the details.",
        ],
        [
          "Pricing & availability",
          "Prices are displayed in BDT. Stock and final delivery details are subject to confirmation by Chronova BD.",
        ],
        [
          "Payment",
          "No card payment is collected on this site. For manual mobile-wallet payment, wait for instructions confirmed by Chronova BD.",
        ],
        [
          "Product information",
          "Specifications, photographs, warranty, authenticity and final product conditions should be confirmed by the seller before launch.",
        ],
        [
          "Updates",
          "The business should review these terms and publish final legal and commercial wording before accepting live orders.",
        ],
      ],
    },
  };
  const c = contents[kind];
  return (
    <div className="page-wrap content-page policy-page">
      <PageTitle
        kicker="CHRONOVA BD · INFORMATION"
        title={c.title}
        text={c.lead}
      />
      <div className="policy-sections">
        {c.sections.map(([title, text], i) => (
          <section key={title}>
            <span className="section-no">0{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </section>
        ))}
      </div>
      <p className="policy-warning">
        This draft is a website placeholder, not legal advice. The business
        owner should review and approve the final policy before launch.
      </p>
    </div>
  );
}
function SearchOverlay({ close }) {
  const { catalog } = useStore();
  const [q, setQ] = useState("");
  const matches = catalog
    .filter((p) =>
      `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()),
    )
    .slice(0, 5);
  return (
    <div className="overlay" onClick={close}>
      <div className="search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="search-dialog-head">
          <span className="eyebrow">SEARCH THE COLLECTION</span>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="search-input">
          <Search size={19} />
          <input
            autoFocus
            placeholder="Try ‘classic’ or ‘sport’"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {q && (
          <div className="search-results">
            {matches.map((p) => (
              <Link to={`/product/${p.id}`} onClick={close} key={p.id}>
                <div className="search-thumb">
                  <WatchArt product={p} />
                </div>
                <span>
                  <small>{p.category}</small>
                  <strong>{p.name}</strong>
                </span>
                <b>{money(p.price)}</b>
                <ArrowUpRight size={15} />
              </Link>
            ))}
            {matches.length === 0 && <p>No matching pieces found.</p>}
          </div>
        )}
        <div className="search-shortcuts">
          <span>Popular</span>
          {["Classic", "Sport", "Couple"].map((c) => (
            <Link
              key={c}
              to={`/collections/${c.toLowerCase()}`}
              onClick={close}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
function PageTitle({ kicker, title, text }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{kicker}</span>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </div>
  );
}
function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-rule" />
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
function NotFound() {
  usePageSEO({
    title: "Page not found",
    description: "The Chronova BD page could not be found.",
    robots: "noindex,nofollow",
  });
  return (
    <div className="page-wrap">
      <EmptyState
        title="This page has moved."
        text="The page you’re looking for isn’t here."
        action={
          <Link to="/" className="button button-dark">
            Return home <ArrowRight size={15} />
          </Link>
        }
      />
    </div>
  );
}

export default App;
