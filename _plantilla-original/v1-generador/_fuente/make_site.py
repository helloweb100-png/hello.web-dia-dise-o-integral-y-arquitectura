#!/usr/bin/env python3
"""DIIA · fuente del sitio.

Genera ../site.json (contenido + secciones propias) a partir de este archivo y de custom.css.
Luego se compila a index.html + styles.css + app.js con el generador de la skill:

    python _fuente/make_site.py
    python <skill>/scripts/build.py site.json --out .        # genera index.html, styles.css, script.js
    (ver _fuente/build.py para el paso completo, que además renombra script.js -> app.js)

Todo el contenido sale del portafolio DIIA_PORTAFOLIO_2026.pdf. No hay cifras ni testimonios inventados.
"""
import html
import json
import random
from pathlib import Path
from urllib.parse import quote

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
e = html.escape


# ───────────────────────── skyline animado (eco del emblema del logo) ─────────────────────────
def skyline_svg(seed, w=1200, h=320, step=11, hmin=40, hmax=300, stroke=1.2):
    rnd = random.Random(seed)
    xs = []
    x = 6
    # torres agrupadas: alturas con picos, como las barras del logotipo
    base = 0.0
    while x < w:
        base = max(0.0, min(1.0, base + rnd.uniform(-0.28, 0.3)))
        pk = base ** 1.6
        hh = hmin + (hmax - hmin) * (0.12 + 0.88 * pk) * rnd.uniform(0.75, 1.0)
        xs.append((x, hh))
        x += step if rnd.random() > 0.18 else step * rnd.choice([2, 3])
    lines = "".join(f'<path d="M{x:.1f} {h} V{h - hh:.1f}"/>' for x, hh in xs)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
           f'<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="{h}" x2="0" y2="0">'
           f'<stop offset="0" stop-color="#cfb565" stop-opacity="1"/><stop offset="1" stop-color="#cfb565" stop-opacity="0"/></linearGradient></defs>'
           f'<g fill="none" stroke="url(#g)" stroke-width="{stroke}" stroke-linecap="butt">{lines}</g>'
           f'<path d="M0 {h - 0.5} H{w}" stroke="#cfb565" stroke-opacity=".35" stroke-width="1"/></svg>')
    return "url(\"data:image/svg+xml," + quote(svg, safe="/:=,;()' ") + "\")"


custom_css = (HERE / "custom.css").read_text(encoding="utf-8")
custom_css = (custom_css
              .replace("/*SKY_A*/", skyline_svg(7, hmin=50, hmax=320))
              .replace("/*SKY_B*/", skyline_svg(23, w=900, h=240, step=9, hmin=30, hmax=220, stroke=1))
              .replace("/*SKY_C*/", skyline_svg(41, w=1000, h=200, step=10, hmin=24, hmax=180, stroke=1)))

ARROW = '<svg class="ico ico--arrow" aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg>'


# ───────────────────────── tarjetas de proyecto (sección propia) ─────────────────────────
def proj(cls, no, where, tag, name, loc, text, img, alt, pos="50% 50%", par="0.05"):
    return f'''
<article class="proj {cls}" data-reveal="zoom">
  <div class="proj__media" data-parallax="{par}"><img src="img/{img}" alt="{e(alt)}" loading="lazy" decoding="async" style="object-position:{pos}"></div>
  <span class="proj__no" aria-hidden="true">{no}</span>
  <span class="proj__where">{e(where)}</span>
  <div class="proj__body">
    <p class="proj__tag">{e(tag)}</p>
    <h3 class="proj__name">{e(name)}</h3>
    <p class="proj__loc">{e(loc)}</p>
    <p class="proj__txt">{e(text)}</p>
  </div>
</article>'''


def cta_btn(label, service, kind="primary"):
    return (f'<a class="btn btn--{kind} btn--lg" href="#contacto" data-service="{e(service)}" data-cta data-magnetic>'
            f'{e(label)}{ARROW}</a>')


