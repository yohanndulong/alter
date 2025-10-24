import React from 'react'
import { useNavigate } from 'react-router-dom'
import './PrivacyPolicy.css'

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <button className="privacy-back-button" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <h1 className="privacy-title">Politique de confidentialité</h1>
        <p className="privacy-subtitle">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="privacy-content">
        <section className="privacy-section">
          <h2 className="privacy-section-title">1. Introduction</h2>
          <p className="privacy-text">
            Alter ("nous", "notre" ou "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité
            explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque
            vous utilisez notre application de rencontres.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">2. Informations que nous collectons</h2>

          <h3 className="privacy-subsection-title">2.1 Informations que vous nous fournissez</h3>
          <ul className="privacy-list">
            <li>Informations de profil (nom, âge, photos, bio, centres d'intérêt)</li>
            <li>Coordonnées (adresse e-mail, numéro de téléphone)</li>
            <li>Préférences de rencontre et informations démographiques</li>
            <li>Messages et interactions avec d'autres utilisateurs</li>
            <li>Informations de paiement (pour les abonnements premium)</li>
          </ul>

          <h3 className="privacy-subsection-title">2.2 Informations collectées automatiquement</h3>
          <ul className="privacy-list">
            <li>Données de localisation (avec votre consentement)</li>
            <li>Informations sur l'appareil (modèle, système d'exploitation, identifiant unique)</li>
            <li>Données d'utilisation (fonctionnalités utilisées, temps passé, interactions)</li>
            <li>Journaux et données techniques</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">3. Comment nous utilisons vos informations</h2>
          <p className="privacy-text">Nous utilisons vos informations pour :</p>
          <ul className="privacy-list">
            <li>Créer et gérer votre compte</li>
            <li>Vous présenter des profils compatibles</li>
            <li>Faciliter les communications entre utilisateurs</li>
            <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
            <li>Assurer la sécurité et prévenir la fraude</li>
            <li>Envoyer des notifications et communications importantes</li>
            <li>Analyser l'utilisation de l'application</li>
            <li>Personnaliser votre expérience</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">4. Partage de vos informations</h2>
          <p className="privacy-text">Nous pouvons partager vos informations avec :</p>
          <ul className="privacy-list">
            <li><strong>Autres utilisateurs :</strong> Votre profil public est visible par les autres membres</li>
            <li><strong>Prestataires de services :</strong> Entreprises qui nous aident à fournir nos services</li>
            <li><strong>Autorités légales :</strong> Si requis par la loi ou pour protéger nos droits</li>
            <li><strong>En cas de fusion :</strong> Si notre entreprise est vendue ou fusionnée</li>
          </ul>
          <p className="privacy-text">
            <strong>Nous ne vendons jamais vos données personnelles à des tiers.</strong>
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">5. Vos droits</h2>
          <p className="privacy-text">Vous avez le droit de :</p>
          <ul className="privacy-list">
            <li>Accéder à vos données personnelles</li>
            <li>Rectifier vos informations inexactes</li>
            <li>Supprimer votre compte et vos données</li>
            <li>Vous opposer au traitement de vos données</li>
            <li>Retirer votre consentement à tout moment</li>
            <li>Demander la portabilité de vos données</li>
            <li>Déposer une plainte auprès d'une autorité de protection des données</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">6. Sécurité des données</h2>
          <p className="privacy-text">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos
            informations personnelles contre la perte, l'utilisation abusive, l'accès non autorisé, la divulgation,
            l'altération ou la destruction.
          </p>
          <p className="privacy-text">Nos mesures de sécurité incluent :</p>
          <ul className="privacy-list">
            <li>Chiffrement des données en transit et au repos</li>
            <li>Authentification sécurisée</li>
            <li>Contrôles d'accès stricts</li>
            <li>Surveillance et audits réguliers</li>
            <li>Formation du personnel sur la protection des données</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">7. Conservation des données</h2>
          <p className="privacy-text">
            Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services et
            respecter nos obligations légales. Lorsque vous supprimez votre compte, nous supprimons ou anonymisons vos
            données dans un délai raisonnable, sauf si nous devons les conserver pour des raisons légales.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">8. Cookies et technologies similaires</h2>
          <p className="privacy-text">
            Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser
            l'utilisation de l'application et personnaliser le contenu. Vous pouvez gérer vos préférences en matière de
            cookies dans les paramètres de votre appareil.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">9. Utilisateurs mineurs</h2>
          <p className="privacy-text">
            Notre service est destiné aux personnes âgées de 18 ans et plus. Nous ne collectons pas sciemment
            d'informations personnelles auprès de personnes de moins de 18 ans. Si nous apprenons qu'un mineur a créé un
            compte, nous le supprimerons immédiatement.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">10. Modifications de cette politique</h2>
          <p className="privacy-text">
            Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous informerons de
            tout changement important en publiant la nouvelle politique sur cette page et en mettant à jour la date de
            "Dernière mise à jour". Nous vous encourageons à consulter régulièrement cette politique.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">11. Transferts internationaux</h2>
          <p className="privacy-text">
            Vos informations peuvent être transférées et traitées dans des pays autres que votre pays de résidence. Nous
            prenons des mesures appropriées pour garantir que vos données sont traitées en toute sécurité et conformément
            à cette politique de confidentialité.
          </p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">12. Contact</h2>
          <p className="privacy-text">
            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, veuillez nous
            contacter :
          </p>
          <ul className="privacy-list">
            <li><strong>Email :</strong> privacy@alter-app.com</li>
            <li><strong>Adresse :</strong> [Votre adresse]</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">13. Base légale du traitement (RGPD)</h2>
          <p className="privacy-text">
            Si vous êtes dans l'Espace économique européen, nous traitons vos données personnelles sur les bases légales
            suivantes :
          </p>
          <ul className="privacy-list">
            <li><strong>Exécution du contrat :</strong> Pour fournir nos services</li>
            <li><strong>Consentement :</strong> Pour certaines fonctionnalités comme la localisation</li>
            <li><strong>Intérêt légitime :</strong> Pour améliorer nos services et assurer la sécurité</li>
            <li><strong>Obligation légale :</strong> Pour respecter nos obligations légales</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
