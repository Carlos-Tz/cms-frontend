import { c as fetchData, d as createComponent, f as __exportAll, i as fetchCategories, l as mediaUrl, n as $$Layout, o as formatPrice, r as fetchAllProducts, s as FALLBACK_IMAGE, u as renderScript } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { T as createAstro, g as addAttribute, i as Fragment, m as maybeRenderHead, r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
import { n as $$PageHero, t as $$SectionRenderer } from "./SectionRenderer_BRcTAry8.mjs";
//#region src/components/ProductCatalog.astro
createAstro("https://astro.build");
var $$ProductCatalog = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ProductCatalog;
	const { categories, products } = Astro.props;
	const fold = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	return renderTemplate`${maybeRenderHead($$result)}<section class="section" id="catalogo" data-catalog><div class="container">${products.length === 0 ? renderTemplate`<div class="catalog-empty"><p class="card__title">Catálogo en preparación</p><p class="card__text">Estamos cargando nuestros productos. Escríbenos y te compartimos la ficha técnica que necesitas.</p><a class="btn-primary" href="/contacto" style="margin-top: 1.25rem;">Solicitar información</a></div>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="catalog-bar"><div class="catalog-chips" role="group" aria-label="Filtrar por categoría"><button type="button" class="catalog-chip is-active" data-catalog-category="" aria-pressed="true">Todos</button>${categories.map((category) => renderTemplate`<button type="button" class="catalog-chip"${addAttribute(category.slug, "data-catalog-category")} aria-pressed="false">${category.name}</button>`)}</div><div class="catalog-search"><label class="sr-only" for="catalog-search">Buscar producto</label><input type="search" id="catalog-search" placeholder="Buscar producto…" autocomplete="off" data-catalog-search></div></div><p class="catalog-count" data-catalog-count aria-live="polite"></p><div class="grid grid--3 catalog-grid">${products.map((product) => renderTemplate`<a class="card product-card"${addAttribute(`/productos/${product.slug}`, "href")} data-product${addAttribute(product.category?.slug ?? "", "data-category")}${addAttribute(fold(`${product.name} ${product.category?.name ?? ""}`), "data-haystack")}><div class="product-card__media"><img${addAttribute(product.image ? mediaUrl(product.image) : FALLBACK_IMAGE, "src")}${addAttribute(product.name, "alt")} loading="lazy" width="480" height="360"></div>${product.category?.name && renderTemplate`<p class="card__subtitle">${product.category.name}</p>`}<p class="card__title product-card__title">${product.name}</p><div class="product-card__foot"><span class="product-card__price">${formatPrice(product.price)}</span><span class="product-card__cta">Ver detalle</span></div></a>`)}</div><p class="catalog-empty-filter" data-catalog-empty hidden>No encontramos productos con esos criterios. Prueba con otra categoría o<a href="/contacto">escríbenos</a>.</p>` })}`}</div></section>${renderScript($$result, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/ProductCatalog.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/components/ProductCatalog.astro", void 0);
//#endregion
//#region src/pages/productos/index.astro
var productos_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const page = (await fetchData("pages/productos"))?.data;
	const sections = page?.sections ?? [];
	const [categories, products] = await Promise.all([fetchCategories(), fetchAllProducts()]);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": page?.title ?? "Productos" }, { "default": ($$result) => renderTemplate`${!page && renderTemplate`${renderComponent($$result, "PageHero", $$PageHero, {
		"title": "Productos",
		"subtitle": "Equipo industrial para gas natural."
	})}`}${renderComponent($$result, "SectionRenderer", $$SectionRenderer, {
		"sections": sections,
		"pageSlug": page?.slug ?? "productos"
	})}${renderComponent($$result, "ProductCatalog", $$ProductCatalog, {
		"categories": categories,
		"products": products
	})}` })}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/productos/index.astro", void 0);
var $$file = "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/productos/index.astro";
var $$url = "/productos";
//#endregion
//#region \0virtual:astro:page:src/pages/productos/index@_@astro
var page = () => productos_exports;
//#endregion
export { page };