proyectos_html = f'''
<section class="sec sec--proy" id="proyectos" aria-labelledby="proyectos-title">
  <div class="container">
    <header class="sec-head" data-reveal>
      <p class="eyebrow">Proyectos arquitectónicos</p>
      <h2 id="proyectos-title">Espacios que ya son <em class="grad">realidad</em></h2>
      <p class="lead">Restaurantes, oficinas, estéticas y departamentos: cada proyecto nace de una idea clara y termina en un lugar que se vive.</p>
    </header>
    <div class="proj-grid" data-stagger>
{proj("proj--a", "01", "CDMX", "Diseño de restaurante", "Lee Hou", "Restaurante Tong Fong · Barrio Chino, CDMX",
      "Tres niveles con un solo hilo conductor: el dragón chino, símbolo de poder, buena fortuna y protección, presente desde la fachada hasta los rincones más íntimos.",
      "lee-hou-fachada.jpg", "Fachada del restaurante Tong Fong en el Barrio Chino de la Ciudad de México, con vegetación y detalles rojos", "0% 50%", "0.04")}
{proj("proj--b", "02", "Polanco · CDMX", "Remodelación de estética", "Figuero", "Estética especializada · Polanco, CDMX",
      "Un espacio pensado para la comodidad del cliente y el mejor aprovechamiento de cada metro: madera, acero negro y luz cálida.",
      "figuero-estetica.jpg", "Interior de una estética en Polanco con estaciones de madera, estructura de acero negro y piso claro", "40% 50%")}
{proj("proj--c", "03", "Reforma · CDMX", "Diseño de oficinas", "Catrans", "Oficinas · Be Grand Reforma, CDMX",
      "Elegancia y practicidad en un entorno de trabajo que refleja la identidad de la empresa y cuida el bienestar de su equipo.",
      "catrans-recepcion.jpg", "Recepción de las oficinas Catrans con letrero negro, barra iluminada y planta decorativa", "50% 40%")}
{proj("proj--d", "04", "Edo. Méx.", "Diseño de oficinas", "Pascua", "Oficinas · Estado de México",
      "Oficinas ergonómicas y flexibles, con cocinas, mobiliario, recepción, baños y áreas de trabajo diseñados a la medida del equipo.",
      "pascua-oficinas.jpg", "Área de trabajo abierta con escritorios en verde salvia y madera clara en las oficinas Pascua", "50% 55%")}
{proj("proj--e", "05", "Polanco · CDMX", "Diseño de interiores · Departamentos", "Neuchatel", "Departamento · Torre Neuchatel, Polanco",
      "Interiorismo que redefine el espacio y eleva la experiencia de vivir: un ambiente que inspira, relaja y revitaliza.",
      "neuchatel-sala.jpg", "Sala y comedor de un departamento en Torre Neuchatel con mármol, madera y luz natural", "50% 60%")}
    </div>
    <div class="sec-cta" data-reveal>
      <p>¿Tu espacio sigue siendo una idea? Platícanosla.</p>
      {cta_btn("Quiero un proyecto como estos", "Diseño integral de ingeniería y arquitectura")}
    </div>
  </div>
</section>'''

DISC = ["Hidrosanitaria", "PCI · protección contra incendio", "HVAC · climatización", "Eléctrica", "Instalaciones especiales"]
disc_html = "".join(f"<li><b>{i + 1:02d}</b><span>{e(d)}</span></li>" for i, d in enumerate(DISC))

