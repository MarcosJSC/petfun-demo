import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import PublicHeader from "@/components/PublicHeader";

const beneficios = [
  {
    icono: "⌂",
    titulo: "Hospedaje de confianza",
    descripcion: "Un lugar donde se sienten como en casa.",
  },
  {
    icono: "🐾",
    titulo: "Guardería divertida",
    descripcion: "Juego, compañía y movimiento cada día.",
  },
  {
    icono: "✓",
    titulo: "Espacio seguro",
    descripcion: "Atención y supervisión durante su estadía.",
  },
  {
    icono: "♡",
    titulo: "Mucho cariño",
    descripcion: "Cada perrito recibe atención especial.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <section id="inicio" className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroImage} aria-hidden="true">
          <Image
            src="/images/petfun-hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={88}
            className={styles.heroPhoto}
          />
          <div className={styles.imageFade} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              HOTEL Y GUARDERÍA CANINA
            </p>
            <h1 id="hero-title">
              Un segundo hogar <span>para tu mejor amigo.</span>
            </h1>
            <p className={styles.description}>
              Guardería y hotel canino en un espacio seguro, limpio y lleno de diversión.
              Porque ellos también merecen vacaciones felices.
            </p>

            <div className={styles.actions}>
              <Link href="/reservar" className={styles.primaryButton}>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.calendarIcon}
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
                </svg>
                <span>Reservar ahora</span>
                <span aria-hidden="true" className={styles.buttonArrow}>→</span>
              </Link>
            </div>
            <p className={styles.reassurance}>
              <span aria-hidden="true">♥</span> Un lugar para jugar, descansar y sentirse querido.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.benefits} aria-label="Lo que ofrecemos">
        {beneficios.map((beneficio) => (
          <article className={styles.benefit} key={beneficio.titulo}>
            <span className={styles.benefitIcon} aria-hidden="true">
              {beneficio.icono}
            </span>
            <div>
              <h2>{beneficio.titulo}</h2>
              <p>{beneficio.descripcion}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className={styles.footer}>
        <p>PetFunCR · Hotel y Guardería Canina</p>
      </footer>
    </div>
  );
}
