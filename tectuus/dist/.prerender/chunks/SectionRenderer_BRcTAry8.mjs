import { d as createComponent, l as mediaUrl, s as FALLBACK_IMAGE, t as $$LeadCaptureForm, u as renderScript } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { C as unescapeHTML, T as createAstro, g as addAttribute, i as Fragment, m as maybeRenderHead, r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
//#region src/components/sections/BannerCarousel.astro
createAstro("https://astro.build");
var $$BannerCarousel = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$BannerCarousel;
	const { slides, primary = true } = Astro.props;
	const resolved = slides.map((slide) => ({
		...slide,
		image: slide.image ? mediaUrl(slide.image) : FALLBACK_IMAGE
	}));
	return renderTemplate`${maybeRenderHead($$result)}<section${addAttribute("hero" + (resolved.length < 2 ? " hero--single" : ""), "class")} id="inicio" data-carousel><div class="hero__track">${resolved.map((slide, index) => renderTemplate`<article${addAttribute("hero-slide" + (index === 0 ? " is-active" : ""), "class")} data-slide${addAttribute(index === 0 ? "false" : "true", "aria-hidden")}><div class="hero-slide__media"><img class="hero-slide__img"${addAttribute(slide.image, "src")} alt=""${addAttribute(index === 0 ? "eager" : "lazy", "loading")}></div><div class="hero-slide__copy">${slide.title && (primary && index === 0 ? renderTemplate`<h1 class="hero-slide__title">${slide.title}</h1>` : renderTemplate`<p class="hero-slide__title">${slide.title}</p>`)}${slide.subtitle && renderTemplate`<p class="hero-slide__subtitle">${slide.subtitle}</p>`}<div class="hero-slide__actions">${slide.link_url && slide.link_label ? renderTemplate`<a class="btn-primary"${addAttribute(slide.link_url, "href")}>${slide.link_label}</a>` : renderTemplate`<a class="btn-primary" href="/productos">Conoce nuestros productos</a>`}<a class="btn-secondary btn-secondary--on-dark" href="/contacto">Contáctanos</a></div></div></article>`)}</div>${resolved.length > 1 && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<button type="button" class="hero__arrow hero__arrow--prev" data-prev aria-label="Diapositiva anterior"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg></button><button type="button" class="hero__arrow hero__arrow--next" data-next aria-label="Siguiente diapositiva"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg></button><div class="hero__dots" role="tablist" aria-label="Seleccionar diapositiva">${resolved.map((_, index) => renderTemplate`<button type="button"${addAttribute("hero__dot" + (index === 0 ? " is-active" : ""), "class")} data-dot role="tab"${addAttribute(`Ir a la diapositiva ${index + 1}`, "aria-label")}${addAttribute(index === 0 ? "true" : "false", "aria-selected")}></button>`)}</div>` })}`}</section>${renderScript($$result, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/BannerCarousel.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/BannerCarousel.astro", void 0);
//#endregion
//#region src/components/sections/PageHero.astro
createAstro("https://astro.build");
var $$PageHero = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PageHero;
	const { title, subtitle, image } = Astro.props;
	const heroImage = image ? mediaUrl(image) : null;
	return renderTemplate`${maybeRenderHead($$result)}<section class="page-hero">${heroImage && renderTemplate`<img class="page-hero__img"${addAttribute(heroImage, "src")} alt="">`}<div class="page-hero__scrim" aria-hidden="true"></div><div class="container page-hero__content"><h1 class="page-hero__title">${title}</h1>${subtitle && renderTemplate`<p class="page-hero__subtitle">${subtitle}</p>`}</div></section>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/PageHero.astro", void 0);
