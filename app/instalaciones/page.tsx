import Image from "next/image";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import styles from "./instalaciones.module.css";

const espacios = [
  {
    icono: "⌂",
    titulo: "Jardín delimitado",
    descripcion: "Un espacio para moverse, explorar y disfrutar bajo supervisión.",
  },
  {
    icono: "♡",
    titulo: "Socialización previa",
    descripcion: "Conocemos cómo se relaciona cada huésped antes de recibirlo.",
  },
  {
    icono: "☾",
    titulo: "Descanso sin jaulas",
    descripcion: "Dos cuartos compartidos para dormir acompañados.",
  },
];

const fotos = [
  {
    src: "/images/instalaciones/patio-principal.webp",
    alt: "Vista amplia del jardín delimitado de PetFunCR con césped artificial",
    titulo: "Nuestro jardín",
    tipo: "espacio",
  },
  {
    src: "/images/instalaciones/juego-pelota.webp",
    alt: "Dos perritos disfrutan juntos de un juego con pelota en PetFunCR",
    titulo: "Tiempo para jugar",
    tipo: "juego",
  },
  {
    src: "/images/instalaciones/saludo-amistoso.webp",
    alt: "Dos perritos se acercan para saludarse amistosamente en el jardín",
    titulo: "Nuevos amigos",
    tipo: "convivencia",
  },
  {
    src: "/images/instalaciones/convivencia-grupo.webp",
    alt: "Varios huéspedes comparten el jardín de PetFunCR",
    titulo: "Momentos compartidos",
    tipo: "convivencia",
  },
  {
    src: "/images/instalaciones/descanso-camita.webp",
    alt: "Un perrito descansa en una cama cómoda",
    titulo: "Una pausa para descansar",
    tipo: "descanso",
  },
  {
    src: "/images/instalaciones/patio-alterno.webp",
    alt: "Otra vista del patio delimitado de PetFunCR",
    titulo: "Más espacio para compartir",
    tipo: "descanso",
  },
];

