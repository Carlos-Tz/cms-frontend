import { a as fetchProduct, d as createComponent, f as __exportAll, l as mediaUrl, n as $$Layout, o as formatPrice, r as fetchAllProducts, s as FALLBACK_IMAGE, t as $$LeadCaptureForm, u as renderScript } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { T as createAstro, g as addAttribute, i as Fragment, m as maybeRenderHead, r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
//#region src/pages/productos/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	getStaticPaths: () => getStaticPaths,
	url: () => $$url
});
createAstro("https://astro.build");
async function getStaticPaths() {
	return (await fetchAllProducts()).map((product) => ({
		params: { slug: product.slug },
		props: { listing: product }
	}));
}
var $$Slug = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	const { slug } = Astro.params;
	const { listing } = Astro.props;
	const product = await fetchProduct(slug) ?? listing;
	const gallery = product.images?.length ? product.images : [listing?.image].filter(Boolean);
	const description = product.description?.trim();
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": product.name,
		"description": description || `${product.name} — ${product.category?.name ?? "equipo industrial"} para gas natural.`,
		"image": gallery[0] ? mediaUrl(gallery[0]) : void 0
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="section product-detail"><div class="container"><nav class="breadcrumb" aria-label="Ruta de navegación"><a href="/productos">Productos</a>${product.category?.slug && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<span aria-hidden="true">/</span><a${addAttribute(`/productos?category=${product.category.slug}`, "href")}>${product.category.name}</a>` })}`}<span aria-hidden="true">/</span><span aria-current="page">${product.name}</span></nav><div class="split product-detail__layout"><div class="product-detail__media"><div class="product-detail__plate"><img class="product-detail__image" id="product-image"${addAttribute(gallery[0] ? mediaUrl(gallery[0]) : FALLBACK_IMAGE, "src")}${addAttribute(product.name, "alt")} width="720" height="540"></div>${gallery.length > 1 && renderTemplate`<div class="product-detail__thumbs" role="group" aria-label="Imágenes del producto">${gallery.map((image, index) => renderTemplate`<button type="button"${addAttribute(["product-detail__thumb", { "is-active": index === 0 }], "class:list")}${addAttribute(mediaUrl(image), "data-product-thumb")}${addAttribute(`Ver imagen ${index + 1} de ${product.name}`, "aria-label")}><img${addAttribute(mediaUrl(image), "src")} alt="" loading="lazy" width="120" height="90"></button>`)}</div>`}</div><div>${product.category?.name && renderTemplate`<p class="eyebrow">${product.category.name}</p>`}<h1 class="product-detail__title">${product.name}</h1><p class="product-detail__price">${formatPrice(product.price)}</p>${description ? renderTemplate`<p class="product-detail__text">${description}</p>` : renderTemplate`<p class="product-detail__text">Escríbenos para recibir la ficha técnica y las especificaciones de este equipo.</p>`}<div class="product-detail__actions"><a class="btn-primary" href="#cotizar">Solicitar cotización</a><a class="btn-secondary" href="/productos">Ver todo el catálogo</a></div></div></div></div></section><section class="section section--ink" id="cotizar"><div class="container container--narrow">${renderComponent($$result, "LeadCaptureForm", $$LeadCaptureForm, {
		"formId": "product-lead-form",
		"source": "productos",
		"title": "Solicita una cotización",
		"intro": `Cuéntanos qué necesitas de ${product.name} y un asesor te contacta.`,
		"submit_label": "Enviar solicitud"
	})}</div></section>` })}${renderScript($$result, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/productos/[slug].astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/productos/[slug].astro", void 0);
var $$file = "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/productos/[slug].astro";
var $$url = "/productos/[slug]";
//#endregion
//#region \0virtual:astro:page:src/pages/productos/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
