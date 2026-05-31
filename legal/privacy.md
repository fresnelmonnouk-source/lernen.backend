# Politique de confidentialité — Lernen.de

> ⚠️ **DRAFT TECHNIQUE — Non validé juridiquement.**
> Ce document a été rédigé sur la base d'un canevas indicatif (Helena, audit 2026-05-31). Il **doit être validé par un avocat qualifié en droit du numérique** avant publication. Les zones `[À COMPLÉTER]` correspondent aux informations que Fresnel doit renseigner.

**Date d'effet** : `[À COMPLÉTER — date de mise en ligne]`
**Dernière mise à jour** : `[À COMPLÉTER]`

---

## 1. Préambule

La présente politique de confidentialité décrit comment **Lernen.de** (« nous », « le service ») collecte, utilise, partage et protège les données à caractère personnel de ses utilisateurs (« vous ») dans le cadre de l'utilisation de l'application mobile et des services associés.

Lernen.de s'engage à respecter le Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679), la Loi Informatique et Libertés modifiée, et le Règlement (UE) 2024/1689 sur l'intelligence artificielle (AI Act).

## 2. Responsable du traitement

**Responsable** : `[À COMPLÉTER — nom prénom OU raison sociale]`
**Adresse** : `[À COMPLÉTER — adresse postale complète]`
**Contact protection des données** : `privacy@lernen.de` (mail à activer)
**SIREN/SIRET** (si applicable) : `[À COMPLÉTER]`

## 3. Données collectées

| Catégorie | Données | Finalité | Base légale |
|---|---|---|---|
| **Identification** | Adresse email, mot de passe (hashé bcrypt par Supabase) | Authentification, gestion du compte | Exécution du contrat (art. 6.1.b) |
| **Profil** | Prénom (libre), niveau CECRL choisi (A1-B2), date d'inscription | Personnalisation pédagogique | Exécution du contrat |
| **Apprentissage** | Historique des cours générés, des examens, des certifications, scores, mots marqués connus/à revoir | Suivi de progression, recommandations | Exécution du contrat |
| **Contenu** | Textes que vous tapez dans la zone de rédaction Schreiben pour correction | Correction IA | Exécution du contrat |
| **Technique** | Adresse IP serveur (logs Vercel), identifiant de session JWT | Sécurité, fonctionnement | Intérêt légitime (art. 6.1.f) |

Nous **ne collectons pas** : localisation précise, contacts, micro, caméra, calendrier, données de santé, opinions politiques/religieuses/syndicales.

## 4. Utilisation de l'intelligence artificielle (transparence AI Act)

Lernen.de utilise des modèles d'intelligence artificielle générative (DeepSeek V4) pour :
- Générer des cours personnalisés
- Générer et corriger des examens
- Conjuguer des verbes et expliquer les règles grammaticales
- Corriger les productions écrites selon les critères pédagogiques

**Vous interagissez avec une IA**, pas avec un humain. Les contenus générés peuvent contenir des erreurs : nous vous recommandons de vérifier les informations critiques avant de les utiliser en situation d'examen officiel.

**Aucune donnée d'identification** (email, identifiant utilisateur) n'est transmise au prestataire d'IA. Seul le contenu pédagogique pertinent (verbe à conjuguer, sujet de cours, texte à corriger) lui est envoyé.

## 5. Destinataires des données

Vos données sont accessibles à :

| Destinataire | Rôle | Localisation |
|---|---|---|
| **Supabase Inc.** | Base de données + authentification | Frankfurt, Allemagne (UE) |
| **Vercel Inc.** | Hébergement backend | Frankfurt, Allemagne (UE) — region `fra1` |
| **DeepSeek (Hangzhou DeepSeek AI Co. Ltd.)** | Génération IA | Chine — sous-traitant art. 28 RGPD |
| **Resend Inc.** | Envoi des emails transactionnels (validation compte) | États-Unis — sous-traitant SCC |

### Transfert hors UE

Les transferts vers DeepSeek (Chine) et Resend (États-Unis) sont encadrés par les **Clauses Contractuelles Types (SCC 2021/914)** de la Commission européenne. Aucune donnée d'identification utilisateur n'est transférée à DeepSeek (uniquement le contenu pédagogique).

## 6. Durée de conservation

| Donnée | Durée |
|---|---|
| Compte actif | Tant que vous utilisez le service |
| Compte inactif | 3 ans après votre dernière connexion, puis suppression automatique |
| Logs serveur | 12 mois maximum |
| Données après demande de suppression | Suppression sous 30 jours |

## 7. Vos droits

Conformément au RGPD, vous disposez des droits suivants :

- **Droit d'accès** (art. 15) : obtenir une copie de vos données
- **Droit de rectification** (art. 16) : corriger une donnée inexacte
- **Droit à l'effacement** (art. 17, « droit à l'oubli ») : supprimer votre compte
- **Droit à la portabilité** (art. 20) : récupérer vos données dans un format structuré (JSON)
- **Droit d'opposition** (art. 21) : refuser certains traitements
- **Droit à la limitation** (art. 18) : geler un traitement
- **Droit de retrait du consentement** (art. 7) : à tout moment

### Comment exercer vos droits

Deux options :

1. **Dans l'application** : Profil → « Mes données » → boutons « Exporter mes données » et « Supprimer mon compte »
2. **Par email** : envoyez votre demande à `privacy@lernen.de`. Nous répondons sous **1 mois maximum** (art. 12.3 RGPD).

### Droit de réclamation

Vous pouvez introduire une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés) :
- En ligne : [cnil.fr/plaintes](https://www.cnil.fr/fr/plaintes)
- Par courrier : 3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07

## 8. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :

- Chiffrement TLS 1.3 pour tous les échanges réseau
- Mots de passe hashés (bcrypt) — jamais stockés en clair
- Row Level Security (RLS) Supabase : chaque utilisateur n'accède qu'à ses propres données
- Authentification JWT avec rotation automatique
- Audit régulier des dépendances logicielles

## 9. Mineurs

Lernen.de est destiné aux personnes âgées de **16 ans révolus** minimum. Les utilisateurs de moins de 16 ans ne sont pas autorisés à utiliser le service sans le consentement vérifiable de leurs parents ou représentants légaux.

Si nous apprenons qu'un mineur de moins de 16 ans nous a fourni des données sans consentement parental, nous supprimerons ces données dans les meilleurs délais.

## 10. Profilage automatisé

Nous n'effectuons **aucun profilage automatisé produisant des effets juridiques** vous concernant. Les recommandations pédagogiques générées par l'IA sont des suggestions qui n'ont aucune valeur officielle.

## 11. Cookies et traceurs

L'application mobile n'utilise pas de cookies HTTP (application native).

Si à l'avenir nous mettons en place des outils d'analyse statistique (PostHog, Mixpanel, Google Analytics), votre **consentement explicite** vous sera demandé conformément à la directive ePrivacy et aux recommandations de la CNIL.

## 12. Modifications

Cette politique peut être modifiée. La version applicable est celle affichée dans l'application à la date de votre utilisation. En cas de modification substantielle, vous serez informé(e) par email et/ou notification in-app.

## 13. Contact

Pour toute question relative à cette politique :
- **Email** : `privacy@lernen.de`
- **Adresse postale** : `[À COMPLÉTER]`
