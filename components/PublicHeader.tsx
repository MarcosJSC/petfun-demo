"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { LOGO_PETFUNCR_URL } from "@/lib/branding";
import styles from "./PublicHeader.module.css";

const navigationLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/servicios", label: "Servicios" },
  { href: "/reservar", label: "Reservas" },
  { href: "/instalaciones", label: "Instalaciones" },  
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },  
  { href: "/contacto", label: "Contacto" },
];

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.publicHeader}>
      <div className={styles.headerInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="PetFunCR, página de inicio"
          onClick={closeMenu}
        >
          <img
            src={LOGO_PETFUNCR_URL}
            alt="Logo oficial de PetFunCR"
            className={styles.logo}
          />
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegación principal">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <div className={styles.themeToggle}>
            <ThemeToggle />
          </div>

          <Link href="/login" className={styles.adminLink}>
          {/*
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={styles.lockIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
            */}
            <span>🔒</span>
          </Link>
{/*
          <Link href="/reservar" className={styles.reserveButton}>
            <span>Reservar ahora</span>
            <span aria-hidden="true" className={styles.reserveArrow}>
              →
            </span>
          </Link>
*/}

          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="petfun-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <nav
        id="petfun-mobile-navigation"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
        aria-label="Navegación móvil"
        aria-hidden={!menuOpen}
      >
        {navigationLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.mobileNavLink}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span>{item.label}</span>
            <span aria-hidden="true" className={styles.mobileChevron}>
              ›
            </span>
          </Link>
        ))}
        <Link
          href="/login"
          className={styles.mobileAdminLink}
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
        >
          🔒
        </Link>
      </nav>
    </header>
  );
}