ingenieria_html = f'''
<section class="sec sec--ing" id="ingenieria" data-tone="dark" aria-labelledby="ingenieria-title">
  <div class="container">
    <div class="ing-top">
      <div class="ing-copy" data-reveal="left">
        <p class="eyebrow">Ingeniería en instalaciones</p>
        <h2 id="ingenieria-title">Lo que no se ve es lo que <em class="grad">hace que todo funcione</em></h2>
        <p class="lead">Desarrollamos el proyecto ejecutivo con todas las ingenierías coordinadas entre sí y con la normatividad vigente, desde torres residenciales hasta resorts en el desierto.</p>
        <ul class="disc">{disc_html}</ul>
      </div>
      <figure class="blueprint" data-reveal="right">
        <img src="img/plano-instalaciones.jpg" alt="Plano isométrico de instalaciones hidrosanitarias, eléctricas y especiales de un conjunto residencial circular" loading="lazy" decoding="async">
        <figcaption>Isométrico de instalaciones · Azulik Residences, Tulum</figcaption>
      </figure>
    </div>
    <div class="proj-grid proj-grid--ing" data-stagger>
{proj("proj--w", "01", "Arabia Saudita", "Diseño de ingenierías en resort", "Azulik NEOM Yuba Resort", "Resort residencial con amenidades · Arabia Saudita",
      "Ingenierías hidrosanitaria, PCI, especiales, HVAC y eléctrica para una arquitectura de formas angulares que dialoga con el desierto y el mar.",
      "azulik-neom-yuba.jpg", "Resort Azulik NEOM Yuba de arquitectura angular color arena junto a una alberca turquesa sobre un acantilado", "50% 55%", "0.04")}
{proj("proj--x", "02", "Arabia Saudita", "Diseño de ingenierías en resort", "Azulik AlUla", "Resort residencial · Arabia Saudita",
      "79 villas, spa y amenidades que se funden con el paisaje del desierto. Proyecto ejecutivo con ingenierías hidrosanitaria, PCI, especiales, HVAC y eléctrica.",
      "azulik-alula.jpg", "Villas orgánicas de barro del resort Azulik AlUla entre montañas rojizas del desierto de Arabia", "50% 60%")}
{proj("proj--y", "03", "Tulum · México", "Diseño de ingenierías en departamentos", "Azulik Residences", "Departamentos residenciales · Tulum",
      "Conjunto de torres con estética moderna y abundante luz natural. Proyecto ejecutivo con las ingenierías coordinadas según la distribución de cada área.",
      "azulik-residences-tulum.jpg", "Torres residenciales Azulik Residences en Tulum con formas orgánicas, vegetación y cascadas", "50% 45%")}
    </div>
    <div class="sec-cta" data-reveal>
      <p>¿Tu obra necesita ingenierías que sí se coordinen?</p>
      {cta_btn("Necesito ingeniería para mi obra", "Ingeniería en instalaciones")}
    </div>
  </div>
</section>'''


