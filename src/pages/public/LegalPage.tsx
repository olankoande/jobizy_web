import { useApp } from "../../app/AppProvider";

export function LegalPage({ mode }: { mode: "terms" | "privacy" }) {
  const { locale } = useApp();
  const fr = locale !== "en-CA";

  if (mode === "terms") {
    return (
      <section className="panel panel-clean" style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
          {fr ? "Conditions d'utilisation" : "Terms of Use"}
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          {fr ? "Dernière mise à jour : 1er avril 2026" : "Last updated: April 1, 2026"}
        </p>
        <div className="stack" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
          <p>{fr ? "En utilisant Jobizy, vous acceptez les présentes conditions. Veuillez les lire attentivement." : "By using Jobizy, you agree to these terms. Please read them carefully."}</p>
          <h3>{fr ? "1. Description du service" : "1. Service description"}</h3>
          <p>{fr ? "Jobizy est une plateforme de mise en relation entre clients et prestataires de services locaux. Jobizy n'est pas une partie aux contrats conclus entre clients et prestataires." : "Jobizy is a platform connecting clients with local service providers. Jobizy is not a party to contracts concluded between clients and providers."}</p>
          <h3>{fr ? "2. Comptes et responsabilités" : "2. Accounts and responsibilities"}</h3>
          <p>{fr ? "Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte. Vous devez fournir des informations exactes lors de l'inscription." : "You are responsible for keeping your credentials confidential and for all activities under your account. You must provide accurate information when registering."}</p>
          <h3>{fr ? "3. Utilisation acceptable" : "3. Acceptable use"}</h3>
          <p>{fr ? "Il est interdit d'utiliser Jobizy pour des activités illégales, de publier des contenus trompeurs ou d'usurper l'identité d'autrui." : "You may not use Jobizy for illegal activities, post misleading content, or impersonate others."}</p>
          <h3>{fr ? "4. Limitation de responsabilité" : "4. Limitation of liability"}</h3>
          <p>{fr ? "Jobizy n'est pas responsable des dommages indirects liés à l'utilisation de la plateforme ou à l'exécution des services par les prestataires." : "Jobizy is not liable for indirect damages related to the use of the platform or the performance of services by providers."}</p>
          <h3>{fr ? "5. Modification des conditions" : "5. Changes to terms"}</h3>
          <p>{fr ? "Jobizy peut modifier ces conditions à tout moment. L'utilisation continue de la plateforme après notification vaut acceptation." : "Jobizy may modify these terms at any time. Continued use of the platform after notification constitutes acceptance."}</p>
          <h3>{fr ? "6. Contact" : "6. Contact"}</h3>
          <p>{fr ? "Pour toute question : " : "For any questions: "}<a href="mailto:support@jobizy.ca">support@jobizy.ca</a></p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel-clean" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
        {fr ? "Politique de confidentialité" : "Privacy Policy"}
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        {fr ? "Dernière mise à jour : 1er avril 2026 — Conforme à la LPRPDE (Canada)" : "Last updated: April 1, 2026 — Compliant with PIPEDA (Canada)"}
      </p>
      <div className="stack" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
        <h3>{fr ? "1. Renseignements collectés" : "1. Information we collect"}</h3>
        <p>{fr ? "Nous collectons les informations que vous fournissez directement (nom, adresse e-mail, description de profil, zones de service) ainsi que des données d'utilisation générées automatiquement (pages visitées, actions effectuées, adresse IP)." : "We collect information you provide directly (name, email address, profile description, service zones) and automatically generated usage data (pages visited, actions taken, IP address)."}</p>

        <h3>{fr ? "2. Utilisation des renseignements" : "2. How we use your information"}</h3>
        <p>{fr ? "Vos renseignements sont utilisés pour : faire fonctionner la plateforme de mise en relation, vous envoyer des notifications relatives à vos demandes ou offres, améliorer nos services, respecter nos obligations légales." : "Your information is used to: operate the matching platform, send notifications about your requests or offers, improve our services, fulfill our legal obligations."}</p>

        <h3>{fr ? "3. Partage des renseignements" : "3. Information sharing"}</h3>
        <p>{fr ? "Nous ne vendons pas vos renseignements personnels. Nous partageons uniquement les informations nécessaires avec les autres utilisateurs dans le cadre de la mise en relation (ex. : votre nom et ville avec un prestataire intéressé), et avec nos sous-traitants techniques (hébergement, paiement via Stripe, e-mail via Resend)." : "We do not sell your personal information. We only share information necessary for the matching service (e.g. your name and city with an interested provider), and with our technical subprocessors (hosting, payment via Stripe, email via Resend)."}</p>

        <h3>{fr ? "4. Témoins (cookies)" : "4. Cookies"}</h3>
        <p>{fr ? "Nous utilisons des cookies essentiels au fonctionnement de la plateforme (session, préférences de langue). Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement explicite." : "We use cookies essential to the platform's operation (session, language preferences). No advertising or third-party tracking cookies are used without your explicit consent."}</p>

        <h3>{fr ? "5. Conservation des données" : "5. Data retention"}</h3>
        <p>{fr ? "Vos données sont conservées tant que votre compte est actif. Après suppression du compte, les données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale de conservation." : "Your data is retained as long as your account is active. After account deletion, personal data is erased within 30 days, unless legally required to be retained."}</p>

        <h3>{fr ? "6. Vos droits" : "6. Your rights"}</h3>
        <p>{fr
          ? "Conformément à la LPRPDE et à la Loi 25 (Québec), vous avez le droit de : accéder à vos renseignements personnels, en demander la correction, en demander la suppression, retirer votre consentement."
          : "Under PIPEDA and Quebec Law 25, you have the right to: access your personal information, request corrections, request deletion, and withdraw consent."}</p>
        <p>{fr ? "Pour exercer ces droits, contactez-nous à " : "To exercise these rights, contact us at "}<a href="mailto:privacy@jobizy.ca">privacy@jobizy.ca</a>.</p>

        <h3>{fr ? "7. Suppression du compte" : "7. Account deletion"}</h3>
        <p>{fr ? "Vous pouvez supprimer votre compte depuis les paramètres de votre profil. Cette action supprime définitivement toutes vos données personnelles dans les 30 jours suivant la demande." : "You can delete your account from your profile settings. This permanently removes all your personal data within 30 days of the request."}</p>

        <h3>{fr ? "8. Sécurité" : "8. Security"}</h3>
        <p>{fr ? "Vos données sont transmises via HTTPS et stockées dans des environnements sécurisés. Les mots de passe ne sont jamais stockés en clair." : "Your data is transmitted over HTTPS and stored in secure environments. Passwords are never stored in plain text."}</p>

        <h3>{fr ? "9. Contact" : "9. Contact"}</h3>
        <p>{fr ? "Responsable de la protection des données : " : "Data protection contact: "}<a href="mailto:privacy@jobizy.ca">privacy@jobizy.ca</a></p>
      </div>
    </section>
  );
}
