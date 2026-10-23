import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, updateSection } from '../functions/fetch'
import MapPicker, { DEFAULT_MAP_CENTER } from './map-picker'
import StationsEditor from './stations-editor'
import {
  inputClass,
  fieldError,
  Field,
  CharHint,
  ImageField,
  DynamicItem,
  AddButton,
  updateArrayItem,
} from './form-fields'

const SECTION_LABELS = {
  page_hero: 'Encabezado de página',
  feature_grid: 'Cuadrícula de características',
  rich_text: 'Texto enriquecido',
  clients_showcase: 'Clientes',
  stations_map: 'Mapa de estaciones',
  lead_capture_form: 'Formulario de contacto',
  service_scheduling: 'Agenda de verificación',
  banner_carousel: 'Carrusel de banners',
  savings_simulator: 'Simulador de ahorro',
  contact_info: 'Datos de contacto',
  social_icons: 'Redes sociales',
  whatsapp_button: 'Botón de WhatsApp',
  image_gallery: 'Galería de imágenes',
  testimonials: 'Testimonios',
}

const NETWORK_OPTIONS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']

function parseCenter(center) {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(center ?? '')
  if (!match) return null
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

function FeatureGridEditor({ content, onChange, errors }) {
  const items = content.items ?? []

  function updateItem(i, key, value) {
    onChange({ ...content, items: updateArrayItem(items, i, key, value) })
  }

  function addItem() {
    onChange({ ...content, items: [...items, { icon: null, title: '', text: '' }] })
  }

  function removeItem(i) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {items.map((item, i) => (
        <DynamicItem key={i} title={`Tarjeta ${i + 1}`} onRemove={() => removeItem(i)}>
          <ImageField
            label="Icono"
            hint="96×96 px (cuadrado 1:1) · PNG con fondo transparente · máx. 5 MB, ideal menos de 50 KB. Es un glifo simple, se muestra muy pequeño (24×24 px)."
            value={item.icon}
            onChange={(value) => updateItem(i, 'icon', value)}
            error={fieldError(errors, `content.items.${i}.icon`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" required error={fieldError(errors, `content.items.${i}.title`)}>
              <input
                type="text"
                value={item.title ?? ''}
                onChange={(e) => updateItem(i, 'title', e.target.value)}
                className={inputClass}
              />
              <CharHint value={item.title} recommended={30} max={40} />
            </Field>
            <Field label="Texto" error={fieldError(errors, `content.items.${i}.text`)}>
              <input
                type="text"
                value={item.text ?? ''}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                className={inputClass}
              />
              <CharHint value={item.text} recommended={140} max={180} />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addItem}>+ Agregar tarjeta</AddButton>
    </div>
  )
}

function ClientsShowcaseEditor({ content, onChange, errors }) {
  const logos = content.logos ?? []

  function updateLogo(i, key, value) {
    onChange({ ...content, logos: updateArrayItem(logos, i, key, value) })
  }

  function addLogo() {
    onChange({
      ...content,
      logos: [...logos, { image: '', name: '', url: '', description: null, quote: null, quote_author: null }],
    })
  }

  function removeLogo(i) {
    onChange({ ...content, logos: logos.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {logos.map((logo, i) => (
        <DynamicItem key={i} title={`Cliente ${i + 1}`} onRemove={() => removeLogo(i)}>
          <ImageField
            label="Logo"
            hint="800×500 px (relación 16:10) · PNG con fondo transparente · máx. 5 MB, ideal menos de 300 KB."
            value={logo.image}
            onChange={(value) => updateLogo(i, 'image', value)}
            removable={false}
            error={fieldError(errors, `content.logos.${i}.image`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required error={fieldError(errors, `content.logos.${i}.name`)}>
              <input
                type="text"
                value={logo.name ?? ''}
                onChange={(e) => updateLogo(i, 'name', e.target.value)}
                className={inputClass}
              />
              <CharHint value={logo.name} recommended={30} max={40} />
            </Field>
            <Field label="Enlace" error={fieldError(errors, `content.logos.${i}.url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={logo.url ?? ''}
                onChange={(e) => updateLogo(i, 'url', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Descripción" error={fieldError(errors, `content.logos.${i}.description`)}>
            <input
              type="text"
              value={logo.description ?? ''}
              onChange={(e) => updateLogo(i, 'description', e.target.value || null)}
              className={inputClass}
            />
            <CharHint value={logo.description} recommended={100} max={160} />
          </Field>
          <Field label="Cita / testimonio" error={fieldError(errors, `content.logos.${i}.quote`)}>
            <textarea
              rows={2}
              value={logo.quote ?? ''}
              onChange={(e) => updateLogo(i, 'quote', e.target.value || null)}
              className={inputClass}
            />
            <CharHint value={logo.quote} recommended={120} max={200} />
          </Field>
          <Field label="Autor de la cita" error={fieldError(errors, `content.logos.${i}.quote_author`)}>
            <input
              type="text"
              value={logo.quote_author ?? ''}
              onChange={(e) => updateLogo(i, 'quote_author', e.target.value || null)}
              className={inputClass}
            />
          </Field>
        </DynamicItem>
      ))}
      <AddButton onClick={addLogo}>+ Agregar cliente</AddButton>
    </div>
  )
}

function PageHeroEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" required error={fieldError(errors, 'content.title')}>
          <input
            type="text"
            value={content.title ?? ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.title} recommended={40} max={55} />
        </Field>
        <Field label="Subtítulo" error={fieldError(errors, 'content.subtitle')}>
          <input
            type="text"
            value={content.subtitle ?? ''}
            onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.subtitle} recommended={90} max={110} />
        </Field>
      </div>
      <ImageField
        label="Imagen"
        hint="2400×900 px aprox. (relación 2.6:1) · JPG · máx. 5 MB, ideal menos de 1 MB. Se muestra oscurecida detrás del texto: usa tonos medios/oscuros para mantener el contraste."
        value={content.image}
        onChange={(value) => onChange({ ...content, image: value })}
        error={fieldError(errors, 'content.image')}
      />
    </div>
  )
}

export function RichTextEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <Field label="Título" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value || null })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      <Field
        label="Contenido (HTML)"
        hint="Se guarda tal como se escribe. Recomendado 300-1500 caracteres (1-4 párrafos); el contenedor tiene un ancho máximo de ~736 px."
        error={fieldError(errors, 'content.body')}
      >
        <textarea
          rows={15}
          value={content.body ?? ''}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Video (URL)" error={fieldError(errors, 'content.video_url')}>
        <input
          type="text"
          placeholder="https://…"
          value={content.video_url ?? ''}
          onChange={(e) => onChange({ ...content, video_url: e.target.value || null })}
          className={inputClass}
        />
      </Field>
      <ImageField
        label="Portada del video"
        hint="Imagen que se muestra antes de reproducir el video. 1280×720 px (16:9) · JPG · máx. 5 MB, ideal menos de 500 KB."
        value={content.image_video_url}
        onChange={(value) => onChange({ ...content, image_video_url: value || null })}
        error={fieldError(errors, 'content.image_video_url')}
      />
    </div>
  )
}

export function StationsMapEditor({ content, onChange, errors }) {
  const parsed = parseCenter(content.center) ?? DEFAULT_MAP_CENTER

  function handlePick(lat, lng) {
    onChange({ ...content, center: `${lat.toFixed(6)},${lng.toFixed(6)}` })
  }

  const embedSrc = content.center
    ? `https://www.google.com/maps?q=${encodeURIComponent(content.center)}&z=${content.zoom || 12}&output=embed`
    : null

  return (
    <div className="space-y-4">
      <Field label="Título" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={40} max={60} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Centro del mapa"
          hint="Coordenadas 'latitud,longitud'. Puedes escribirlas o hacer clic en el mapa de abajo."
          error={fieldError(errors, 'content.center')}
        >
          <input
            type="text"
            placeholder="25.671400,-100.309400"
            value={content.center ?? ''}
            onChange={(e) => onChange({ ...content, center: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Zoom" hint="10-14 es un buen valor para una ciudad" error={fieldError(errors, 'content.zoom')}>
          <input
            type="number"
            min="0"
            max="22"
            value={content.zoom ?? ''}
            onChange={(e) => onChange({ ...content, zoom: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <div>
        <span className="mb-1 block text-sm text-white/70">
          Haz clic en el mapa para ubicar el centro
        </span>
        <MapPicker latitude={parsed.lat} longitude={parsed.lng} onPick={handlePick} />
      </div>
      {embedSrc && (
        <div>
          <span className="mb-1 block text-sm text-white/70">Vista previa (como se ve en el sitio)</span>
          <iframe
            src={embedSrc}
            loading="lazy"
            title="Vista previa del mapa"
            className="h-56 w-full rounded-xl border border-white/10"
          />
        </div>
      )}
    </div>
  )
}

function LeadCaptureFormEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" error={fieldError(errors, 'content.title')}>
          <input
            type="text"
            value={content.title ?? ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.title} recommended={40} max={60} />
        </Field>
        <Field label="Texto del botón" hint="2-4 palabras" error={fieldError(errors, 'content.submit_label')}>
          <input
            type="text"
            value={content.submit_label ?? ''}
            onChange={(e) => onChange({ ...content, submit_label: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
        <input
          type="text"
          value={content.intro ?? ''}
          onChange={(e) => onChange({ ...content, intro: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.intro} recommended={120} max={160} />
      </Field>
      {Array.isArray(content.fields) && (
        <p className="text-xs text-white/40">
          Campos del formulario (bloqueado): {content.fields.join(', ')}
        </p>
      )}
    </div>
  )
}

function ServiceSchedulingEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <Field label="Título" required error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={40} max={60} />
      </Field>
      <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
        <input
          type="text"
          value={content.intro ?? ''}
          onChange={(e) => onChange({ ...content, intro: e.target.value || null })}
          className={inputClass}
        />
        <CharHint value={content.intro} recommended={120} max={160} />
      </Field>
      <Field
        label="Mensaje de confirmación"
        required
        hint="Se muestra al visitante después de reservar su cita."
        error={fieldError(errors, 'content.success_message')}
      >
        <input
          type="text"
          value={content.success_message ?? ''}
          onChange={(e) => onChange({ ...content, success_message: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.success_message} recommended={70} max={100} />
      </Field>
      <p className="text-xs text-white/40">
        Los horarios disponibles (10:00-12:00, 12:00-14:00, 14:00-16:00, lunes a sábado) son fijos y se editan en el código, no aquí.
      </p>
    </div>
  )
}

function BannerCarouselEditor({ content, onChange, errors }) {
  const slides = content.slides ?? []

  function updateSlide(i, key, value) {
    onChange({ ...content, slides: updateArrayItem(slides, i, key, value) })
  }

  function addSlide() {
    onChange({
      ...content,
      slides: [...slides, { image: '', title: '', subtitle: '', link_url: '', link_label: '' }],
    })
  }

  function removeSlide(i) {
    onChange({ ...content, slides: slides.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <DynamicItem key={i} title={`Banner ${i + 1}`} onRemove={() => removeSlide(i)}>
          <ImageField
            label="Imagen"
            hint="2400×1000 px aprox. (relación 2.4:1) · JPG · máx. 5 MB, ideal menos de 1 MB. Se recorta a pantalla completa: evita texto o rostros cerca de los bordes."
            value={slide.image}
            onChange={(value) => updateSlide(i, 'image', value)}
            removable={false}
            error={fieldError(errors, `content.slides.${i}.image`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" error={fieldError(errors, `content.slides.${i}.title`)}>
              <input
                type="text"
                value={slide.title ?? ''}
                onChange={(e) => updateSlide(i, 'title', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.title} recommended={45} max={60} />
            </Field>
            <Field label="Subtítulo" error={fieldError(errors, `content.slides.${i}.subtitle`)}>
              <input
                type="text"
                value={slide.subtitle ?? ''}
                onChange={(e) => updateSlide(i, 'subtitle', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.subtitle} recommended={90} max={120} />
            </Field>
            <Field label="Enlace del botón" error={fieldError(errors, `content.slides.${i}.link_url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={slide.link_url ?? ''}
                onChange={(e) => updateSlide(i, 'link_url', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Texto del botón"
              hint="2-4 palabras, ej. 'Cotiza ahora'"
              error={fieldError(errors, `content.slides.${i}.link_label`)}
            >
              <input
                type="text"
                value={slide.link_label ?? ''}
                onChange={(e) => updateSlide(i, 'link_label', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.link_label} recommended={20} max={25} />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addSlide}>+ Agregar banner</AddButton>
    </div>
  )
}

function SavingsSimulatorEditor({ content, onChange, errors }) {
  const fuelPrices = content.fuel_prices ?? []

  function updateFuel(i, key, value) {
    onChange({ ...content, fuel_prices: updateArrayItem(fuelPrices, i, key, value) })
  }

  function addFuel() {
    onChange({
      ...content,
      fuel_prices: [...fuelPrices, { fuel: '', label: '', price_per_unit: '', unit: '', equivalence_factor: '' }],
    })
  }

  function removeFuel(i) {
    onChange({ ...content, fuel_prices: fuelPrices.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" required error={fieldError(errors, 'content.title')}>
          <input
            type="text"
            value={content.title ?? ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.title} recommended={50} max={70} />
        </Field>
        <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
          <input
            type="text"
            value={content.intro ?? ''}
            onChange={(e) => onChange({ ...content, intro: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.intro} recommended={120} max={160} />
        </Field>
      </div>
      {fuelPrices.map((fuel, i) => (
        <DynamicItem
          key={i}
          title={fuel.fuel === 'gas-natural' ? 'Gas natural (base del comparativo)' : `Combustible ${i + 1}`}
          onRemove={() => removeFuel(i)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required hint="Identificador, ej. gas-natural" error={fieldError(errors, `content.fuel_prices.${i}.fuel`)}>
              <input
                type="text"
                value={fuel.fuel ?? ''}
                onChange={(e) => updateFuel(i, 'fuel', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Nombre visible" required error={fieldError(errors, `content.fuel_prices.${i}.label`)}>
              <input
                type="text"
                value={fuel.label ?? ''}
                onChange={(e) => updateFuel(i, 'label', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Precio por unidad" required error={fieldError(errors, `content.fuel_prices.${i}.price_per_unit`)}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuel.price_per_unit ?? ''}
                onChange={(e) => updateFuel(i, 'price_per_unit', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Unidad" required error={fieldError(errors, `content.fuel_prices.${i}.unit`)}>
              <input
                type="text"
                placeholder="litro, m³…"
                value={fuel.unit ?? ''}
                onChange={(e) => updateFuel(i, 'unit', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Factor de equivalencia"
              required
              hint={fuel.fuel === 'gas-natural' ? 'Siempre 1 para gas natural' : 'm³ de gas natural equivalentes a 1 unidad'}
              error={fieldError(errors, `content.fuel_prices.${i}.equivalence_factor`)}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuel.equivalence_factor ?? ''}
                onChange={(e) => updateFuel(i, 'equivalence_factor', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addFuel}>+ Agregar combustible</AddButton>
    </div>
  )
}

function ContactInfoEditor({ content, onChange, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Dirección" required error={fieldError(errors, 'content.address')}>
        <input
          type="text"
          value={content.address ?? ''}
          onChange={(e) => onChange({ ...content, address: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Teléfono" required error={fieldError(errors, 'content.phone')}>
        <input
          type="tel"
          value={content.phone ?? ''}
          onChange={(e) => onChange({ ...content, phone: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Correo" required error={fieldError(errors, 'content.email')}>
        <input
          type="email"
          value={content.email ?? ''}
          onChange={(e) => onChange({ ...content, email: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Horario" error={fieldError(errors, 'content.schedule')}>
        <input
          type="text"
          value={content.schedule ?? ''}
          onChange={(e) => onChange({ ...content, schedule: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Información adicional" error={fieldError(errors, 'content.additional_info')}>
          <textarea
            rows={2}
            value={content.additional_info ?? ''}
            onChange={(e) => onChange({ ...content, additional_info: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.additional_info} recommended={150} max={280} />
        </Field>
      </div>
    </div>
  )
}

function SocialIconsEditor({ content, onChange, errors }) {
  const networks = content.networks ?? []

  function updateNetwork(i, key, value) {
    onChange({ ...content, networks: updateArrayItem(networks, i, key, value) })
  }

  function addNetwork() {
    onChange({ ...content, networks: [...networks, { network: NETWORK_OPTIONS[0], url: '' }] })
  }

  function removeNetwork(i) {
    onChange({ ...content, networks: networks.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {networks.map((item, i) => (
        <DynamicItem key={i} title={`Red ${i + 1}`} onRemove={() => removeNetwork(i)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Red social" error={fieldError(errors, `content.networks.${i}.network`)}>
              <select
                value={item.network ?? NETWORK_OPTIONS[0]}
                onChange={(e) => updateNetwork(i, 'network', e.target.value)}
                className={inputClass}
              >
                {NETWORK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enlace" required error={fieldError(errors, `content.networks.${i}.url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={item.url ?? ''}
                onChange={(e) => updateNetwork(i, 'url', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addNetwork}>+ Agregar red social</AddButton>
    </div>
  )
}

function WhatsappButtonEditor({ content, onChange, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Teléfono" required hint="Con código de país, ej. 528100000000" error={fieldError(errors, 'content.phone')}>
        <input
          type="tel"
          value={content.phone ?? ''}
          onChange={(e) => onChange({ ...content, phone: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field
        label="Mensaje prellenado"
        hint="Aparece ya escrito en WhatsApp al abrir el chat, ej. 'Hola, quiero información sobre gas natural'"
        error={fieldError(errors, 'content.prefilled_message')}
      >
        <input
          type="text"
          value={content.prefilled_message ?? ''}
          onChange={(e) => onChange({ ...content, prefilled_message: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  )
}

function ImageGalleryEditor({ content, onChange, errors }) {
  const images = content.images ?? []

  function updateImage(i, key, value) {
    onChange({ ...content, images: updateArrayItem(images, i, key, value) })
  }

  function addImage() {
    onChange({ ...content, images: [...images, { image: '', caption: null, alt: null }] })
  }

  function removeImage(i) {
    onChange({ ...content, images: images.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {images.map((img, i) => (
        <DynamicItem key={i} title={`Imagen ${i + 1}`} onRemove={() => removeImage(i)}>
          <ImageField
            label="Imagen"
            hint="1200×800 px aprox. · JPG · máx. 5 MB, ideal menos de 800 KB."
            value={img.image}
            onChange={(value) => updateImage(i, 'image', value)}
            removable={false}
            error={fieldError(errors, `content.images.${i}.image`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Descripción (caption)" error={fieldError(errors, `content.images.${i}.caption`)}>
              <input
                type="text"
                value={img.caption ?? ''}
                onChange={(e) => updateImage(i, 'caption', e.target.value || null)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Texto alternativo (alt)"
              hint="Para accesibilidad y SEO"
              error={fieldError(errors, `content.images.${i}.alt`)}
            >
              <input
                type="text"
                value={img.alt ?? ''}
                onChange={(e) => updateImage(i, 'alt', e.target.value || null)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addImage}>+ Agregar imagen</AddButton>
    </div>
  )
}

function TestimonialsEditor({ content, onChange, errors }) {
  const items = content.items ?? []

  function updateItem(i, key, value) {
    onChange({ ...content, items: updateArrayItem(items, i, key, value) })
  }

  function addItem() {
    onChange({ ...content, items: [...items, { quote: '', author: '', role: null, photo: null }] })
  }

  function removeItem(i) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {items.map((item, i) => (
        <DynamicItem key={i} title={`Testimonio ${i + 1}`} onRemove={() => removeItem(i)}>
          <ImageField
            label="Foto"
            hint="400×400 px (cuadrado 1:1) · JPG · máx. 5 MB, ideal menos de 200 KB."
            value={item.photo}
            onChange={(value) => updateItem(i, 'photo', value)}
            error={fieldError(errors, `content.items.${i}.photo`)}
          />
          <Field label="Cita" required error={fieldError(errors, `content.items.${i}.quote`)}>
            <textarea
              rows={3}
              value={item.quote ?? ''}
              onChange={(e) => updateItem(i, 'quote', e.target.value)}
              className={inputClass}
            />
            <CharHint value={item.quote} recommended={140} max={220} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Autor" required error={fieldError(errors, `content.items.${i}.author`)}>
              <input
                type="text"
                value={item.author ?? ''}
                onChange={(e) => updateItem(i, 'author', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Cargo / rol" error={fieldError(errors, `content.items.${i}.role`)}>
              <input
                type="text"
                value={item.role ?? ''}
                onChange={(e) => updateItem(i, 'role', e.target.value || null)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addItem}>+ Agregar testimonio</AddButton>
    </div>
  )
}

const SECTION_EDITORS = {
  page_hero: PageHeroEditor,
  feature_grid: FeatureGridEditor,
  rich_text: RichTextEditor,
  clients_showcase: ClientsShowcaseEditor,
  stations_map: StationsMapEditor,
  lead_capture_form: LeadCaptureFormEditor,
  service_scheduling: ServiceSchedulingEditor,
  banner_carousel: BannerCarouselEditor,
  savings_simulator: SavingsSimulatorEditor,
  contact_info: ContactInfoEditor,
  social_icons: SocialIconsEditor,
  whatsapp_button: WhatsappButtonEditor,
  image_gallery: ImageGalleryEditor,
  testimonials: TestimonialsEditor,
}

function SectionCard({ section, site, onUpdated }) {
  const [content, setContent] = useState(section.content ?? {})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ message: '', error: false })

  const Editor = SECTION_EDITORS[section.type]

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setStatus({ message: '', error: false })

    const res = await updateSection(section.id, content)

    setSaving(false)

    if (res?.status === 'success') {
      setContent(res.data.content)
      setStatus({ message: res.meta?.message ?? 'Sección actualizada correctamente', error: false })
      onUpdated?.(res.data)
    } else if (res?.errors) {
      setErrors(res.errors)
      setStatus({ message: res.message ?? 'Revisa los campos marcados.', error: true })
    } else {
      setStatus({ message: res?.meta?.message ?? 'No se pudo actualizar la sección.', error: true })
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{SECTION_LABELS[section.type] ?? section.type}</h3>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/60">
          Posición {section.position}
        </span>
      </div>

      {Editor ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Editor content={content} onChange={setContent} errors={errors} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {status.message && (
              <span className={`text-sm ${status.error ? 'text-rose-400' : 'text-emerald-300'}`}>{status.message}</span>
            )}
          </div>
        </form>
      ) : (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
          {JSON.stringify(content, null, 2)}
        </pre>
      )}

      {section.type === 'stations_map' && <StationsEditor site={site} siteId={section.site_id} />}
    </div>
  )
}

// The loaders below all answer `null` on failure, so a caller can tell "the
// request failed" apart from "there are no sections here".

/** Numeric id of a page, by slug, or null when it can't be resolved. */
async function resolvePageId(site, pageSlug) {
  const res = await fetchData(`/api/admin/pages?site=${site}`)
  if (res?.status !== 'success') return null

  return res.data.find((p) => p.slug === pageSlug)?.id ?? null
}

async function loadPageSections(site, pageSlug) {
  const [pageId, res] = await Promise.all([
    resolvePageId(site, pageSlug),
    fetchData(`/api/admin/sections?site=${site}&page=${pageSlug}`),
  ])

  if (res?.status !== 'success') return null

  // Without an id there is nothing to narrow by, so the server's answer stands.
  return pageId == null ? res.data : res.data.filter((s) => s.page_id === pageId)
}

async function loadSiteSections(site) {
  const res = await fetchData(`/api/admin/sections?site=${site}`)
  return res?.status === 'success' ? res.data : null
}

async function loadGlobalSections(site) {
  const res = await fetchData(`/api/admin/sections?site=${site}&global=1`)
  return res?.status === 'success' ? res.data.filter((s) => s.page_id == null) : null
}

// Headless: the section cards, without page chrome (header/back link). Lets a
// host page (e.g. the Contacto admin page) embed section editing inline
// alongside its own content instead of duplicating a "Back" link and title.
//
// `GET /api/admin/sections?site&page=` has been observed returning every
// section of the site instead of just the page's (noted for traninn-logistic:
// identical payload for page=inicio and page=ubicaciones), so the page's own
// sections are narrowed client-side by `page_id`. That id is resolved from
// `GET /api/admin/pages?site=` rather than hard-coded: it is a database row id
// and any reseed moves it.
//
// `includeGlobals` surfaces the site-wide sections — contact_info,
// social_icons, whatsapp_button — which have `page_id: null`. They are asked
// for explicitly with `?global=1` rather than hoping they ride along with the
// page query: `whereHas('page', …)` excludes a null page_id, so when the
// `page` filter *does* work they would never appear. Pass the flag only from
// the one page meant to surface them (each site's landing page).
export function SectionsFields({ site = 'gnu', page, includeGlobals = false, onTotalChange }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSections() {
      setLoading(true)
      setError('')

      const [pageSections, globalSections] = await Promise.all([
        page ? loadPageSections(site, page) : loadSiteSections(site),
        includeGlobals ? loadGlobalSections(site) : Promise.resolve([]),
      ])

      if (cancelled) return

      if (pageSections === null || globalSections === null) {
        setError('No se pudieron cargar las secciones.')
        setLoading(false)
        return
      }

      // The two requests can overlap when the server ignores the `page`
      // filter and hands back the globals as well, so dedupe by id.
      const byId = new Map([...pageSections, ...globalSections].map((s) => [s.id, s]))
      const data = [...byId.values()]

      setSections(data)
      onTotalChange?.(data.length)
      setLoading(false)
    }

    loadSections()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, page, includeGlobals])

  function handleUpdated(updatedSection) {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  if (loading) return <p className="text-sm text-white/60">Cargando secciones…</p>
  if (error) return <p className="text-sm text-rose-400">{error}</p>

  return (
    <div className="space-y-4">
      {sections.length === 0 && <p className="text-sm text-white/50">No hay secciones para esta página.</p>}
      {sections.map((section) => (
        <SectionCard key={section.id} section={section} site={site} onUpdated={handleUpdated} />
      ))}
    </div>
  )
}

// Just the site-wide sections (contact_info, social_icons, whatsapp_button).
// Exported for the two landing pages that predate this component and keep
// their own section list — they embed this below it instead of growing a
// second copy of the three editors.
export function GlobalSectionsFields({ site = 'gnu' }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      const data = await loadGlobalSections(site)
      if (cancelled) return

      if (data === null) setError('No se pudo cargar el contenido del sitio.')
      else setSections(data)

      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [site])

  function handleUpdated(updatedSection) {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  if (loading) return <p className="text-sm text-white/60">Cargando contenido del sitio…</p>
  if (error) return <p className="text-sm text-rose-400">{error}</p>
  if (sections.length === 0) return null

  return (
    <section className="mt-10 space-y-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Contenido del sitio</h2>
        <p className="mt-1 text-sm text-white/60">
          Datos de contacto, redes sociales, botón de WhatsApp y testimonios. Aplican a todo el sitio, no a una página.
        </p>
      </header>
      {sections.map((section) => (
        <SectionCard key={section.id} section={section} site={site} onUpdated={handleUpdated} />
      ))}
    </section>
  )
}

export default function PageSectionsEditor({ site = 'gnu', page, includeGlobals, title, backTo }) {
  const [total, setTotal] = useState(0)

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to={backTo} className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-white/60">
            Secciones editables
            {total > 0 && <span className="text-white/40"> · {total} secciones</span>}
          </p>
        </header>

        <SectionsFields site={site} page={page} includeGlobals={includeGlobals} onTotalChange={setTotal} />
      </div>
    </main>
  )
}
