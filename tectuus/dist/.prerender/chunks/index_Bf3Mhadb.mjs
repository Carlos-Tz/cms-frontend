import { c as fetchData, d as createComponent, f as __exportAll, n as $$Layout } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
import { n as $$PageHero, t as $$SectionRenderer } from "./SectionRenderer_BRcTAry8.mjs";
//#region src/pages/sobre-nosotros/index.astro
var sobre_nosotros_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const page = (await fetchData("pages/sobre-nosotros"))?.data;
	const sections = page?.sections ?? [];
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": page?.title ?? "Sobre nosotros" }, { "default": ($$result) => renderTemplate`${!page && renderTemplate`${renderComponent($$result, "PageHero", $$PageHero, {
		"title": "¿Quiénes somos?",
		"subtitle": "Historia, misión, visión y valores."
	})}`}${renderComponent($$result, "SectionRenderer", $$SectionRenderer, {
		"sections": sections,
		"pageSlug": page?.slug ?? "sobre-nosotros"
	})}` })}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/sobre-nosotros/index.astro", void 0);
var $$file = "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/sobre-nosotros/index.astro";
var $$url = "/sobre-nosotros";
//#endregion
//#region \0virtual:astro:page:src/pages/sobre-nosotros/index@_@astro
var page = () => sobre_nosotros_exports;
//#endregion
export { page };