//#endregion
//#region src/components/sections/RichText.astro
createAstro("https://astro.build");
var $$RichText = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RichText;
	const { title, body, video_url } = Astro.props;
	function toEmbedUrl(url) {
		try {
			const parsed = new URL(url);
			const host = parsed.hostname.replace(/^www\./, "");
			if (host === "youtube.com" || host === "m.youtube.com") {
				if (parsed.pathname === "/watch") {
					const id = parsed.searchParams.get("v");
					if (id) return `https://www.youtube.com/embed/${id}`;
				}
				if (parsed.pathname.startsWith("/embed/")) return url;
				if (parsed.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${parsed.pathname.split("/")[2]}`;
			}
			if (host === "youtu.be") return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
			if (host === "vimeo.com") return `https://player.vimeo.com/video/${parsed.pathname.slice(1)}`;
			if (host === "player.vimeo.com") return url;
			return url;
		} catch {
			return url;
		}
	}
	function withAutoplay(url) {
		try {
			const parsed = new URL(url);
			const host = parsed.hostname.replace(/^www\./, "");
			if (host === "youtube.com" || host === "youtube-nocookie.com") {
				parsed.searchParams.set("autoplay", "1");
				parsed.searchParams.set("mute", "1");
				parsed.searchParams.set("playsinline", "1");
				return parsed.toString();
			}
			if (host === "player.vimeo.com") {
				parsed.searchParams.set("autoplay", "1");
				parsed.searchParams.set("muted", "1");
				return parsed.toString();
			}
			return url;
		} catch {
			return url;
		}
	}
	const embedUrl = video_url ? withAutoplay(toEmbedUrl(video_url)) : null;
	return renderTemplate`${maybeRenderHead($$result)}<section class="section"><div class="container">${title && renderTemplate`<div class="section-head"><h2 class="section-title">${title}</h2></div>`}<div class="prose">${unescapeHTML(body)}</div>${embedUrl && renderTemplate`<div class="rich-text__video"><iframe${addAttribute(embedUrl, "src")}${addAttribute(title ?? "Video", "title")} loading="lazy" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`}</div></section>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/RichText.astro", void 0);
//#endregion
//#region src/components/sections/FeatureGrid.astro
createAstro("https://astro.build");
var $$FeatureGrid = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$FeatureGrid;
	const { title, items, id } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<section class="section section--ink"${addAttribute(id, "id")}><div class="container">${title && renderTemplate`<div class="section-head"><h2 class="section-title">${title}</h2></div>`}<div class="grid grid--3">${items.map((item) => renderTemplate`<div class="card card--on-ink"><div class="card__icon" aria-hidden="true">${item.icon ? renderTemplate`<img class="card__icon-img"${addAttribute(mediaUrl(item.icon), "src")} alt="">` : renderTemplate`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-5h6v5"></path></svg>`}</div><p class="card__title">${item.title}</p>${item.text && renderTemplate`<p class="card__text">${item.text}</p>`}</div>`)}</div></div></section>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/FeatureGrid.astro", void 0);
//#endregion
//#region src/components/sections/ImageGallery.astro
createAstro("https://astro.build");
var $$ImageGallery = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ImageGallery;
	const { title, images } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<section class="section"><div class="container">${title && renderTemplate`<div class="section-head"><h2 class="section-title">${title}</h2></div>`}<div class="gallery-grid">${images.map((item) => renderTemplate`<figure class="gallery-item"><img${addAttribute(item.image ? mediaUrl(item.image) : FALLBACK_IMAGE, "src")}${addAttribute(item.alt ?? item.caption ?? "", "alt")} loading="lazy">${item.caption && renderTemplate`<figcaption class="gallery-caption">${item.caption}</figcaption>`}</figure>`)}</div></div></section>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/ImageGallery.astro", void 0);
//#endregion
//#region src/components/sections/ClientsShowcase.astro
createAstro("https://astro.build");
var $$ClientsShowcase = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ClientsShowcase;
	const { title, logos } = Astro.props;
	const hasTestimonials = logos.some((logo) => logo.quote?.trim() || logo.description?.trim());
	const gridStyle = `--client-count: ${Math.min(logos.length, 3)}`;
	return renderTemplate`${maybeRenderHead($$result)}<section class="section section--alt" id="clientes"><div class="container"><div class="section-head"><h2 class="section-title">${title ?? "Nuestros clientes"}</h2></div>${hasTestimonials ? renderTemplate`<div class="clients-wall"${addAttribute(gridStyle, "style")}>${logos.map((logo) => {
		const quote = logo.quote?.trim();
		const blurb = logo.description?.trim();
		const mark = renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<img class="client-card__logo" data-client-logo data-fallback="1"${addAttribute(mediaUrl(logo.image), "src")}${addAttribute(logo.name, "alt")} loading="lazy"><span class="client-card__name" hidden>${logo.name}</span>` })}`;
		return renderTemplate`<figure class="client-card"><div class="client-card__mark">${logo.url ? renderTemplate`<a class="client-card__link"${addAttribute(logo.url, "href")} target="_blank" rel="noopener noreferrer"${addAttribute(logo.name, "aria-label")}>${mark}</a>` : mark}</div>${quote ? renderTemplate`<blockquote class="client-card__quote">${quote}</blockquote>` : blurb && renderTemplate`<p class="client-card__blurb">${blurb}</p>`}${quote && renderTemplate`<figcaption class="client-card__author">${logo.quote_author?.trim() || logo.name}</figcaption>`}</figure>`;
	})}</div>` : renderTemplate`<div class="clients-grid"${addAttribute(gridStyle, "style")}>${logos.map((logo) => {
		const logoImg = renderTemplate`<img class="clients-grid__logo" data-client-logo data-fallback="1"${addAttribute(mediaUrl(logo.image), "src")}${addAttribute(logo.name, "alt")} loading="lazy">`;
		return renderTemplate`<div class="clients-grid__item">${logo.url ? renderTemplate`<a class="clients-grid__link"${addAttribute(logo.url, "href")} target="_blank" rel="noopener noreferrer">${logoImg}</a>` : logoImg}<span class="clients-grid__name" hidden>${logo.name}</span></div>`;
	})}</div>`}</div></section>${renderScript($$result, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/ClientsShowcase.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/ClientsShowcase.astro", void 0);
//#endregion
//#region src/components/SectionRenderer.astro
createAstro("https://astro.build");
var $$SectionRenderer = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SectionRenderer;
	const { sections, pageSlug = null } = Astro.props;
	return renderTemplate`${sections.map((section, index) => {
		switch (section.type) {
			case "banner_carousel": {
				const { slides = [] } = section.content;
				return slides.length ? renderTemplate`${renderComponent($$result, "BannerCarousel", $$BannerCarousel, {
					"slides": slides,
					"primary": index === 0
				})}` : null;
			}
			case "page_hero": {
				const { title, subtitle, image } = section.content;
				return title ? renderTemplate`${renderComponent($$result, "PageHero", $$PageHero, {
					"title": title,
					"subtitle": subtitle,
					"image": image
				})}` : null;
			}
			case "rich_text": {
				const { title, body, video_url } = section.content;
				return renderTemplate`${renderComponent($$result, "RichText", $$RichText, {
					"title": title,
					"body": body ?? "",
					"video_url": video_url
				})}`;
			}
			case "feature_grid": {
				const { title, items = [] } = section.content;
				return items.length ? renderTemplate`${renderComponent($$result, "FeatureGrid", $$FeatureGrid, {
					"title": title,
					"items": items
				})}` : null;
			}
			case "image_gallery": {
				const { title, images = [] } = section.content;
				return images.length ? renderTemplate`${renderComponent($$result, "ImageGallery", $$ImageGallery, {
					"title": title,
					"images": images
				})}` : null;
			}
			case "clients_showcase": {
				const { title, logos = [] } = section.content;
				return logos.length ? renderTemplate`${renderComponent($$result, "ClientsShowcase", $$ClientsShowcase, {
					"title": title,
					"logos": logos
				})}` : null;
			}
			case "lead_capture_form": {
				const { title, intro, submit_label, fields } = section.content;
				const onInk = index > 1;
				return renderTemplate`${maybeRenderHead($$result)}<section${addAttribute(["section", { "section--ink": onInk }], "class:list")} id="contacto"><div class="container container--narrow">${renderComponent($$result, "LeadCaptureForm", $$LeadCaptureForm, {
					"formId": `lead-form-${index}`,
					"source": pageSlug,
					"title": title ?? void 0,
					"intro": intro,
					"submit_label": submit_label ?? void 0,
					"fields": fields?.length ? fields : void 0
				})}</div></section>`;
			}
			default: return null;
		}
	})}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/SectionRenderer.astro", void 0);
//#endregion
export { $$PageHero as n, $$SectionRenderer as t };
