# Documents légaux Lernen.de — DRAFTS techniques

> ⚠️ **STATUT : DRAFTS NON VALIDÉS JURIDIQUEMENT**
> Les 3 documents de ce dossier sont des **drafts techniques** rédigés sur la base d'un canevas indicatif (audit Helena, 2026-05-31). Ils **doivent être impérativement validés par un avocat qualifié en droit du numérique** avant publication sur le site web public ou liaison depuis l'application.
> Budget recommandé pour l'audit + validation : **1500-3000 €** (Helena).

## Contenu du dossier

| Fichier | Document | Conformité visée |
|---|---|---|
| `privacy.md` | Politique de confidentialité | RGPD (UE 2016/679), Loi Informatique et Libertés, AI Act (UE 2024/1689) |
| `terms.md` | Conditions Générales d'Utilisation | Code de la consommation FR, Code de la propriété intellectuelle |
| `legal.md` | Mentions légales | LCEN art. 6 III (Loi n° 2004-575 du 21 juin 2004) |

## À COMPLÉTER par Fresnel avant validation avocat

Chaque draft contient des zones `[À COMPLÉTER]` correspondant aux informations que seul Fresnel peut fournir :

- Nom prénom OU raison sociale + statut juridique (personne physique vs SARL/SAS)
- Adresse postale complète
- SIREN/SIRET (si activité commerciale enregistrée)
- N° TVA intracommunautaire (si applicable)
- Capital social (si société)
- Représentant légal (si société)
- Téléphone (recommandé pour les mentions légales)
- Médiateur de la consommation désigné (obligatoire pour B2C — ex : CMAP, Médiation Net Conso)
- Dates d'effet et de mise à jour

## Activation des emails

Avant publication, créer les boîtes mail suivantes (ou alias) :
- `contact@lernen.de` — contact général
- `support@lernen.de` — support utilisateur + signalement contenu illicite (LCEN)
- `privacy@lernen.de` — demandes RGPD (droits d'accès, effacement, portabilité, etc.)

## Déploiement sur le web

Plusieurs options pour servir ces documents publiquement :

### Option A — Servir depuis le backend Vercel (rapide)

1. Convertir chaque `.md` en `.html` (via `marked`, `markdown-it` ou outil en ligne)
2. Placer dans `lernen-de-all/public/legal/` : `privacy.html`, `terms.html`, `legal.html`
3. Vercel servira automatiquement les fichiers `public/`
4. URLs finales : `https://lernen-backend-five.vercel.app/legal/privacy.html` etc.

### Option B — Site web dédié `lernen.de` (recommandé long terme)

1. Créer un site web statique (Next.js, Astro, Vercel deploy)
2. Pages : `/privacy`, `/terms`, `/legal`
3. URLs finales : `https://lernen.de/privacy`, `https://lernen.de/terms`, `https://lernen.de/legal`
4. Avantage : domaine custom = professionnalisme + meilleur SEO + cookies futurs (analytics) gérables

### Option C — Hébergement tiers (Notion public, GitHub Pages, etc.)

Possible mais déconseillé pour des documents légaux : risque de coupure, manque de contrôle, image moins pro.

## Intégration dans l'app mobile

Une fois les URLs publiques disponibles, ajouter les liens dans l'app :

1. **Écran d'inscription** : case à cocher non précochée  
   « J'accepte les [Conditions générales d'utilisation](link://terms) et ai lu la [Politique de confidentialité](link://privacy) »

2. **Écran Profil** : section « Légal »
   - Lien « Politique de confidentialité »
   - Lien « Conditions d'utilisation »
   - Lien « Mentions légales »
   - Bouton « Exporter mes données » (RGPD art. 20)
   - Bouton « Supprimer mon compte » (RGPD art. 17 + Apple Guideline 5.1.1)

## Endpoints API à créer

Pour respecter le RGPD :

- `GET /api/user-data/export` — retourne JSON de toutes les tables associées à l'utilisateur (course_history + exam_history + certification_history + user_profiles)
- `DELETE /api/user-data` — supprime le compte (via `supabase.auth.admin.deleteUser()` côté Edge Function, déclenche ON DELETE CASCADE sur les 4 tables)

## Checklist avant publication stores

- [ ] Documents validés par un avocat qualifié
- [ ] Toutes les zones `[À COMPLÉTER]` remplies
- [ ] Médiateur de la consommation désigné et coordonnées renseignées
- [ ] URLs publiques opérationnelles et stables (`/privacy`, `/terms`, `/legal`)
- [ ] Liens accessibles depuis l'app (inscription + profil)
- [ ] Case à cocher CGU à l'inscription (non précochée)
- [ ] Bouton « Supprimer mon compte » fonctionnel in-app
- [ ] Endpoint export données fonctionnel
- [ ] Email `privacy@lernen.de` actif et monitoré
- [ ] App Privacy Nutrition Labels remplis (App Store Connect)
- [ ] Data Safety Form rempli (Play Console)
- [ ] DPA Supabase signé (dashboard Supabase → Settings → Legal)

## Audit Helena — résumé risques

Au 2026-05-31, niveau de risque pour publication stores : **7,5/10 (élevé)**.
Une fois ce dossier validé par un avocat ET la checklist remplie, niveau attendu : **2/10 (acceptable)**.

Trois bloquants durs identifiés par Helena :
1. **Absence de documents légaux publics** → en cours de résolution avec ces drafts
2. **Marque Goethe sous-protégée** → résolu en session 6 (mentions retirées de l'UI mobile, disclaimer renforcé dans ces docs)
3. **Hébergement Vercel à confirmer UE** → résolu en session 6 (`regions: ["fra1"]` dans vercel.json)

---

**Référence audit complet** : `PROJETS/Lernen/Lernen_MEMORY.md`, section « Session 6 » → bloc Helena.
