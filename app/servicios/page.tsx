import Image from "next/image";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import styles from "./servicios.module.css";

const hotelDetails = [
  "Cuartos seguros y resguardados del frío.",
  "Acompañamiento y monitoreo durante su estadía: nunca están solos.",
  "Alimentación en los horarios e indicaciones que nos dé su familia.",
  "Administración de medicamentos en los horarios acordados, cuando los necesiten.",
];

const daycareDetails = [
  "Tiempo para jugar, explorar y socializar con nuevos amigos.",
  "Compañía y supervisión durante el día.",
  "Alimentación según la rutina que nos indique su familia.",
  "Administración de medicamentos según las indicaciones acordadas, cuando corresponda.",
];

const careDetails = [
  {
    icon: "♡",
    title: "Cada perrito es único",
    description:
      "Tomamos en cuenta las indicaciones que su familia nos comparte para atender sus rutinas y necesidades.",
  },
  {
    icon: "✦",
    title: "Su comida, como en casa",
    description:
      "La familia nos proporciona el alimento y nos indica los horarios para ofrecérselo.",
  },
  {
    icon: "✓",
    title: "Cuidado con atención",
    description:
      "Si necesita medicamentos, coordinamos su administración de acuerdo con las indicaciones y los horarios acordados.",
  },
];

export default function ServiciosPage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero} aria-labelledby="servicios-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>NUESTROS SERVICIOS</p>
            <span className={styles.anniversary}>
              <span aria-hidden="true">✦</span> Cuidado y cariño desde 2021
            </span>
            <h1 id="servicios-title">
              Ellos disfrutan. <span>Vos tenés tranquilidad.</span>
            </h1>
            <p className={styles.heroDescription}>
              Ya sea para pasar el día jugando o para quedarse a dormir mientras
              estás de viaje, en PetFunCR buscamos que cada chiquitín se sienta
              acompañado, cuidado y querido.
            </p>
            <div className={styles.heroActions}>
              <Link href="/reservar" className={styles.primaryButton}>
                Reservar ahora <span aria-hidden="true">→</span>
              </Link>
              <span className={styles.heroNote}>
                <span aria-hidden="true">♡</span> Un segundo hogar para tu mejor amigo
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.photoHalo} aria-hidden="true" />
            <div className={styles.heroPhotoFrame}>
              <Image
                src="/images/servicios/guarderia-juego.webp"
                alt="Dos perritos corren felices por el jardín de PetFunCR"
                fill
                priority
                sizes="(max-width: 760px) 90vw, 44vw"
                className={styles.heroPhoto}
              />
            </div>
            <div className={styles.photoBadge}>
              <span className={styles.photoBadgeIcon} aria-hidden="true">🐾</span>
              <span>
                <strong>Juego, descanso y compañía</strong>
                <small>Con mucho amor, todos los días</small>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.services} aria-label="Servicios para tu perrito">
          <article className={styles.serviceCard}>
            <div className={styles.serviceImageWrap}>
              <Image
                src="/images/servicios/hotel-descanso.webp"
                alt="Un perrito disfruta un momento relajado en el jardín de PetFunCR"
                fill
                sizes="(max-width: 760px) 92vw, 44vw"
                className={styles.serviceImage}
              />
              <span className={styles.serviceImageLabel}>Para quedarse a dormir</span>
            </div>
            <div className={styles.serviceBody}>
              <p className={styles.sectionEyebrow}>DESCANSO Y ACOMPAÑAMIENTO</p>
              <h2>Hotel Canino</h2>
              <p className={styles.serviceIntro}>
                Cuando te vas de viaje, tu peludito cuenta con un espacio para
                descansar y recibir atención mientras está lejos de casa.
              </p>
              <ul className={styles.detailList}>
                {hotelDetails.map((detail) => (
                  <li key={detail}>
                    <span aria-hidden="true">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.serviceFootnote}>
                Nos compartís sus rutinas y nosotros nos encargamos de seguirlas durante su estadía.
              </p>
              <Link href="/reservar" className={styles.textLink}>
                Consultar una reserva <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>

          <article className={`${styles.serviceCard} ${styles.daycareCard}`}>
            <div className={styles.serviceImageWrap}>
              <Image
                src="/images/servicios/instalaciones.webp"
                alt="Perritos compartiendo en el área de jardín de PetFunCR"
                fill
                sizes="(max-width: 760px) 92vw, 44vw"
                className={styles.serviceImage}
              />
              <span className={styles.serviceImageLabel}>Un día lleno de amigos</span>
            </div>
            <div className={styles.serviceBody}>
              <p className={styles.sectionEyebrow}>JUEGO Y SOCIALIZACIÓN</p>
              <h2>Guardería Canina</h2>
              <p className={styles.serviceIntro}>
                Un día para compartir, moverse y hacer nuevos amigos mientras vos
                te ocupás de tus actividades.
              </p>
              <ul className={styles.detailList}>
                {daycareDetails.map((detail) => (
                  <li key={detail}>
                    <span aria-hidden="true">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.serviceFootnote}>
                Cada jornada busca combinar diversión, compañía y momentos para descansar.
              </p>
              <Link href="/reservar" className={styles.textLink}>
                Reservar guardería <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </section>

        <section className={styles.careSection} aria-labelledby="care-title">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>PEQUEÑOS DETALLES, MUCHO CARIÑO</p>
            <h2 id="care-title">Su bienestar también está en las rutinas</h2>
            <p>
              Cada familia conoce a su peludito mejor que nadie. Por eso valoramos
              las indicaciones que nos comparten para acompañarlo de la manera más
              cómoda posible.
            </p>
          </div>

          <div className={styles.careGrid}>
            {careDetails.map((detail) => (
              <article className={styles.careCard} key={detail.title}>
                <span className={styles.careIcon} aria-hidden="true">
                  {detail.icon}
                </span>
                <h3>{detail.title}</h3>
                <p>{detail.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.careImageSection}>
          <div className={styles.careImageWrap}>
            <Image
              src="/images/servicios/convivencia.webp"
              alt="Dos perritos se saludan amistosamente en el jardín de PetFunCR"
              fill
              sizes="(max-width: 760px) 92vw, 46vw"
              className={styles.careImage}
            />
          </div>
          <div className={styles.careImageCopy}>
            <p className={styles.sectionEyebrow}>UN AMBIENTE PARA DISFRUTAR</p>
            <h2>Un espacio limpio, seguro y lleno de amor</h2>
            <p>
              Queremos que cada visita sea una experiencia positiva: con compañía,
              momentos para jugar y la atención necesaria para que cada huésped se
              sienta bienvenido.
            </p>
            <p className={styles.careEmphasis}>
              Nunca están solos: los acompañamos y monitoreamos durante su estadía.
            </p>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingDecor} aria-hidden="true">♡</div>
          <p className={styles.sectionEyebrow}>¿LISTOS PARA SU PRÓXIMA AVENTURA?</p>
          <h2 id="closing-title">El próximo día feliz de tu peludito puede empezar aquí.</h2>
          <p>
            Revisá nuestro sistema de reservas y contanos qué servicio necesitás para tu mejor amigo.
          </p>
          <Link href="/reservar" className={styles.primaryButton}>
            Reservar ahora <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>PetFunCR · Hotel y Guardería Canina</p>
        <p>Un segundo hogar para tu mejor amigo.</p>
      </footer>
    </div>
  );
}
