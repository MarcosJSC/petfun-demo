import Image from "next/image";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import styles from "./nosotros.module.css";

const valores = [
  {
    icono: "♡",
    titulo: "Amor genuino",
    descripcion:
      "Nos encanta compartir con cada uno de nuestros chiquitines y hacer que se sientan queridos.",
  },
  {
    icono: "✓",
    titulo: "Bienestar y cuidado",
    descripcion:
      "Preparamos nuestros espacios para que puedan disfrutar de juegos, compañía y descanso.",
  },
  {
    icono: "✦",
    titulo: "Días felices",
    descripcion:
      "Buscamos que cada visita esté llena de momentos especiales y experiencias positivas.",
  },
];

export default function NosotrosPage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero} aria-labelledby="nosotros-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>NUESTRA HISTORIA</p>
            <span className={styles.anniversary}>
              <span aria-hidden="true">✦</span> Celebrando 5 años · Desde 2021
            </span>
            <h1 id="nosotros-title">
              Nacimos del amor <span>por los perritos.</span>
            </h1>
            <p className={styles.heroDescription}>
              Creamos un segundo hogar donde nuestros chiquitines pueden jugar,
              descansar y recibir todo el cariño que merecen.
            </p>
            <div className={styles.heroActions}>
              {/*
              <Link href="/reservar" className={styles.primaryButton}>
                Reservar ahora <span aria-hidden="true">→</span>
              </Link>*/}
              <span className={styles.heroNote}>
                <span aria-hidden="true">♡</span> Amor, cuidado y diversión
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.photoHalo} aria-hidden="true" />
            <div className={styles.heroPhotoFrame}>
              <Image
                src="/images/nosotros/perritos-corriendo.webp"
                alt="Tres perritos corren alegres por el jardín de PetFunCR"
                fill
                priority
                sizes="(max-width: 760px) 90vw, 46vw"
                className={styles.heroPhoto}
              />
            </div>
            <div className={styles.photoBadge}>
              <span className={styles.photoBadgeIcon} aria-hidden="true">🐾</span>
              <span>
                <strong>Un segundo hogar</strong>
                <small>Para tu mejor amigo</small>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.milestones} aria-label="Nuestra trayectoria">
          <article className={styles.milestone}>
            <span className={styles.milestoneNumber}>2021</span>
            <span className={styles.milestoneLabel}>El año en que nació nuestra idea</span>
          </article>
          <span className={styles.milestoneDivider} aria-hidden="true" />
          <article className={styles.milestone}>
            <span className={styles.milestoneNumber}>5 años</span>
            <span className={styles.milestoneLabel}>Compartiendo amor y felicidad</span>
          </article>
          <span className={styles.milestoneDivider} aria-hidden="true" />
          <article className={styles.milestone}>
            <span className={styles.milestoneNumber}>Cada perrito</span>
            <span className={styles.milestoneLabel}>Es parte de nuestra historia</span>
          </article>
        </section>

        <section className={styles.story} aria-labelledby="story-title">
          <div className={styles.storyCopy}>
            <p className={styles.sectionEyebrow}>CÓMO EMPEZÓ TODO</p>
            <h2 id="story-title">Una idea que nació del corazón</h2>
            <p>
              En 2021 nació PetFunCR como un emprendimiento impulsado por algo que
              nos une: nuestro amor por los perritos y el deseo de brindarles el
              cuidado que merecen.
            </p>
            <p>
              Sabemos que, cuando las familias salen de viaje o necesitan ausentarse,
              quieren tener la tranquilidad de saber que sus consentidos están en
              buenas manos. Por eso creamos un espacio donde cada perrito pueda
              disfrutar de una experiencia feliz, segura y llena de cariño.
            </p>
            <div className={styles.storySignature}>
              <span className={styles.signatureHeart} aria-hidden="true">♡</span>
              <span>
                <strong>El amor es el comienzo de todo.</strong>
                <small>La esencia de PetFunCR desde el primer día.</small>
              </span>
            </div>
          </div>

          <figure className={styles.storyFigure}>
            <div className={styles.storyImageWrap}>
              <Image
                src="/images/nosotros/juego-pelota.webp"
                alt="Perritos compartiendo y jugando con una pelota en el jardín"
                fill
                sizes="(max-width: 760px) 90vw, 44vw"
                className={styles.storyImage}
              />
            </div>
            <figcaption>
              <span aria-hidden="true">✦</span>
              Momentos sencillos que se convierten en recuerdos felices.
            </figcaption>
          </figure>
        </section>

        <section className={styles.promise} aria-labelledby="promise-title">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>LO QUE NOS MUEVE</p>
            <h2 id="promise-title">Cada chiquitín es especial para nosotros</h2>
            <p>
              En PetFunCR no solo cuidamos perritos: nos alegra recibirlos, compartir
              con ellos y hacer todo lo posible para que se sientan como en casa.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            {valores.map((valor) => (
              <article className={styles.valueCard} key={valor.titulo}>
                <span className={styles.valueIcon} aria-hidden="true">
                  {valor.icono}
                </span>
                <h3>{valor.titulo}</h3>
                <p>{valor.descripcion}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.playSection} aria-labelledby="play-title">
          <div className={styles.playImageWrap}>
            <Image
              src="/images/nosotros/convivencia.webp"
              alt="Perritos conviviendo y jugando juntos en las instalaciones de PetFunCR"
              fill
              sizes="(max-width: 760px) 90vw, 46vw"
              className={styles.playImage}
            />
            <span className={styles.imagePill}>Así se viven los días en PetFunCR</span>
          </div>
          <div className={styles.playCopy}>
            <p className={styles.sectionEyebrow}>JUEGO, COMPAÑÍA Y DESCANSO</p>
            <h2 id="play-title">Días felices para quienes llenan de alegría nuestras vidas</h2>
            <p>
              Nos encanta verlos explorar, jugar con sus compañeros y encontrar un
              rinconcito cómodo para descansar. Cada huésped trae su propia forma de
              alegrarnos el día, y eso hace especial nuestro trabajo.
            </p>
            <p className={styles.playEmphasis}>
              Gracias a cada familia que nos ha confiado a su mejor amigo durante
              estos cinco años.
            </p>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingDecor} aria-hidden="true">♡</div>
          <p className={styles.sectionEyebrow}>GRACIAS POR SER PARTE DE NUESTRA HISTORIA</p>
          <h2 id="closing-title">Seguimos creciendo con el mismo amor que nos vio nacer.</h2>
          <p>
            En PetFunCR recibimos a cada perrito como a un pequeño miembro de la
            familia. ¡Esperamos compartir muchos momentos felices más!
          </p>
          {/* 
          <Link href="/reservar" className={styles.primaryButton}>
            Reservar ahora <span aria-hidden="true">→</span>
          </Link>*/}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>PetFunCR · Hotel y Guardería Canina</p>
        <p>Un segundo hogar para tu mejor amigo.</p>
      </footer>
    </div>
  );
}
