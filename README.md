# Mockup PWA Frontend - App Marlegno

Applicazione web progressiva (**PWA**) sviluppata come mockup frontend per **Marlegno**, progettata con un'interfaccia moderna, pulita (stile Apple-like) e ottimizzata per l'utilizzo mobile in cantiere anche in condizioni di connettività assente o instabile.

## Stack Tecnologico
- **Framework**: Next.js (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS (Design System custom con colore brand `#063D37` e angoli supercerchio `rounded-super`)
- **PWA Offline Support**: `@ducanh2912/next-pwa`
- **Icone**: `lucide-react`

---

## Avvio Rapido in Locale

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```

3. Apri il browser all'indirizzo [http://localhost:3000](http://localhost:3000).

---

## Credenziali di Test (Login Simulato RBAC)

L'applicazione include un sistema di autenticazione simulata basato sui ruoli (**RBAC**) definito in `src/mocks/users.ts`. Utilizza le seguenti credenziali nella schermata di login iniziale per testare le diverse viste:

| Ruolo | Nome Utente | Email | Password | Rotta di Destinazione |
| :--- | :--- | :--- | :--- | :--- |
| **GEOMETRA** | Mario Rossi | `geometra.test` | `geo` | `/dashboard` |
| **RESPONSABILE** | Luigi Verdi | `responsabile.test` | `resp` | `/overview` |
| **ADMIN** | Admin di Sistema | `admin.test` | `adm` | `/utenze` |
