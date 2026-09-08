import { C as unescapeHTML, T as createAstro, Y as InvalidComponentArgs, _ as defineScriptVars, g as addAttribute, h as renderHead, i as Fragment, m as maybeRenderHead, r as renderComponent, s as renderSlot, u as renderTemplate, v as createRenderInstruction, z as AstroError } from "./server_DFjnqDUU.mjs";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/astro/dist/runtime/server/astro-component.js
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== "object") return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
	const fn = (...args) => {
		if (!validateArgs(args)) throw new AstroError({
			...InvalidComponentArgs,
			message: InvalidComponentArgs.message(name)
		});
		return cb(...args);
	};
	Object.defineProperty(fn, "name", {
		value: name,
		writable: false
	});
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	return baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === "function") return baseCreateComponent(arg1, moduleId, propagation);
	else return createComponentWithOptions(arg1);
}
//#endregion
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region src/functions/fetch.ts
var BASE_URL = "https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/tectuus/";
var MEDIA_ORIGIN = new URL(BASE_URL).origin;
var FALLBACK_IMAGE = "/placeholder-plate.svg";
function mediaUrl(path) {
	if (!path) return path;
	return /^(https?:\/\/|\/)/i.test(path) ? path : `${MEDIA_ORIGIN}/storage/${path}`;
}
async function fetchData(suffix) {
	try {
		return await (await fetch(BASE_URL + suffix)).json();
	} catch (error) {
		console.error("Error fetching data:", error);
	}
}
//#endregion
//#region src/functions/catalog.ts
var MAX_PAGES = 25;
async function fetchCategories() {
	return (await fetchData("product-categories"))?.data ?? [];
}
async function fetchAllProducts() {
	const products = [];
	for (let page = 1; page <= MAX_PAGES; page += 1) {
		const response = await fetchData(`products?page=${page}`);
		const items = response?.data;
		if (!items?.length) break;
		products.push(...items);
		if (page >= (response?.meta?.last_page ?? page)) break;
	}
	return products;
}
async function fetchProduct(slug) {
	return (await fetchData(`products/${slug}`))?.data;
}
var priceFormatter = new Intl.NumberFormat("es-MX", {
	style: "currency",
	currency: "MXN",
	maximumFractionDigits: 2
});
function formatPrice(price) {
	if (price === null || price === void 0 || price === "") return "Precio a cotizar";
	const amount = Number(price);
	return Number.isFinite(amount) ? priceFormatter.format(amount) : "Precio a cotizar";
}
//#endregion
//#region src/config/seo.ts
var seo = {
	siteName: "Tectuus",
	titleSeparator: "—",
	defaultTitle: "Tectuus — Soluciones en gas natural para tu industria",
	defaultDescription: "Tectuus: ingeniería y equipo industrial para gas natural — EDRM, compresoras y valvulería, con instalación y mantenimiento certificado.",
	siteUrl: "https://www.tectuus.mx",
	defaultImage: null,
	locale: "es_MX",
	twitterHandle: null,
	twitterCard: "summary_large_image"
};
//#endregion
//#region src/components/nav/NavItem.astro
createAstro("https://astro.build");
var $$NavItem = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$NavItem;
	const { item } = Astro.props;
	return renderTemplate`${item.children?.length > 0 ? renderTemplate`${maybeRenderHead($$result)}<div class="nav-item"><button class="nav-link nav-link--toggle" aria-expanded="false" aria-haspopup="true">${item.title}<svg class="nav-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg></button><div class="nav-dropdown">${item.children.map((child) => renderTemplate`<div class="nav-dropdown__group"><a class="nav-dropdown__link nav-dropdown__link--parent"${addAttribute(child.path, "href")}>${child.title}</a>${child.children?.length > 0 && renderTemplate`<div class="nav-dropdown__sublist">${child.children.map((grandchild) => renderTemplate`<a class="nav-dropdown__link nav-dropdown__link--sub"${addAttribute(grandchild.path, "href")}>${grandchild.title}</a>`)}</div>`}</div>`)}</div></div>` : renderTemplate`<a class="nav-link"${addAttribute(item.path, "href")}>${item.title}</a>`}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/nav/NavItem.astro", void 0);
