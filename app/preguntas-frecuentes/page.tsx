import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import styles from "./preguntas.module.css";

const grupos = [
  {
    numero: "01",
    icono: "⌂",
    titulo: "Información general",
    descripcion: "Lo básico para conocer PetFunCR.",
    preguntas: [
      {
        pregunta: "¿Dónde está ubicado PetFunCR?",
        respuesta: (
          <p>
            Estamos en <strong>San Rafael de Heredia, Costa Rica</strong>. Si es tu
            primera visita, escribinos para coordinar una cita antes de venir.
          </p>
        ),
      },
      {
        pregunta: "¿Cuál es el horario de atención?",
        respuesta: (
          <p>
            Nuestro horario habitual es de <strong>7:00 a. m. a 6:00 p. m., todos los días</strong>,
            incluidos sábados, domingos y feriados. Si en alguna ocasión debemos cerrar,
            lo comunicaremos previamente por nuestras redes sociales.
          </p>
        ),
      },
      {
        pregunta: "¿Qué servicios ofrece PetFunCR?",
        respuesta: (
          <p>
            Ofrecemos <strong>Hotel Canino</strong>, para los perritos que se quedan a dormir,
            y <strong>Guardería Canina</strong>, para quienes pasan el día jugando y compartiendo
            con sus amigos.
          </p>
        ),
      },
      {
        pregunta: "¿Puedo visitar las instalaciones sin cita?",
        respuesta: (
          <p>
            Para atenderte de la mejor manera, <strong>no recibimos visitas ni perritos sin cita previa</strong>.
            Escribinos por WhatsApp al <a href="https://wa.me/50685689575" target="_blank" rel="noreferrer">8568-9575 </a>
            para coordinar el día y la hora.
          </p>
        ),
      },
    ],
  },
  {
    numero: "02",
    icono: "♡",
    titulo: "Ingreso y socialización",
    descripcion: "Cómo preparamos una buena convivencia.",
    preguntas: [
      {
        pregunta: "¿Qué edad debe tener mi perrito para ingresar?",
        respuesta: (
          <p>
            Debe tener al menos <strong>6 meses</strong>, contar con las vacunas al día y tener
            la autorización de su veterinario para convivir en una guardería con otros perritos.
          </p>
        ),
      },
      {
        pregunta: "¿Qué vacunas necesita mi perrito?",
        respuesta: (
          <p>
            Para ingresar, debe tener al día las vacunas <strong>múltiple, rabia, Bordetella y Giardia</strong>.
            También verificamos que cumpla con los requisitos de desparasitación interna y externa.
          </p>
        ),
      },
      {
        pregunta: "¿Qué pasa si una vacuna está vencida?",
        respuesta: (
          <p>
            Nuestra política contempla un período de gracia de <strong>15 días después del vencimiento</strong>.
            Revisamos las fechas de vacunación durante el proceso de ingreso; si tenés dudas,
            consultanos antes de solicitar una reserva.
          </p>
        ),
      },
      {
        pregunta: "¿Todos los perritos deben pasar una prueba de socialización?",
        respuesta: (
          <p>
            Sí. Antes de aceptar a un nuevo huésped, coordinamos una cita para realizar pruebas
            de socialización y valorar cómo se relaciona con otros perritos. Buscamos una convivencia
            amigable y tomamos en cuenta la compatibilidad al organizar los grupos.
          </p>
        ),
      },
      {
        pregunta: "¿Aceptan todas las razas y tamaños?",
        respuesta: (
          <p>
            En general, recibimos perritos de distintas razas y tamaños. El ingreso depende de la
            evaluación de socialización y de su compatibilidad con la convivencia grupal. PetFunCR
            se reserva el derecho de admisión cuando sea necesario para proteger el bienestar de los huéspedes.
          </p>
        ),
      },
    ],
  },
  {
    numero: "03",
    icono: "☾",
    titulo: "Estadía y cuidados",
    descripcion: "Sus rutinas, su descanso y su bienestar.",
    preguntas: [
      {
        pregunta: "¿Cómo puedo reservar por primera vez?",
        respuesta: (
          <p>
            Si es la primera vez, escribinos por WhatsApp al <a href="https://wa.me/50685689575" target="_blank" rel="noreferrer">8568-9575</a>
            para coordinar una cita y realizar la prueba de socialización. No recibimos perritos ni visitas
            sin cita previa. Después de completar el proceso y asignarte tu código de cliente, podrás
            solicitar reservas desde nuestra página web.
          </p>
        ),
      },
      {
        pregunta: "¿Cómo duermen los perritos durante el hospedaje?",
        respuesta: (
          <p>
            Tenemos <strong>dos cuartos compartidos, sin jaulas</strong>. Los huéspedes duermen acompañados
            y organizamos los grupos según su compatibilidad, valorada durante las pruebas de socialización.
          </p>
        ),
      },
      {
        pregunta: "¿Los perritos están solos durante su estadía?",
        respuesta: (
          <p>
            No. Los acompañamos y monitoreamos durante su estadía. Queremos que puedan disfrutar de sus
            actividades y descansar en un ambiente seguro, limpio y lleno de cariño.
          </p>
        ),
      },
      {
        pregunta: "¿Debo llevar la comida de mi perrito?",
        respuesta: (
          <p>
            Sí. La familia proporciona el alimento y nos indica las porciones y los horarios en que debemos
            ofrecérselo, para respetar su rutina habitual.
          </p>
        ),
      },
      {
        pregunta: "¿Pueden administrar medicamentos?",
        respuesta: (
          <p>
            Sí, podemos administrar los medicamentos que necesite tu perrito en los horarios acordados,
            siguiendo las indicaciones que nos proporciones previamente.
          </p>
        ),
      },
      {
        pregunta: "¿Puedo llevar varios perritos de una misma familia?",
        respuesta: (
          <p>
            ¡Claro que sí! <strong>Toda la familia perruna será recibida con mucho amor.</strong> Cada perrito
            debe cumplir con los requisitos de ingreso y pasar su prueba de socialización.
          </p>
        ),
      },
    ],
  },
  {
    numero: "04",
    icono: "▦",
    titulo: "Reservas, tarifas y horarios especiales",
    descripcion: "Qué necesitás saber antes de reservar.",
    preguntas: [
      {
        pregunta: "¿Cómo puedo reservar en línea?",
        respuesta: (
          <p>
            La reserva en línea está disponible para clientes cuyo perrito ya pasó la prueba de socialización
            y que cuentan con un código de cliente asignado. Desde la página de reservas podrás indicar las
            fechas, el servicio y los perritos. La solicitud debe ser revisada y aprobada por PetFunCR antes
            de considerarse confirmada.
          </p>
        ),
      },
      {
        pregunta: "¿Puedo reservar para el mismo día?",
        respuesta: (
          <p>
            No. La solicitud debe realizarse <strong>al menos un día antes de la fecha de entrada</strong>.
            Te recomendamos solicitarla con anticipación para consultar la disponibilidad.
          </p>
        ),
      },
      {
        pregunta: "¿Cuántos perritos pueden hospedarse al mismo tiempo?",
        respuesta: (
          <p>
            Nuestra capacidad máxima es de <strong>15 perritos</strong> para organizar el espacio
            y la atención. Toda reserva depende de la disponibilidad y de la confirmación de PetFunCR.
          </p>
        ),
      },
      {
        pregunta: "¿Cuánto cuesta el Hotel Canino o la Guardería?",
        respuesta: (
          <p>
            La tarifa depende del <strong>peso de cada perrito</strong>. Durante la prueba de socialización te
            confirmamos el precio que corresponde tanto al Hotel Canino como a la Guardería Canina.
          </p>
        ),
      },
      {
        pregunta: "¿Puedo dejar o recoger a mi perrito después de las 6:00 p. m.?",
        respuesta: (
          <p>
            Nuestro horario habitual termina a las 6:00 p. m. Solo podemos considerar excepciones por un
            motivo de fuerza mayor y con coordinación previa con nosotros.
          </p>
        ),
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero} aria-labelledby="faq-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>ESTAMOS PARA AYUDARTE</p>
            <span className={styles.anniversary}>
              <span aria-hidden="true">✦</span> PetFunCR · Desde 2021
            </span>
            <h1 id="faq-title">
              Tus dudas, <span>resueltas con cariño.</span>
            </h1>
            <p className={styles.heroDescription}>
              Queremos que te sintás con tranquilidad antes de confiarnos a tu mejor amigo.
              Aquí encontrarás información sobre nuestros servicios, los requisitos de ingreso
              y cómo reservar.
            </p>
            <div className={styles.heroActions}>
              <Link href="/reservar" className={styles.primaryButton}>
                Reservar ahora <span aria-hidden="true">→</span>
              </Link>
              <a href="#faq-list" className={styles.secondaryLink}>
                Explorar preguntas <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <aside className={styles.heroCard} aria-label="Información importante">
            <div className={styles.heroCardIcon} aria-hidden="true">♡</div>
            <p className={styles.heroCardLabel}>ANTES DE TU PRIMERA VISITA</p>
            <h2>Primero nos conocemos.</h2>
            <p>
              Coordiná una cita para realizar la prueba de socialización. Después de completar
              el proceso y recibir tu código de cliente, podrás solicitar tus reservas en línea.
            </p>
            <a href="https://wa.me/50685689575" target="_blank" rel="noreferrer" className={styles.whatsappLink}>
              <span aria-hidden="true">◉</span> WhatsApp 8568-9575 <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </section>

        <section className={styles.quickFacts} aria-label="Información rápida de PetFunCR">
          <article className={styles.quickFact}>
            <span className={styles.quickIcon} aria-hidden="true">⌂</span>
            <div><h2>Ubicación</h2><p>San Rafael de Heredia</p></div>
          </article>
          <article className={styles.quickFact}>
            <span className={styles.quickIcon} aria-hidden="true">◷</span>
            <div><h2>Horario</h2><p>Todos los días · 7 a. m. – 6 p. m.</p></div>
          </article>
          <article className={styles.quickFact}>
            <span className={styles.quickIcon} aria-hidden="true">🐾</span>
            <div><h2>Capacidad máxima</h2><p>15 perritos</p></div>
          </article>
        </section>

        <section className={styles.faqSection} id="faq-list" aria-labelledby="faq-list-title">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>PREGUNTAS FRECUENTES</p>
            <h2 id="faq-list-title">Todo lo que querés saber</h2>
            <p>Elegí un tema y abrí las preguntas para leer cada respuesta.</p>
          </div>

          <div className={styles.faqLayout}>
            <nav className={styles.categoryNav} aria-label="Temas de preguntas frecuentes">
              <span className={styles.categoryNavTitle}>Temas</span>
              {grupos.map((grupo) => (
                <a key={grupo.numero} href={`#tema-${grupo.numero}`} className={styles.categoryLink}>
                  <span className={styles.categoryIcon} aria-hidden="true">{grupo.icono}</span>
                  <span>{grupo.titulo}</span>
                  <span className={styles.categoryArrow} aria-hidden="true">→</span>
                </a>
              ))}
              <div className={styles.sideNote}>
                <span aria-hidden="true">♡</span>
                <p>¿Es tu primera vez? Escribinos antes de venir para coordinar una cita.</p>
                <a href="https://wa.me/50685689575" target="_blank" rel="noreferrer">Contactar por WhatsApp ↗</a>
              </div>
            </nav>

            <div className={styles.faqGroups}>
              {grupos.map((grupo) => (
                <section className={styles.faqGroup} id={`tema-${grupo.numero}`} key={grupo.numero} aria-labelledby={`grupo-title-${grupo.numero}`}>
                  <div className={styles.groupHeading}>
                    <span className={styles.groupNumber}>{grupo.numero}</span>
                    <div>
                      <h3 id={`grupo-title-${grupo.numero}`}>{grupo.titulo}</h3>
                      <p>{grupo.descripcion}</p>
                    </div>
                  </div>
                  <div className={styles.questions}>
                    {grupo.preguntas.map((faq) => (
                      <details className={styles.question} key={faq.pregunta}>
                        <summary>
                          <span className={styles.questionText}>{faq.pregunta}</span>
                          <span className={styles.expandIcon} aria-hidden="true" />
                        </summary>
                        <div className={styles.answer}>{faq.respuesta}</div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.contactCta} aria-labelledby="contact-cta-title">
          <div className={styles.ctaDecor} aria-hidden="true">♡</div>
          <div className={styles.ctaCopy}>
            <p className={styles.sectionEyebrow}>¿NECESITÁS AYUDA?</p>
            <h2 id="contact-cta-title">Estamos para orientarte.</h2>
            <p>Si tenés alguna consulta que no aparece aquí, escribinos. Con gusto te ayudamos a preparar la primera visita de tu peludito.</p>
          </div>
          <div className={styles.ctaActions}>
            <a href="https://wa.me/50685689575" target="_blank" rel="noreferrer" className={styles.whatsappButton}>
              Consultar por WhatsApp <span aria-hidden="true">↗</span>
            </a>
            <Link href="/reservar" className={styles.ctaReserveLink}>Ya tengo mi código · Reservar ahora →</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>PetFunCR · Hotel y Guardería Canina</p>
        <p>Un segundo hogar para tu mejor amigo.</p>
      </footer>
    </div>
  );
}
