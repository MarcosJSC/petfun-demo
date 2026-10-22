import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import contactStyles from "./landing-contact.module.css";
import PublicHeader from "@/components/PublicHeader";

const whatsappUrl =
  "https://wa.me/50685689575?text=Hola%2C%20conoc%C3%AD%20PetFunCR%20por%20su%20p%C3%A1gina%20web%20y%20quisiera%20informaci%C3%B3n%20sobre%20sus%20servicios.";

const redesSociales = [
  {
    nombre: "Facebook",
    href: "https://www.facebook.com/PetFuncr/",
    icono: "facebook",
  },
  {
    nombre: "Instagram",
    href: "https://www.instagram.com/petfuncr/",
    icono: "instagram",
  },
  {
    nombre: "TikTok",
    href: "https://www.tiktok.com/@petfuncr",
    icono: "tiktok",
  },
] as const;

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

function SocialIcon({ name }: { name: (typeof redesSociales)[number]["icono"] }) {
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7v3.2h2.8V21h3.6Z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.7" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.7 5.6a5.6 5.6 0 0 1-3.4-3.5V2h-3.5v13.4a2.8 2.8 0 1 1-2-2.7V9.1a6.4 6.4 0 1 0 5.5 6.3V8.6a9 9 0 0 0 4.8 1.4V6.5a5.8 5.8 0 0 1-1.4-.9Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.7 9.7 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.2-.4A9.6 9.6 0 1 1 12 21Zm5.3-7.2c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7 0a7.8 7.8 0 0 1-2.3-1.4 8.7 8.7 0 0 1-1.6-2c-.2-.3 0-.5.2-.7l.5-.6.2-.5c.1-.2 0-.4 0-.5s-.7-1.6-1-2.2c-.2-.5-.5-.4-.7-.4H7.6c-.2 0-.5.1-.8.4s-1.1 1.1-1.1 2.6 1.2 3 1.3 3.2a11.4 11.4 0 0 0 4.4 3.9c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.2-1.4-.2-.3-.5-.4Z" />
    </svg>
  );
}

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
            <p className={styles.eyebrow}>HOTEL Y GUARDERÍA CANINA</p>
            <h1 id="hero-title">
              Un segundo hogar <span>para tu mejor amigo.</span>
            </h1>
            <p className={styles.description}>
              Guardería y hotel canino en un espacio seguro, limpio y lleno de diversión.
              Porque ellos también merecen vacaciones felices.
            </p>

            <div className={`${styles.actions} ${contactStyles.heroActions}`}>
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
                <span>Área de clientes</span>
                <span aria-hidden="true" className={styles.buttonArrow}>→</span>
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactStyles.whatsappButton}
                aria-label="Consultar con PetFunCR por WhatsApp"
              >
                <WhatsAppIcon />
                <span>Consultanos por WhatsApp</span>
              </a>
            </div>

            <p className={styles.reassurance}>
              <span aria-hidden="true">♥</span> Solicitá y consultá tus reservas de forma sencilla.
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

      <footer className={`${styles.footer} ${contactStyles.footer}`}>
        <div className={contactStyles.footerRow}>
          <p className={contactStyles.footerIdentity}>
            © {new Date().getFullYear()} PetFunCR <span aria-hidden="true">·</span> Hotel y Guardería Canina
          </p>

          <nav className={contactStyles.socialSection} aria-label="Redes sociales de PetFunCR">
            <h2>Seguinos en nuestras redes</h2>
            <div className={contactStyles.socialLinks}>
              {redesSociales.map((red) => (
                <a
                  className={contactStyles.socialLink}
                  key={red.nombre}
                  href={red.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visitar PetFunCR en ${red.nombre}`}
                  title={red.nombre}
                >
                  <SocialIcon name={red.icono} />
                  <span>{red.nombre}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
