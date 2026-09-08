import { c as fetchData, d as createComponent, f as __exportAll, n as $$Layout, s as FALLBACK_IMAGE } from "./LeadCaptureForm_Dtn3SIpj.mjs";
import { r as renderComponent, u as renderTemplate } from "./server_DFjnqDUU.mjs";
import { t as $$SectionRenderer } from "./SectionRenderer_BRcTAry8.mjs";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const page = (await fetchData("pages/inicio"))?.data;
	const fallbackSections = [
		{
			type: "banner_carousel",
			content: { slides: [
				{
					image: FALLBACK_IMAGE,
					title: "Soluciones integrales para tu industria",
					subtitle: "Diseñamos, instalamos y damos mantenimiento a sistemas de gas natural para plantas industriales en todo México.",
					link_url: "/productos",
					link_label: "Conoce nuestros productos"
				},
				{
					image: FALLBACK_IMAGE,
					title: "Seguridad y eficiencia en cada proyecto",
					subtitle: "Equipos certificados y personal especializado que acompañan tu operación de principio a fin.",
					link_url: null,
					link_label: null
				},
				{
					image: FALLBACK_IMAGE,
					title: "Tu operación, siempre en marcha",
					subtitle: "Monitoreo y mantenimiento preventivo para que tu suministro de gas natural nunca se detenga.",
					link_url: null,
					link_label: null
				}
			] }
		},
		{
			type: "clients_showcase",
			content: {
				title: "Nuestros clientes",
				logos: Array.from({ length: 6 }, (_, index) => ({
					name: `Cliente ${index + 1}`,
					image: FALLBACK_IMAGE,
					url: null
				}))
			}
		},
		{
			type: "rich_text",
			content: {
				title: "Especialistas en gas natural para la industria",
				body: `<p>En Tectuus, parte de GNU Gas Natural, diseñamos e implementamos soluciones de gas natural a la medida de cada planta industrial: desde la estación de regulación y medición hasta la compresión y valvulería que mantienen tu operación segura y en marcha.</p><p>Nuestro equipo acompaña cada proyecto de principio a fin, con ingeniería certificada, instalación y mantenimiento preventivo pensado para reducir paros no programados.</p>`,
				video_url: null
			}
		},
		{
			type: "feature_grid",
			content: {
				title: "Todo lo que tu planta necesita en gas natural",
				items: [
					{
						icon: null,
						title: "EDRM",
						text: "Diseño, fabricación e instalación de estaciones de regulación y medición de gas natural, con control de presión y medición certificada para procesos industriales."
					},
					{
						icon: null,
						title: "Compresoras",
						text: "Equipos de compresión de gas natural dimensionados a la demanda de tu planta, con mantenimiento preventivo y monitoreo remoto."
					},
					{
						icon: null,
						title: "Valvulería",
						text: "Suministro de válvulas y accesorios de alta especificación para líneas de gas natural, cumpliendo normativa nacional e internacional."
					}
				]
			}
		},
		{
			type: "lead_capture_form",
			content: {
				title: "Contacto",
				intro: "Déjanos tus datos y un asesor se comunicará contigo.",
				submit_label: "Enviar",
				fields: [
					"name",
					"email",
					"phone",
					"message"
				]
			}
		}
	];
	const sections = page?.sections?.length ? page.sections : fallbackSections;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "slug": page?.slug ?? "inicio" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "SectionRenderer", $$SectionRenderer, {
		"sections": sections,
		"pageSlug": page?.slug ?? "inicio"
	})}` })}`;
}, "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/index.astro", void 0);
var $$file = "C:/Users/Gilda/Documents/cms-frontend/tectuus/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