# ───────────────────────── site.json ─────────────────────────
site = {
    "lang": "es-MX",
    "brand": {
        "name": "DIIA",
        "logo": "img/logo-diia.png",
        "show_name": False,
        "colors": {"primary": "#cfb565", "secondary": "#a88a3d", "accent": "#ecdba2"},
        "theme": "mixed",
        "font": {"display": "Jost", "body": "Inter"},
        "radius": "sharp",
    },
    "seo": {
        "title": "DIIA | Arquitectura e ingeniería integral en México",
        "description": "Diseño integral de ingeniería y arquitectura: proyectos residenciales, oficinas, espacios comerciales e ingeniería en instalaciones. Cuéntanos tu idea.",
        "keywords": ["arquitectura", "ingeniería", "diseño integral", "proyectos residenciales", "diseño de oficinas", "interiorismo",
                     "ingeniería en instalaciones", "gestión de proyectos de construcción", "CDMX"],
        "business_type": "ProfessionalService",
        "area": "México",
        "og_image": "img/hero-arquitectura.jpg",
    },
    "contact": {
        "whatsapp": "5525069867",
        "message": "Hola DIIA, vi su página web y me gustaría platicarles mi proyecto.",
        "phone": "+52 55 2506 9867",
        "email": "contactodiia@gmail.com",
        "whatsapp_display": "Escríbenos por WhatsApp",
        "float_label": "¿Platicamos tu proyecto?",
    },
    "header_cta": {"label": "Quiero mi proyecto", "href": "#contacto"},
    "loader": {"text": "Ingeniería y arquitectura", "duration": 2600},
    "hero": {
        "fx": "beams",
        "layout": "split",
        "eyebrow": "Arquitectura · Ingeniería · Desde 2022",
        "title": "Arquitectura que inspira. *Ingeniería que se sostiene.*",
        "subtitle": "Un solo equipo para proyectar, diseñar y controlar tu obra: de oficinas en CDMX a resorts en Arabia Saudita.",
        "cta": {"label": "Estoy listo para empezar", "href": "#contacto"},
        "cta2": {"label": "Ver proyectos reales", "href": "#proyectos"},
        "badges": ["Proyecto ejecutivo e ingenierías", "Interiorismo y remodelación", "Gestión de obra"],
        "chips": ["Arquitectura + ingeniería", {"text": "Haciendo proyectos realidad desde 2022", "icon": "award"}, {"text": "México · Arabia Saudita", "icon": "globe"}],
        "image": {"src": "img/hero-arquitectura.jpg", "alt": "Estructura arquitectónica de líneas diagonales en blanco y negro con cielo oscuro", "w": 1200, "h": 1807},
    },
    "sections": [
        {"type": "marquee", "title": "Especialidades de DIIA", "items": [
            "Proyectos residenciales", "Oficinas", "Espacios comerciales", "Urbanismo", "Interiorismo",
            "Ingeniería hidrosanitaria", "Protección contra incendio", "HVAC", "Instalaciones eléctricas", "Gestión de proyectos"]},
        {"type": "services", "nav": "Servicios", "eyebrow": "Lo que hacemos",
         "title": "Todo lo que tu proyecto necesita, *bajo un mismo techo*",
         "lead": "Desde el primer trazo hasta la entrega: arquitectura, interiorismo e ingeniería trabajando en sincronía.",
         "link": "Lo quiero en mi proyecto",
         "items": [
             {"icon": "building", "title": "Diseño integral de ingeniería y arquitectura", "wide": True,
              "text": "El arquitecto y el ingeniero trabajan juntos desde el primer plano, para evitar sobrecostos y entregar a tiempo.",
              "list": ["Proyecto arquitectónico y ejecutivo", "Coordinación entre todas las disciplinas"]},
             {"icon": "layers", "title": "Interiorismo y remodelación",
              "text": "Espacios funcionales y estéticos: oficinas, departamentos y comercios pensados para quien los usa."},
             {"icon": "zap", "title": "Ingeniería en instalaciones",
              "text": "Hidrosanitaria, PCI, HVAC, eléctrica y especiales, conforme a la normatividad vigente."},
             {"icon": "target", "title": "Gestión de proyectos de construcción",
              "text": "Control de principio a fin para cumplir plazos, cuidar el presupuesto y evitar pérdidas."},
             {"icon": "shield", "title": "Consultoría especializada",
              "text": "Asesoría en manos de expertos, con base en normas, reglamentos y la visión de tu proyecto."},
         ]},
        {"type": "about", "nav": "Nosotros", "tone": "dark", "eyebrow": "Sobre nosotros",
         "title": "Profesionales que *hacen realidad* cada proyecto",
         "text": [
             "Somos un equipo de profesionales altamente capacitados en diseño y ejecución de proyectos. A lo largo de nuestra trayectoria hemos desarrollado proyectos innovadores y sostenibles que han superado nuestras expectativas.",
             "Mostramos nuestro trabajo con un objetivo: que veas la calidad, la eficiencia y el compromiso con los que atendemos a cada cliente y a cada necesidad.",
         ],
         "points": ["Diseñar espacios funcionales y estéticos", "Optimizar recursos y reducir costos",
                    "Cumplir con los plazos y presupuestos establecidos", "Brindar soluciones sostenibles y respetuosas con el medio ambiente"],
         "image": {"src": "img/instalaciones-tuberias.jpg", "alt": "Instalaciones hidrosanitarias, HVAC y eléctricas coordinadas en el plafón de un edificio", "w": 1183, "h": 1330},
         "badge": {"value": "2022", "label": "Haciendo proyectos realidad desde"},
         "cta": {"label": "Quiero platicar con el equipo", "href": "wa"}},
        {"type": "stats", "items": [
            {"value": 8, "label": "Proyectos destacados en nuestro portafolio"},
            {"value": 2, "label": "Países: México y Arabia Saudita"},
            {"value": 79, "label": "Villas con ingeniería en Azulik AlUla"},
            {"value": 5, "label": "Ingenierías coordinadas en un solo proyecto"},
        ]},
        {"type": "html", "id": "proyectos", "nav": "Proyectos", "html": proyectos_html},
        {"type": "html", "id": "ingenieria", "nav": "Ingeniería", "html": ingenieria_html},
        {"type": "process", "nav": "Proceso", "id": "proceso", "alt": True, "eyebrow": "Cómo trabajamos",
         "title": "De tu idea a la obra, *en 4 pasos*",
         "steps": [
             {"title": "Platicamos tu proyecto", "text": "Nos cuentas qué necesitas, para quién es y con qué presupuesto cuentas."},
             {"title": "Diseñamos la propuesta", "text": "Concepto, distribución e imagen del espacio, pensados para su uso real."},
             {"title": "Desarrollamos el proyecto ejecutivo", "text": "Planos e ingenierías coordinados y alineados con la normatividad vigente."},
             {"title": "Te acompañamos en la obra", "text": "Control del proyecto para cumplir plazos y cuidar tu presupuesto."},
         ]},
        {"type": "faq", "nav": "", "eyebrow": "Dudas frecuentes", "title": "Resolvemos lo que *te estás preguntando*",
         "items": [
             {"q": "¿Qué tipo de proyectos desarrollan?",
              "a": "Proyectos residenciales, oficinas, espacios comerciales y urbanismo, además de interiorismo, remodelación e ingeniería en instalaciones."},
             {"q": "¿Diseñan y también hacen las ingenierías?",
              "a": "Sí. Desarrollamos el proyecto ejecutivo con las ingenierías hidrosanitaria, PCI, HVAC, eléctrica y especiales, coordinadas con el diseño y con la normatividad vigente."},
             {"q": "¿Pueden ayudarme a cuidar tiempos y presupuesto?",
              "a": "Sí. Llevamos la gestión del proyecto de construcción para que las entregas sean a tiempo, el presupuesto se cuide y se eviten pérdidas."},
             {"q": "¿Trabajan fuera de la Ciudad de México?",
              "a": "Sí. Nuestro portafolio incluye proyectos en la Ciudad de México, el Estado de México, Tulum y Arabia Saudita."},
             {"q": "¿Cómo empiezo?",
              "a": "Escríbenos por WhatsApp o llena el formulario con una idea general de lo que imaginas. Nosotros te contactamos para platicar tu proyecto."},
         ]},
        {"type": "cta", "title": "¿Tienes un terreno, un espacio o *una idea?*",
         "lead": "Cuéntanos qué imaginas. Nosotros nos encargamos de diseñarlo, proyectarlo y darle seguimiento hasta que sea realidad.",
         "cta": {"label": "Sí, quiero hacer realidad mi proyecto", "href": "wa"},
         "cta2": {"label": "Prefiero escribir mi mensaje", "href": "#contacto"}},
        {"type": "contact", "nav": "Contacto", "alt": True, "eyebrow": "Hablemos",
         "title": "Cuéntanos tu proyecto *y empecemos*",
         "lead": "Déjanos tus datos y abrimos una conversación por WhatsApp con tu mensaje listo.",
         "form": {"title": "Tu proyecto empieza con un mensaje", "button": "Quiero que me contacten",
                  "note": "Se abrirá WhatsApp con tu mensaje listo. Sin compromiso.",
                  "service_label": "¿Qué necesitas?", "message_label": "Cuéntanos de tu proyecto",
                  "placeholder": "Tipo de espacio, ubicación y lo que tienes en mente"}},
    ],
    "footer": {
        "text": "Diseño integral de ingeniería y arquitectura. Proyectos residenciales, oficinas, espacios comerciales y urbanismo.",
        "social": [{"name": "instagram", "href": "https://www.instagram.com/diia_mex"}],
        "legal": "Haciendo proyectos realidad desde 2022",
    },
    "smooth_scroll": True,
    "custom_css": custom_css,
}

(ROOT / "site.json").write_text(json.dumps(site, ensure_ascii=False, indent=2), encoding="utf-8")
print("site.json OK", (ROOT / "site.json").stat().st_size // 1024, "KB")