export default function InstalacionesPage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero} aria-labelledby="instalaciones-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>CONOCÉ NUESTROS ESPACIOS</p>
            <span className={styles.anniversary}>
              <span aria-hidden="true">✦</span> PetFunCR · Desde 2021
            </span>
            <h1 id="instalaciones-title">
              Un espacio pensado para <span>disfrutar y descansar.</span>
            </h1>
            <p className={styles.heroDescription}>
              En PetFunCR nuestros huéspedes tienen un jardín para jugar y compartir,
              además de espacios de descanso donde pueden dormir acompañados y sentirse
              como en casa.
            </p>
            <div className={styles.heroActions}>
            {/* 
              <Link href="/reservar" className={styles.primaryButton}>
                Reservar ahora <span aria-hidden="true">→</span>
              </Link>*/}
              <a href="#convivencia" className={styles.secondaryLink}>
                Conocé cómo conviven <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className={styles.heroNote}>
              <span aria-hidden="true">♡</span> Un jardín para jugar y un lugar para descansar.
            </p>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.photoHalo} aria-hidden="true" />
            <div className={styles.heroPhotoFrame}>
              <Image
                src="/images/instalaciones/perritos-en-jardin.webp"
                alt="Tres huéspedes posan en el jardín delimitado de PetFunCR"
                fill
                priority
                sizes="(max-width: 760px) 90vw, 45vw"
                className={styles.heroPhoto}
              />
            </div>
            <div className={styles.photoBadge}>
              <span className={styles.photoBadgeIcon} aria-hidden="true">🐾</span>
              <span>
                <strong>Un segundo hogar</strong>
                <small>Juego, compañía y descanso</small>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.featureStrip} aria-label="Lo que caracteriza nuestras instalaciones">
          {espacios.map((espacio) => (
            <article className={styles.feature} key={espacio.titulo}>
              <span className={styles.featureIcon} aria-hidden="true">{espacio.icono}</span>
              <div>
                <h2>{espacio.titulo}</h2>
                <p>{espacio.descripcion}</p>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.gardenSection} id="jardin" aria-labelledby="garden-title">
          <div className={styles.gardenCopy}>
            <p className={styles.sectionEyebrow}>AIRE LIBRE Y DIVERSIÓN</p>
            <h2 id="garden-title">Un jardín para jugar, explorar y compartir</h2>
            <p>
              Nuestro jardín cuenta con césped artificial y cerramientos perimetrales
              que delimitan el espacio destinado a las actividades de los huéspedes.
              Aquí pueden moverse, disfrutar de sus juguetes y compartir momentos con
              otros perritos bajo nuestra supervisión.
            </p>
            <div className={styles.gardenPoints}>
              <span><b aria-hidden="true">✓</b> Área delimitada</span>
              <span><b aria-hidden="true">✓</b> Tiempo para jugar</span>
              <span><b aria-hidden="true">✓</b> Convivencia supervisada</span>
            </div>
          </div>
          <figure className={styles.gardenFigure}>
            <div className={styles.gardenImageWrap}>
              <Image
                src="/images/instalaciones/patio-principal.webp"
                alt="Vista del jardín con césped artificial y cerramientos de PetFunCR"
                fill
                sizes="(max-width: 760px) 92vw, 48vw"
                className={styles.gardenImage}
              />
              <span className={styles.imageLabel}>Nuestro espacio al aire libre</span>
            </div>
            <figcaption>
              Un entorno propio para compartir actividades y disfrutar de la compañía.
            </figcaption>
          </figure>
        </section>

        <section className={styles.socialSection} id="convivencia" aria-labelledby="social-title">
          <div className={styles.socialImageWrap}>
            <Image
              src="/images/instalaciones/saludo-amistoso.webp"
              alt="Dos huéspedes se saludan de cerca en el jardín de PetFunCR"
              fill
              sizes="(max-width: 760px) 92vw, 44vw"
              className={styles.socialImage}
            />
            <span className={styles.imageLabel}>La convivencia empieza antes</span>
          </div>
          <div className={styles.socialCopy}>
            <p className={styles.sectionEyebrow}>SOCIALIZACIÓN Y COMPATIBILIDAD</p>
            <h2 id="social-title">Primero nos conocemos; después compartimos</h2>
            <p>
              Antes de aceptar a un nuevo huésped, realizamos pruebas de socialización
              para valorar cómo se relaciona con otros perritos. Recibimos huéspedes
              que muestran una convivencia amigable y usamos esa valoración para
              organizar los grupos según su compatibilidad.
            </p>
            <div className={styles.processList}>
              <article>
                <span>01</span>
                <div>
                  <h3>Pruebas de socialización</h3>
                  <p>Conocemos su manera de interactuar antes de hospedarse.</p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Grupos compatibles</h3>
                  <p>Tomamos en cuenta su compatibilidad para la convivencia.</p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Acompañamiento</h3>
                  <p>Supervisamos las actividades y los momentos compartidos.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.restSection} id="descanso" aria-labelledby="rest-title">
          <div className={styles.restCopy}>
            <p className={styles.sectionEyebrow}>HORA DE BAJAR EL RITMO</p>
            <h2 id="rest-title">Descanso acompañado, sin jaulas</h2>
            <p>
              Contamos con dos cuartos compartidos para que nuestros huéspedes puedan
              dormir acompañados y acomodarse en sus camitas. No utilizamos jaulas para
              su descanso: organizamos a los perritos según la compatibilidad que hemos
              valorado durante las pruebas de socialización.
            </p>
            <div className={styles.restCallout}>
              <span className={styles.restCalloutIcon} aria-hidden="true">☾</span>
              <p>
                <strong>Dos cuartos para compartir.</strong>
                <span>Un espacio de descanso elegido pensando en la convivencia de cada huésped.</span>
              </p>
            </div>
          </div>
          <div className={styles.restVisual}>
            <div className={styles.restMainPhoto}>
              <Image
                src="/images/instalaciones/descanso-interior.webp"
                alt="Un huésped de PetFunCR descansa sobre una manta cómoda en el interior"
                fill
                sizes="(max-width: 760px) 88vw, 39vw"
                className={styles.restMainImage}
              />
            </div>
            <div className={styles.restSmallPhoto}>
              <Image
                src="/images/instalaciones/descanso-colchon.webp"
                alt="Un perrito descansa acurrucado sobre una camita"
                fill
                sizes="(max-width: 760px) 44vw, 19vw"
                className={styles.restSmallImage}
              />
            </div>
            <span className={styles.restVisualBadge}>Descanso sin jaulas ♡</span>
          </div>
        </section>

        <section className={styles.gallerySection} id="galeria" aria-labelledby="gallery-title">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>POSTALES DE PETFUNCR</p>
            <h2 id="gallery-title">Cada rincón guarda un momento feliz</h2>
            <p>
              Un vistazo a los espacios y a los chiquitines que los llenan de vida.
              Estas son algunas de las escenas reales de nuestro día a día.
            </p>
          </div>
          <div className={styles.galleryGrid}>
            {fotos.map((foto, index) => (
              <figure
                key={foto.src}
                className={`${styles.galleryCard} ${index === 0 ? styles.galleryCardWide : ""}`}
              >
                <div className={styles.galleryPhotoWrap}>
                  <Image
                    src={foto.src}
                    alt={foto.alt}
                    fill
                    sizes={index === 0
                      ? "(max-width: 760px) 92vw, 55vw"
                      : "(max-width: 760px) 92vw, 28vw"}
                    className={styles.galleryPhoto}
                  />
                  <span className={styles.galleryCaption}>{foto.titulo}</span>
                </div>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingDecor} aria-hidden="true">♡</div>
          <p className={styles.sectionEyebrow}>TE ESPERAMOS EN PETFUNCR</p>
          <h2 id="closing-title">Un lugar para jugar. Un espacio para descansar. Mucho cariño para compartir.</h2>
          <p>
            Si querés que tu peludito conozca PetFunCR, revisá nuestro sistema de
            reservas y consultá la disponibilidad para su próxima estadía.
          </p>
          {/*
          <Link href="/reservar" className={styles.primaryButton}>
            Reservar ahora <span aria-hidden="true">→</span>
          </Link>
          */}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>PetFunCR · Hotel y Guardería Canina</p>
        <p>Un segundo hogar para tu mejor amigo.</p>
      </footer>
    </div>
  );
}
