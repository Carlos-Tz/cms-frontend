import { c as fetchData, d as createComponent, f as __exportAll, n as $$Layout, t as $$LeadCaptureForm } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { i as Fragment, m as maybeRenderHead, r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
import { n as $$PageHero, t as $$SectionRenderer } from "./SectionRenderer_BRcTAry8.mjs";
//#region src/pages/contacto/index.astro
var contacto_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const page = (await fetchData("pages/contacto"))?.data;
	const sections = page?.sections ?? [];
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": page?.title ?? "Contacto" }, { "default": ($$result) => renderTemplate`${!page && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "PageHero", $$PageHero, {
		"title": "Contacto",
		"subtitle": "Estamos para ayudarte."
	})}${maybeRenderHead($$result)}<section class="section" id="contacto"><div class="container container--narrow">${renderComponent($$result, "LeadCaptureForm", $$LeadCaptureForm, {
		"formId": "contacto-lead-form",
		"source": "contacto",
		"title": "Escríbenos",
		"intro": "Déjanos tus datos y un asesor se comunicará contigo.",
		"submit_label": "Enviar"
	})}</div></section>` })}`}${renderComponent($$result, "SectionRenderer", $$SectionRenderer, {
		"sections": sections,
		"pageSlug": page?.slug ?? "contacto"
	})}` })}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/contacto/index.astro", void 0);
var $$file = "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/contacto/index.astro";
var $$url = "/contacto";
//#endregion
//#region \0virtual:astro:page:src/pages/contacto/index@_@astro
var page = () => contacto_exports;
//#endregion
export { page };