//#endregion
//#region src/components/nav/NavItemMobile.astro
createAstro("https://astro.build");
var $$NavItemMobile = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$NavItemMobile;
	const { item } = Astro.props;
	return renderTemplate`${item.children?.length > 0 ? renderTemplate`${maybeRenderHead($$result)}<details class="nav-mobile__item"><summary>${item.title}</summary><div class="nav-mobile__sublist">${item.children.map((child) => child.children?.length > 0 ? renderTemplate`<details class="nav-mobile__item nav-mobile__item--nested"><summary>${child.title}</summary><div class="nav-mobile__sublist">${child.children.map((grandchild) => renderTemplate`<a${addAttribute(grandchild.path, "href")}>${grandchild.title}</a>`)}</div></details>` : renderTemplate`<a${addAttribute(child.path, "href")}>${child.title}</a>`)}</div></details>` : renderTemplate`<a${addAttribute(item.path, "href")}>${item.title}</a>`}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/nav/NavItemMobile.astro", void 0);
//#endregion
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title, description, image, noindex = false, slug = null } = Astro.props;
	const pageTitle = title ? `${title} ${seo.titleSeparator} ${seo.siteName}` : seo.defaultTitle;
	const pageDescription = description ?? seo.defaultDescription;
	const socialImage = image ?? seo.defaultImage;
	const canonicalUrl = new URL(Astro.url.pathname, seo.siteUrl).toString();
	const socialImageUrl = socialImage ? new URL(socialImage, seo.siteUrl).toString() : null;
	const fallbackMenu = [
		{
			slug: "inicio",
			path: "/",
			title: "Inicio",
			children: []
		},
		{
			slug: "sobre-nosotros",
			path: "/sobre-nosotros",
			title: "Sobre nosotros",
			children: []
		},
		{
			slug: "productos",
			path: "/productos",
			title: "Productos",
			children: []
		},
		{
			slug: "contacto",
			path: "/contacto",
			title: "Contacto",
			children: []
		}
	];
	const menuResponse = await fetchData("menu");
	const cmsMenu = menuResponse?.data?.length ? menuResponse.data : fallbackMenu;
	const categoryChildren = (await fetchCategories()).map((category) => ({
		slug: category.slug,
		path: `/productos?category=${category.slug}`,
		title: category.name,
		children: []
	}));
	const menuItems = cmsMenu.map((item) => item.slug === "productos" && !item.children?.length ? {
		...item,
		children: categoryChildren
	} : item);
	const globals = (await fetchData("globals"))?.data;
	const contactInfo = globals?.contact_info;
	const socialIcons = globals?.social_icons;
	const whatsappButton = globals?.whatsapp_button;
	const footerEmail = contactInfo?.email ?? "contacto@tectuus.com";
	const footerPhone = contactInfo?.phone;
	const footerSchedule = contactInfo?.schedule;
	const footerAddress = contactInfo?.address;
	const footerAdditionalInfo = contactInfo?.additional_info;
	const SOCIAL_ICON_MARKUP = {
		facebook: "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"currentColor\"><path d=\"M13.5 21v-7.9h2.65l.4-3.08h-3.05V8.05c0-.89.25-1.5 1.52-1.5h1.63V3.84C15.94 3.76 15.06 3.7 14.03 3.7c-2.24 0-3.78 1.37-3.78 3.87v2.16H7.6v3.08h2.65V21h3.25Z\"/></svg>",
		instagram: "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\"1\"/></svg>",
		linkedin: "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"currentColor\"><path d=\"M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.4 8.75h3.5V21H3.4V8.75Zm6.2 0h3.36v1.68h.05c.47-.87 1.6-1.8 3.3-1.8 3.53 0 4.18 2.24 4.18 5.16V21H16.9v-6.13c0-1.46-.03-3.35-2.05-3.35-2.05 0-2.37 1.58-2.37 3.24V21H9.6V8.75Z\"/></svg>",
		youtube: "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"currentColor\"><path d=\"M21.6 7.2s-.2-1.5-.85-2.15c-.8-.85-1.7-.85-2.1-.9C15.8 4 12 4 12 4h0s-3.8 0-6.65.15c-.4.05-1.3.05-2.1.9C2.6 5.7 2.4 7.2 2.4 7.2S2.2 9 2.2 10.7v1.6c0 1.7.2 3.5.2 3.5s.2 1.5.85 2.15c.8.85 1.85.82 2.3.91C7.2 19 12 19 12 19s3.8 0 6.65-.15c.4-.05 1.3-.05 2.1-.9.65-.65.85-2.15.85-2.15s.2-1.8.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM10 14.6V8.9l5.2 2.85z\"/></svg>",
		twitter: "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"currentColor\"><path d=\"M18.9 3H21l-6.4 7.3L22 21h-5.9l-4.6-6-5.3 6H3l6.8-7.8L2.4 3h6l4.2 5.5L18.9 3zM17.9 19.3h1.6L8.2 4.6H6.5l11.4 14.7z\"/></svg>"
	};
	const socialNetworks = (socialIcons?.networks?.length ? socialIcons.networks : [
		{
			network: "facebook",
			url: "#"
		},
		{
			network: "instagram",
			url: "#"
		},
		{
			network: "linkedin",
			url: "#"
		}
	]).filter((item) => SOCIAL_ICON_MARKUP[item.network]);
	const whatsappHref = `https://wa.me/${(whatsappButton?.phone || "5215500000000").replace(/\D/g, "")}${whatsappButton?.prefilled_message ? `?text=${encodeURIComponent(whatsappButton.prefilled_message)}` : ""}`;
	return renderTemplate`<html lang="es"><head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"${addAttribute(Astro.generator, "content")}><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"><title>${pageTitle}</title><meta name="description"${addAttribute(pageDescription, "content")}><link rel="canonical"${addAttribute(canonicalUrl, "href")}>${noindex && renderTemplate`<meta name="robots" content="noindex, nofollow">`}<meta property="og:type" content="website"><meta property="og:site_name"${addAttribute(seo.siteName, "content")}><meta property="og:locale"${addAttribute(seo.locale, "content")}><meta property="og:url"${addAttribute(canonicalUrl, "content")}><meta property="og:title"${addAttribute(pageTitle, "content")}><meta property="og:description"${addAttribute(pageDescription, "content")}>${socialImageUrl && renderTemplate`<meta property="og:image"${addAttribute(socialImageUrl, "content")}>`}<meta name="twitter:card"${addAttribute(seo.twitterCard, "content")}>${seo.twitterHandle && renderTemplate`<meta name="twitter:site"${addAttribute(seo.twitterHandle, "content")}>`}<meta name="twitter:title"${addAttribute(pageTitle, "content")}><meta name="twitter:description"${addAttribute(pageDescription, "content")}>${socialImageUrl && renderTemplate`<meta name="twitter:image"${addAttribute(socialImageUrl, "content")}>`}<script>(function(){${defineScriptVars({ fallbackImage: FALLBACK_IMAGE })}
      // A CMS image path can point at a file that was never uploaded, which
      // would drop a broken-image icon into the layout. Swap those for the
      // blank plate instead. Registered here in <head> with capture, since
      // error events fire during load and don't bubble.
      document.addEventListener(
        "error",
        (event) => {
          const el = event.target;
          if (el && el.tagName === "IMG" && el.dataset.fallback !== "1") {
            el.dataset.fallback = "1";
            el.src = fallbackImage;
          }
        },
        true
      );
    })();<\/script>${renderHead($$result)}</head><body><a class="skip-link" href="#contenido">Saltar al contenido</a><header class="site-header"><div class="container site-header__inner"><a href="/" class="brand"><span class="brand__mark" aria-hidden="true"><img src="/favicon.svg" alt="" width="22" height="22"></span>TECTUUS</a><nav class="nav" aria-label="Principal">${menuItems.map((item) => renderTemplate`${renderComponent($$result, "NavItem", $$NavItem, { "item": item })}`)}</nav><div class="header-actions"><div class="social-row" style="margin-top: 0;" aria-label="Redes sociales">${socialNetworks.map((item) => renderTemplate`<a class="social-icon"${addAttribute(item.url || "#", "href")} target="_blank" rel="noopener noreferrer"${addAttribute(item.network, "aria-label")}>${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result) => renderTemplate`${unescapeHTML(SOCIAL_ICON_MARKUP[item.network])}` })}</a>`)}</div><a class="btn-primary btn-primary--compact" href="/contacto">Escríbenos</a></div><button class="nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button></div><nav class="nav-mobile" id="nav-mobile" aria-label="Principal móvil">${menuItems.map((item) => renderTemplate`${renderComponent($$result, "NavItemMobile", $$NavItemMobile, { "item": item })}`)}<a href="/contacto" class="btn-primary">Escríbenos</a></nav></header><main id="contenido"${addAttribute(slug, "data-page")}>${renderSlot($$result, $$slots["default"])}</main><footer class="site-footer"><div class="container"><div class="footer-grid"><div><a href="/" class="brand brand--on-dark"><span class="brand__mark" aria-hidden="true"><img src="/favicon.svg" alt="" width="22" height="22"></span>TECTUUS</a><p class="footer-tagline">Ingeniería y equipo industrial para gas natural: EDRM, compresoras y valvulería.</p><div class="social-row">${socialNetworks.map((item) => renderTemplate`<a class="social-icon social-icon--on-dark"${addAttribute(item.url || "#", "href")} target="_blank" rel="noopener noreferrer"${addAttribute(item.network, "aria-label")}>${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result) => renderTemplate`${unescapeHTML(SOCIAL_ICON_MARKUP[item.network])}` })}</a>`)}</div></div><div><p class="footer-heading">Navegación</p>${menuItems.map((item) => renderTemplate`<a class="footer-link"${addAttribute(item.path, "href")}>${item.title}</a>`)}</div><div><p class="footer-heading">Contacto</p>${footerAddress && renderTemplate`<p class="footer-link">${footerAddress}</p>`}<a class="footer-link"${addAttribute(`mailto:${footerEmail}`, "href")}>${footerEmail}</a>${footerPhone && renderTemplate`<a class="footer-link"${addAttribute(`tel:${footerPhone.replace(/\s/g, "")}`, "href")}>${footerPhone}</a>`}${footerSchedule && renderTemplate`<p class="footer-link">${footerSchedule}</p>`}${footerAdditionalInfo && renderTemplate`<p class="footer-link">${footerAdditionalInfo}</p>`}</div></div><div class="footer-bottom"><span>Tectuus, parte de GNU Gas Natural. Todos los derechos reservados, ${(/* @__PURE__ */ new Date()).getFullYear()}.</span><span class="footer-bottom__legal"><span>Aviso de privacidad</span><span>Términos y condiciones</span></span></div></div></footer><a class="whatsapp-fab"${addAttribute(whatsappHref, "href")} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.4 1.33-1.94 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.29.75 1.24 1.6 2 1.11.99 2.05 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.14.48.21.55.33.07.12.07.68-.17 1.36Z"></path></svg></a>${renderScript($$result, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")}</body></html>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/layouts/Layout.astro", void 0);
//#endregion
//#region src/components/sections/LeadCaptureForm.astro
createAstro("https://astro.build");
var $$LeadCaptureForm = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$LeadCaptureForm;
	const contactFieldMeta = {
		name: {
			label: "Nombre completo",
			type: "text",
			placeholder: "Tu nombre"
		},
		company: {
			label: "Empresa",
			type: "text",
			placeholder: "Nombre de tu empresa"
		},
		email: {
			label: "Correo electrónico",
			type: "email",
			placeholder: "tu@empresa.com"
		},
		phone: {
			label: "Teléfono",
			type: "tel",
			placeholder: "Ej. 55 1234 5678"
		},
		message: {
			label: "Mensaje",
			type: "textarea",
			placeholder: "Cuéntanos sobre tu proyecto"
		},
		product: {
			label: "Producto de interés",
			type: "text",
			placeholder: "EDRM, compresoras, valvulería…"
		}
	};
	const CORE_FIELDS = [
		"name",
		"email",
		"phone",
		"message"
	];
	const { title = "Escríbenos", intro, submit_label = "Enviar", fields = [
		"name",
		"email",
		"phone",
		"message"
	], formId = "lead-form", source = null } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div class="card"><p class="card__title" style="margin-bottom: 1rem;">${title}</p>${intro && renderTemplate`<p class="card__text" style="margin-bottom: 1rem;">${intro}</p>`}<form${addAttribute(formId, "id")}>${fields.map((field) => {
		const meta = contactFieldMeta[field] ?? {
			label: field.charAt(0).toUpperCase() + field.slice(1),
			type: "text",
			placeholder: ""
		};
		return renderTemplate`<div class="field"><label${addAttribute(`${formId}-${field}`, "for")}>${meta.label}</label>${meta.type === "textarea" ? renderTemplate`<textarea${addAttribute(`${formId}-${field}`, "id")}${addAttribute(field, "name")} rows="4"${addAttribute(meta.placeholder, "placeholder")}></textarea>` : renderTemplate`<input${addAttribute(meta.type, "type")}${addAttribute(`${formId}-${field}`, "id")}${addAttribute(field, "name")}${addAttribute(meta.placeholder, "placeholder")}${addAttribute(field !== "phone" && field !== "company", "required")}>`}</div>`;
	})}<button type="submit" class="btn-primary lead-form__submit">${submit_label}</button><p class="lead-form__status" data-lead-form-status role="status" aria-live="polite"></p></form></div><script>(function(){${defineScriptVars({
		apiBase: BASE_URL,
		leadFormId: formId,
		leadSource: source,
		coreFields: CORE_FIELDS
	})}
  const form = document.getElementById(leadFormId);
  const status = form ? form.querySelector("[data-lead-form-status]") : null;

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const entries = Object.fromEntries(new FormData(form).entries());

    // Core keys are columns of \`leads\`; anything else the CMS declared in
    // \`fields[]\` has to travel inside \`details\`.
    const payload = leadSource ? { source: leadSource } : {};
    const details = {};

    for (const [key, value] of Object.entries(entries)) {
      if (coreFields.includes(key)) payload[key] = value;
      else details[key] = value;
    }
    if (Object.keys(details).length) payload.details = details;

    if (submitButton) submitButton.disabled = true;
    if (status) {
      status.textContent = "Enviando...";
      status.className = "lead-form__status";
    }

    try {
      const response = await fetch(apiBase + "leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        // 429 is the route's throttle:10,1; 422 carries per-field messages.
        const firstError = result?.errors ? Object.values(result.errors)[0]?.[0] : null;
        throw new Error(
          response.status === 429
            ? "Recibimos demasiados envíos. Espera un momento e intenta de nuevo."
            : firstError || result?.message || "No pudimos enviar tu mensaje. Intenta de nuevo."
        );
      }

      form.reset();
      if (status) {
        status.textContent = result?.meta?.message || "Gracias por contactarnos.";
        status.className = "lead-form__status lead-form__status--success";
      }
    } catch (error) {
      if (status) {
        status.textContent = error?.message || "No pudimos enviar tu mensaje. Intenta de nuevo.";
        status.className = "lead-form__status lead-form__status--error";
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
})();<\/script>`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/sections/LeadCaptureForm.astro", void 0);
//#endregion
export { fetchProduct as a, fetchData as c, createComponent as d, __exportAll as f, fetchCategories as i, mediaUrl as l, $$Layout as n, formatPrice as o, fetchAllProducts as r, FALLBACK_IMAGE as s, $$LeadCaptureForm as t, renderScript as u };
