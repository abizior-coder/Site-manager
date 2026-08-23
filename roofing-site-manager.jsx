import { useState, useEffect, useRef } from "react";
import { Clock, Package, Wrench, Camera, MessageSquare, MapPin, FileText, Plus, X, Check, ChevronRight, ChevronLeft, Play, Square, Send, Siren, Phone, ShieldAlert, ScanLine, Loader2, ExternalLink, ImagePlus, QrCode, Barcode, ClipboardCheck, Globe, Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, RefreshCw, Mountain, User, Flame, HardHat, Shovel, Copy, Pencil, CalendarDays, Mail, CreditCard, Award, Trash2, Share2, ClipboardPaste, Printer } from "lucide-react";

const COLORS = {
  shell: "#1B1B1A",
  card: "#242322",
  cardAlt: "#2C2A28",
  accent: "#DA291C",
  accentDim: "#A61F15",
  text: "#F5F1E8",
  muted: "#9C9791",
  border: "#3A3835",
  success: "#7FA65C",
  amber: "#E8B923",
  danger: "#E5484D",
  stone: "#6B7280",
};

const LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "pl", label: "Polski" },
  { code: "sk", label: "Slovenčina" },
  { code: "cs", label: "Čeština" },
];

const T = {
  en: {
    appLabel: "Site Log", onSite: "On site",
    navToday: "Today", navProjects: "Projects", navReports: "Reports", navSafety: "Safety",
    startYourDay: "Start your day", addProjectFirst: "Add a project first to clock in.", clockOut: "Clock out",
    workingAt: "Working at", tellLog: "Tell the log what happened", tellLogPlaceholder: "e.g. Used 8 bags of cement, 2 pallets of tiles",
    autoSortHint: "It gets sorted into Time, Materials, or Tools automatically.",
    materials: "Materials", tools: "Tools", photoLabel: "Photo",
    scanDelivery: "Scan delivery photo", beforeAfter: "Before / after usage",
    pickupCode: "Generate wholesaler pickup code", newInspection: "New roof inspection",
    todaysTickets: "Today's tickets", nothingLogged: "Nothing logged yet.",
    newProjectSite: "New project / site", noProjectsYet: "No projects yet — add your first site above.",
    entriesLabelFmt: "logged entries", addAddress: "Add address", editLabel: "Edit",
    daily: "Daily", monthly: "Monthly", hoursWorked: "Hours worked", materialsLogged: "Materials logged",
    toolsLogged: "Tools logged", sitesVisited: "Sites visited", sitesLabel: "Sites",
    sendToSupervisor: "Send to supervisor", entriesTitle: "Entries",
    sosButton: "SOS — Accident on site", emergencyNumbers: "Emergency numbers",
    fallProtectionTitle: "Roof work — fall protection basics", fullRulesLink: "Full rules on suva.ch",
    summaryDisclaimer: "Summary only — always follow the binding SUVA / BauAV text, which can change.",
    ambulance: "Ambulance", police: "Police", fire: "Fire", generalEmergency: "General (EU-wide)",
    emergencyTitle: "Emergency", closeAndLog: "Close & log",
    notBreathingHint: "Not breathing normally? Lay the phone flat and read aloud.",
    back: "Back", nextStep: "Next step",
    cprDisclaimer: "This is general first-aid guidance, not a substitute for training or a paramedic. Always call 144 first.",
    detectedHint: "Detected — uncheck anything wrong", addToMaterialsLog: "Add to materials log",
    readMaterials: "Read materials", readingPhoto: "Reading photo…", before: "Before", after: "After",
    scanErrorHint: "Couldn't read that photo clearly — try again or log it manually.",
    scanTitleSingle: "Scan delivery photo", scanTitleCompare: "Before / after usage",
    scanHintCompare: "Add a photo of the stack before work, then one after — the assistant will estimate what was used.",
    pickupTitle: "Wholesaler pickup",
    pickupHint: "Enter the order or reference number from your manager's invoice — the counter scans this to release the delivery.",
    orderPlaceholder: "Order / reference number", supplierPlaceholder: "Supplier / wholesaler (optional)",
    qrLabel: "QR code", barcodeLabel: "Barcode", generateCode: "Generate code",
    showScreenHint: "Show this screen at the counter. Needs a data connection to load the code image.", doneLabel: "Done",
    inspectionTitle: "Roof inspection", inspectionPlaceholder: "Describe the inspection — condition, what you're doing, anything notable…",
    startTimeLabel: "Start time", ladderLabel: "Ladder (m)", psaLabel: "PSA count",
    sendToAdvisors: "Send to the advisors",
    advisorsHint: "A safety advisor, a materials estimator, and a report compiler will review this in turn.",
    logInspection: "Log inspection", materialsAlsoLog: "Materials to also log — uncheck anything wrong",
    agent1Note: "Safety advisor reviewing fall-protection setup…", agent2Note: "Materials estimator reading the description and photos…",
    agent3Note: "Compiling the inspection report…", couldntReach: "Couldn't reach the advisors — check your connection and try again.",
    newProjectTitle: "New project", editProjectTitle: "Edit project", projectNameLabel: "Project name",
    clientNameLabel: "Client name (optional)", addressLabel: "Address (optional)", addProjectBtn: "Add project", saveLabel: "Save",
    addMaterialTitle: "Add Materials", addToolTitle: "Add Tools", attachPhotoTitle: "Add Photo",
    captionPlaceholder: "Caption (optional)", whatUsedPlaceholder: "What was used / needed",
    qtyPlaceholder: "Qty", unitPlaceholder: "Unit (bags, pcs...)", logItBtn: "Log it",
    clockedIn: "Clocked in", clockedOutLogged: "Clocked out & logged", projectAdded: "Project added",
    projectUpdated: "Project updated", couldntSave: "Couldn't save — try again",
    inspectionLogged: "Inspection report logged", pickupLogged: "Pickup code generated",
    typeTime: "Time", typeMaterial: "Materials", typeTool: "Tools", typeNote: "Note", typePhoto: "Photo", typePickup: "Pickup", typeInspection: "Inspection",
    cpr1t: "Check", cpr1x: "Tap firmly and shout. No response, not breathing normally? Move to the next step.",
    cpr2t: "Call first", cpr2x: "Call 144 (ambulance) before anything else. Put the call on speaker and lay the phone down.",
    cpr3t: "Position", cpr3x: "Lay the person flat on their back, on a firm surface. Kneel beside their chest.",
    cpr4t: "Hand placement", cpr4x: "Two hands, heel of palm on the center of the chest, fingers interlocked, arms straight.",
    cpr5t: "Compress", cpr5x: "Push hard and fast, about 5–6 cm deep, at roughly 100–120 per minute — the tempo of a fast heartbeat. Let the chest fully rise between pushes.",
    cpr6t: "Keep going", cpr6x: "Continue compressions without stopping until paramedics arrive or the person starts breathing normally. Swap with someone else every ~2 minutes if you can, without pausing compressions for long.",
    cpr7t: "AED if available", cpr7x: "If a defibrillator (AED) is nearby, send someone for it now — turn it on and follow its voice prompts alongside compressions.",
    weatherTitle: "Weather", weatherAt: "At your location", weatherLoading: "Locating…",
    weatherError: "Couldn't get weather — check location permission and connection.", weatherRefresh: "Refresh",
    weatherSource: "MeteoSwiss data via Open-Meteo", windLabel: "Wind",
    changeLocation: "Change location", cityPlaceholder: "City name", locationNotFound: "Location not found — try another spelling.",
    copyBtn: "Copy", suggestionsTitle: "Suggestions",
    sizePlaceholder: "Size / dimension (e.g. 5x80, optional)",
    categoryLabel: "Category", projectCatFlat: "Flat roof", projectCatPitched: "Pitched roof", projectCatFacade: "Facade", projectCatOther: "Other",
    navCalendar: "Calendar", requestLeave: "Request leave", leaveVacation: "Vacation", leaveSick: "Sick leave", leaveOther: "Other",
    leaveNotePlaceholder: "Note (optional)", statusPending: "Pending", statusApproved: "Approved", statusDeclined: "Declined",
    markApproved: "Mark approved", markDeclined: "Mark declined", supervisorContactHeading: "Supervisor contact",
    supervisorNameLabel: "Supervisor name", supervisorEmailLabel: "Supervisor email", supervisorPhoneLabel: "Supervisor phone",
    sendRequestBtn: "Send to supervisor", dayJournalHeading: "Logged that day",
    profileInsurance: "Insurance cards", profileCertificates: "Certificates", addInsuranceCard: "Add insurance card", addCertificate: "Add certificate",
    insuranceTypeLabel: "Type (e.g. health, accident)", providerLabel: "Provider / company", policyNumberLabel: "Policy / card number", insurancePhoneLabel: "Claims phone number",
    certTitleLabel: "Certificate name", issuerLabel: "Issued by", issueDateLabel: "Issue date", expiryDateLabel: "Expiry date (optional)",
    deleteLabel: "Delete", noDocsYet: "None saved yet", expiredLabel: "Expired",
    shareProject: "Share project", importProject: "Import project", projectCodeLabel: "Project code",
    pasteCodePlaceholder: "Paste project code here", importBtn: "Add to my projects",
    invalidCode: "That code couldn't be read — check it was copied in full.",
    shareHint: "Send this code to your crew member via WhatsApp or email — they paste it into \"Import project\" on their phone.",
    sentReports: "Sent reports", editReportHint: "Adjust the hours or add a note if something needs correcting.",
    hoursFieldLabel: "Hours", notesLabel: "Notes", savePdfBtn: "Save as PDF", resendBtn: "Resend to supervisor",
    noReportsYet: "No reports sent yet", sentOnLabel: "Sent", editedTag: "Edited", generatedOnLabel: "Generated",
    backupTitle: "Backup & restore", exportBackup: "Export backup", importBackupBtn: "Restore from backup",
    backupHint: "Copy this code somewhere safe (Notes app, email to yourself). If the app ever loses your data, paste it back in here to restore everything.",
    invalidBackupCode: "That backup code couldn't be read.", backupRestored: "Backup restored",
    charactersLabel: "characters",
    condClear: "Clear", condPartly: "Partly cloudy", condCloudy: "Cloudy", condFog: "Fog",
    condDrizzle: "Drizzle", condRain: "Rain", condSnow: "Snow", condStorm: "Thunderstorm",
    profileTitle: "My profile", yourName: "Your name", yourPhone: "Your phone",
    emergencyContact: "Emergency contact", contactName: "Contact name", contactRelationship: "Relationship",
    contactPhone: "Contact phone", saveProfile: "Save profile", callEmergencyContact: "Call emergency contact",
    safetyCatRoof: "Roofing", safetyCatMetal: "Metalwork", safetyCatFormwork: "Formwork", safetyCatGround: "Groundwork",
    profileTitle: "Your profile & emergency contact", yourNameLabel: "Your name", yourPhoneLabel: "Your phone",
    employerLabel: "Employer / company", emergencyContactTitle: "Emergency contact (family member)",
    contactNameLabel: "Contact name", contactRelationLabel: "Relationship", contactPhoneLabel: "Contact phone",
    profileHint: "Stored only on this device.", callContact: "Call emergency contact",
    safetyCatFall: "Falls (height)", safetyCatExcavation: "Excavation & groundwork",
    safetyCatScaffolding: "Scaffolding", safetyCatElectrical: "Electrical & metalwork",
  },
  de: {
    appLabel: "Baustellenprotokoll", onSite: "Vor Ort",
    navToday: "Heute", navProjects: "Projekte", navReports: "Berichte", navSafety: "Sicherheit",
    startYourDay: "Tag starten", addProjectFirst: "Zuerst ein Projekt anlegen, um einzustempeln.", clockOut: "Ausstempeln",
    workingAt: "Im Einsatz bei", tellLog: "Sag dem Protokoll, was passiert ist", tellLogPlaceholder: "z. B. 8 Sack Zement, 2 Paletten Ziegel verwendet",
    autoSortHint: "Wird automatisch unter Zeit, Material oder Werkzeug einsortiert.",
    materials: "Material", tools: "Werkzeug", photoLabel: "Foto",
    scanDelivery: "Lieferschein scannen", beforeAfter: "Vorher / Nachher Verbrauch",
    pickupCode: "Abholcode für Grossisten erstellen", newInspection: "Neue Dachinspektion",
    todaysTickets: "Heutige Einträge", nothingLogged: "Noch nichts erfasst.",
    newProjectSite: "Neues Projekt / Baustelle", noProjectsYet: "Noch keine Projekte — fügen Sie oben Ihre erste Baustelle hinzu.",
    entriesLabelFmt: "erfasste Einträge", addAddress: "Adresse hinzufügen", editLabel: "Bearbeiten",
    daily: "Täglich", monthly: "Monatlich", hoursWorked: "Geleistete Stunden", materialsLogged: "Erfasstes Material",
    toolsLogged: "Erfasstes Werkzeug", sitesVisited: "Besuchte Baustellen", sitesLabel: "Baustellen",
    sendToSupervisor: "An Vorgesetzten senden", entriesTitle: "Einträge",
    sosButton: "SOS — Unfall auf der Baustelle", emergencyNumbers: "Notrufnummern",
    fallProtectionTitle: "Dacharbeiten — Absturzsicherung Grundlagen", fullRulesLink: "Vollständige Regeln auf suva.ch",
    summaryDisclaimer: "Nur eine Zusammenfassung — massgebend ist immer der verbindliche SUVA-/BauAV-Text, der sich ändern kann.",
    ambulance: "Ambulanz", police: "Polizei", fire: "Feuerwehr", generalEmergency: "Allgemein (EU-weit)",
    emergencyTitle: "Notfall", closeAndLog: "Schliessen & protokollieren",
    notBreathingHint: "Atmet die Person nicht normal? Telefon flach hinlegen und laut vorlesen.",
    back: "Zurück", nextStep: "Nächster Schritt",
    cprDisclaimer: "Dies ist eine allgemeine Erste-Hilfe-Anleitung, kein Ersatz für eine Ausbildung oder den Rettungsdienst. Zuerst immer die 144 anrufen.",
    detectedHint: "Erkannt — Falsches abwählen", addToMaterialsLog: "Zum Materialprotokoll hinzufügen",
    readMaterials: "Material erkennen", readingPhoto: "Foto wird gelesen…", before: "Vorher", after: "Nachher",
    scanErrorHint: "Foto konnte nicht klar gelesen werden — nochmals versuchen oder manuell erfassen.",
    scanTitleSingle: "Lieferschein scannen", scanTitleCompare: "Vorher / Nachher Verbrauch",
    scanHintCompare: "Ein Foto des Stapels vor der Arbeit hinzufügen, dann eines danach — der Assistent schätzt den Verbrauch.",
    pickupTitle: "Abholung beim Grossisten",
    pickupHint: "Bestell- oder Referenznummer von der Rechnung Ihres Vorgesetzten eingeben — der Schalter scannt diese, um die Lieferung freizugeben.",
    orderPlaceholder: "Bestell- / Referenznummer", supplierPlaceholder: "Lieferant / Grossist (optional)",
    qrLabel: "QR-Code", barcodeLabel: "Strichcode", generateCode: "Code erstellen",
    showScreenHint: "Diesen Bildschirm am Schalter zeigen. Benötigt eine Datenverbindung, um das Bild zu laden.", doneLabel: "Fertig",
    inspectionTitle: "Dachinspektion", inspectionPlaceholder: "Inspektion beschreiben — Zustand, was Sie tun, Auffälligkeiten…",
    startTimeLabel: "Startzeit", ladderLabel: "Leiter (m)", psaLabel: "Anzahl PSA",
    sendToAdvisors: "An die Berater senden",
    advisorsHint: "Ein Sicherheitsberater, ein Materialschätzer und ein Berichtsersteller prüfen dies nacheinander.",
    logInspection: "Inspektion protokollieren", materialsAlsoLog: "Zusätzlich zu erfassendes Material — Falsches abwählen",
    agent1Note: "Sicherheitsberater prüft die Absturzsicherung…", agent2Note: "Materialschätzer liest Beschreibung und Fotos…",
    agent3Note: "Inspektionsbericht wird erstellt…", couldntReach: "Berater nicht erreichbar — Verbindung prüfen und erneut versuchen.",
    newProjectTitle: "Neues Projekt", editProjectTitle: "Projekt bearbeiten", projectNameLabel: "Projektname",
    clientNameLabel: "Kundenname (optional)", addressLabel: "Adresse (optional)", addProjectBtn: "Projekt hinzufügen", saveLabel: "Speichern",
    addMaterialTitle: "Material hinzufügen", addToolTitle: "Werkzeug hinzufügen", attachPhotoTitle: "Foto hinzufügen",
    captionPlaceholder: "Beschriftung (optional)", whatUsedPlaceholder: "Was wurde verwendet / benötigt",
    qtyPlaceholder: "Menge", unitPlaceholder: "Einheit (Sack, Stk...)", logItBtn: "Erfassen",
    clockedIn: "Eingestempelt", clockedOutLogged: "Ausgestempelt & erfasst", projectAdded: "Projekt hinzugefügt",
    projectUpdated: "Projekt aktualisiert", couldntSave: "Speichern fehlgeschlagen — nochmals versuchen",
    inspectionLogged: "Inspektionsbericht erfasst", pickupLogged: "Abholcode erstellt",
    typeTime: "Zeit", typeMaterial: "Material", typeTool: "Werkzeug", typeNote: "Notiz", typePhoto: "Foto", typePickup: "Abholung", typeInspection: "Inspektion",
    cpr1t: "Prüfen", cpr1x: "Kräftig antippen und laut ansprechen. Keine Reaktion, keine normale Atmung? Weiter zum nächsten Schritt.",
    cpr2t: "Zuerst anrufen", cpr2x: "Zuerst die 144 (Ambulanz) anrufen. Auf Lautsprecher stellen und Telefon hinlegen.",
    cpr3t: "Lagern", cpr3x: "Die Person flach auf den Rücken legen, auf festem Untergrund. Neben dem Brustkorb knien.",
    cpr4t: "Handposition", cpr4x: "Beide Hände, Handballen auf der Brustmitte, Finger verschränkt, Arme durchgestreckt.",
    cpr5t: "Drücken", cpr5x: "Fest und schnell drücken, etwa 5–6 cm tief, ca. 100–120 Mal pro Minute — Tempo eines schnellen Herzschlags. Brustkorb zwischen den Kompressionen vollständig entlasten.",
    cpr6t: "Weitermachen", cpr6x: "Kompressionen ohne Unterbrechung fortsetzen, bis der Rettungsdienst eintrifft oder die Person normal zu atmen beginnt. Wenn möglich alle ~2 Minuten mit jemandem abwechseln, ohne die Kompressionen lange zu unterbrechen.",
    cpr7t: "AED falls vorhanden", cpr7x: "Ist ein Defibrillator (AED) in der Nähe, jemanden holen lassen — einschalten und den Sprachanweisungen parallel zu den Kompressionen folgen.",
    weatherTitle: "Wetter", weatherAt: "An Ihrem Standort", weatherLoading: "Standort wird ermittelt…",
    weatherError: "Wetter konnte nicht geladen werden — Standortfreigabe und Verbindung prüfen.", weatherRefresh: "Aktualisieren",
    weatherSource: "MeteoSchweiz-Daten via Open-Meteo", windLabel: "Wind",
    changeLocation: "Ort ändern", cityPlaceholder: "Ortsname", locationNotFound: "Ort nicht gefunden — andere Schreibweise versuchen.",
    copyBtn: "Kopieren", suggestionsTitle: "Vorschläge",
    sizePlaceholder: "Grösse / Mass (z. B. 5x80, optional)",
    categoryLabel: "Kategorie", projectCatFlat: "Flachdach", projectCatPitched: "Steildach", projectCatFacade: "Fassade", projectCatOther: "Sonstiges",
    navCalendar: "Kalender", requestLeave: "Abwesenheit beantragen", leaveVacation: "Ferien", leaveSick: "Krankheit", leaveOther: "Sonstiges",
    leaveNotePlaceholder: "Notiz (optional)", statusPending: "Ausstehend", statusApproved: "Genehmigt", statusDeclined: "Abgelehnt",
    markApproved: "Als genehmigt markieren", markDeclined: "Als abgelehnt markieren", supervisorContactHeading: "Vorgesetzten-Kontakt",
    supervisorNameLabel: "Name Vorgesetzte(r)", supervisorEmailLabel: "E-Mail Vorgesetzte(r)", supervisorPhoneLabel: "Telefon Vorgesetzte(r)",
    sendRequestBtn: "An Vorgesetzten senden", dayJournalHeading: "An diesem Tag erfasst",
    profileInsurance: "Versicherungskarten", profileCertificates: "Zertifikate", addInsuranceCard: "Versicherungskarte hinzufügen", addCertificate: "Zertifikat hinzufügen",
    insuranceTypeLabel: "Art (z. B. Kranken-, Unfallversicherung)", providerLabel: "Versicherer / Firma", policyNumberLabel: "Policen- / Kartennummer", insurancePhoneLabel: "Telefonnummer für Schadenfälle",
    certTitleLabel: "Name des Zertifikats", issuerLabel: "Ausgestellt von", issueDateLabel: "Ausstellungsdatum", expiryDateLabel: "Ablaufdatum (optional)",
    deleteLabel: "Löschen", noDocsYet: "Noch nichts gespeichert", expiredLabel: "Abgelaufen",
    shareProject: "Projekt teilen", importProject: "Projekt importieren", projectCodeLabel: "Projektcode",
    pasteCodePlaceholder: "Projektcode hier einfügen", importBtn: "Zu meinen Projekten hinzufügen",
    invalidCode: "Der Code konnte nicht gelesen werden — prüfen Sie, ob er vollständig kopiert wurde.",
    shareHint: "Senden Sie diesen Code per WhatsApp oder E-Mail an Ihr Team — sie fügen ihn unter «Projekt importieren» auf ihrem Handy ein.",
    sentReports: "Gesendete Berichte", editReportHint: "Stunden anpassen oder eine Notiz hinzufügen, falls etwas korrigiert werden muss.",
    hoursFieldLabel: "Stunden", notesLabel: "Notizen", savePdfBtn: "Als PDF speichern", resendBtn: "Erneut an Vorgesetzten senden",
    noReportsYet: "Noch keine Berichte gesendet", sentOnLabel: "Gesendet", editedTag: "Bearbeitet", generatedOnLabel: "Erstellt",
    backupTitle: "Backup & Wiederherstellung", exportBackup: "Backup exportieren", importBackupBtn: "Aus Backup wiederherstellen",
    backupHint: "Kopieren Sie diesen Code an einen sicheren Ort (Notizen-App, E-Mail an sich selbst). Sollte die App jemals Daten verlieren, fügen Sie ihn hier ein, um alles wiederherzustellen.",
    invalidBackupCode: "Dieser Backup-Code konnte nicht gelesen werden.", backupRestored: "Backup wiederhergestellt",
    charactersLabel: "Zeichen",
    condClear: "Klar", condPartly: "Teilweise bewölkt", condCloudy: "Bewölkt", condFog: "Nebel",
    condDrizzle: "Nieselregen", condRain: "Regen", condSnow: "Schnee", condStorm: "Gewitter",
    profileTitle: "Mein Profil", yourName: "Ihr Name", yourPhone: "Ihre Telefonnummer",
    emergencyContact: "Notfallkontakt", contactName: "Name der Kontaktperson", contactRelationship: "Beziehung",
    contactPhone: "Telefonnummer Kontakt", saveProfile: "Profil speichern", callEmergencyContact: "Notfallkontakt anrufen",
    safetyCatRoof: "Dacharbeiten", safetyCatMetal: "Metallbau", safetyCatFormwork: "Schalungsbau", safetyCatGround: "Erdarbeiten",
    profileTitle: "Ihr Profil & Notfallkontakt", yourNameLabel: "Ihr Name", yourPhoneLabel: "Ihre Telefonnummer",
    employerLabel: "Arbeitgeber / Firma", emergencyContactTitle: "Notfallkontakt (Familienangehörige/r)",
    contactNameLabel: "Name der Kontaktperson", contactRelationLabel: "Beziehung", contactPhoneLabel: "Telefonnummer der Kontaktperson",
    profileHint: "Wird nur auf diesem Gerät gespeichert.", callContact: "Notfallkontakt anrufen",
    safetyCatFall: "Absturz (Höhe)", safetyCatExcavation: "Aushub & Tiefbau",
    safetyCatScaffolding: "Gerüst", safetyCatElectrical: "Elektro & Metallbau",
  },
  fr: {
    appLabel: "Journal de chantier", onSite: "Sur site",
    navToday: "Aujourd'hui", navProjects: "Projets", navReports: "Rapports", navSafety: "Sécurité",
    startYourDay: "Commencer la journée", addProjectFirst: "Ajoutez d'abord un projet pour pointer.", clockOut: "Pointer la sortie",
    workingAt: "En intervention à", tellLog: "Dites au journal ce qui s'est passé", tellLogPlaceholder: "ex. 8 sacs de ciment, 2 palettes de tuiles utilisés",
    autoSortHint: "Classé automatiquement dans Temps, Matériaux ou Outils.",
    materials: "Matériaux", tools: "Outils", photoLabel: "Photo",
    scanDelivery: "Scanner le bon de livraison", beforeAfter: "Consommation avant / après",
    pickupCode: "Générer un code de retrait grossiste", newInspection: "Nouvelle inspection de toiture",
    todaysTickets: "Entrées du jour", nothingLogged: "Rien d'enregistré pour l'instant.",
    newProjectSite: "Nouveau projet / chantier", noProjectsYet: "Aucun projet — ajoutez votre premier chantier ci-dessus.",
    entriesLabelFmt: "entrées enregistrées", addAddress: "Ajouter une adresse", editLabel: "Modifier",
    daily: "Journalier", monthly: "Mensuel", hoursWorked: "Heures travaillées", materialsLogged: "Matériaux enregistrés",
    toolsLogged: "Outils enregistrés", sitesVisited: "Chantiers visités", sitesLabel: "Chantiers",
    sendToSupervisor: "Envoyer au responsable", entriesTitle: "Entrées",
    sosButton: "SOS — Accident sur le chantier", emergencyNumbers: "Numéros d'urgence",
    fallProtectionTitle: "Travaux de toiture — protection antichute", fullRulesLink: "Règles complètes sur suva.ch",
    summaryDisclaimer: "Résumé uniquement — le texte officiel SUVA / OTConst fait foi et peut changer.",
    ambulance: "Ambulance", police: "Police", fire: "Pompiers", generalEmergency: "Général (UE)",
    emergencyTitle: "Urgence", closeAndLog: "Fermer et enregistrer",
    notBreathingHint: "La personne ne respire pas normalement ? Posez le téléphone à plat et lisez à voix haute.",
    back: "Retour", nextStep: "Étape suivante",
    cprDisclaimer: "Ceci est une aide générale, pas un substitut à une formation ou à un secouriste. Appelez toujours le 144 en premier.",
    detectedHint: "Détecté — décochez ce qui est faux", addToMaterialsLog: "Ajouter au journal des matériaux",
    readMaterials: "Lire les matériaux", readingPhoto: "Lecture de la photo…", before: "Avant", after: "Après",
    scanErrorHint: "Impossible de lire clairement la photo — réessayez ou saisissez manuellement.",
    scanTitleSingle: "Scanner le bon de livraison", scanTitleCompare: "Consommation avant / après",
    scanHintCompare: "Ajoutez une photo de la pile avant le travail, puis une après — l'assistant estimera ce qui a été utilisé.",
    pickupTitle: "Retrait chez le grossiste",
    pickupHint: "Saisissez le numéro de commande ou de référence de la facture de votre responsable — le comptoir le scanne pour libérer la livraison.",
    orderPlaceholder: "Numéro de commande / référence", supplierPlaceholder: "Fournisseur / grossiste (facultatif)",
    qrLabel: "Code QR", barcodeLabel: "Code-barres", generateCode: "Générer le code",
    showScreenHint: "Montrez cet écran au comptoir. Nécessite une connexion pour charger l'image du code.", doneLabel: "Terminé",
    inspectionTitle: "Inspection de toiture", inspectionPlaceholder: "Décrivez l'inspection — état, ce que vous faites, tout élément notable…",
    startTimeLabel: "Heure de début", ladderLabel: "Échelle (m)", psaLabel: "Nombre d'EPI antichute",
    sendToAdvisors: "Envoyer aux conseillers",
    advisorsHint: "Un conseiller sécurité, un estimateur de matériaux et un rédacteur de rapport examineront ceci tour à tour.",
    logInspection: "Enregistrer l'inspection", materialsAlsoLog: "Matériaux à enregistrer également — décochez ce qui est faux",
    agent1Note: "Le conseiller sécurité examine la protection antichute…", agent2Note: "L'estimateur lit la description et les photos…",
    agent3Note: "Rédaction du rapport d'inspection…", couldntReach: "Impossible de joindre les conseillers — vérifiez votre connexion et réessayez.",
    newProjectTitle: "Nouveau projet", editProjectTitle: "Modifier le projet", projectNameLabel: "Nom du projet",
    clientNameLabel: "Nom du client (facultatif)", addressLabel: "Adresse (facultatif)", addProjectBtn: "Ajouter le projet", saveLabel: "Enregistrer",
    addMaterialTitle: "Ajouter des matériaux", addToolTitle: "Ajouter des outils", attachPhotoTitle: "Ajouter une photo",
    captionPlaceholder: "Légende (facultatif)", whatUsedPlaceholder: "Ce qui a été utilisé / nécessaire",
    qtyPlaceholder: "Qté", unitPlaceholder: "Unité (sacs, pcs...)", logItBtn: "Enregistrer",
    clockedIn: "Entrée pointée", clockedOutLogged: "Sortie pointée et enregistrée", projectAdded: "Projet ajouté",
    projectUpdated: "Projet mis à jour", couldntSave: "Échec de l'enregistrement — réessayez",
    inspectionLogged: "Rapport d'inspection enregistré", pickupLogged: "Code de retrait généré",
    typeTime: "Temps", typeMaterial: "Matériaux", typeTool: "Outils", typeNote: "Note", typePhoto: "Photo", typePickup: "Retrait", typeInspection: "Inspection",
    cpr1t: "Vérifier", cpr1x: "Tapotez fermement et parlez fort. Pas de réaction, respiration anormale ? Passez à l'étape suivante.",
    cpr2t: "Appeler d'abord", cpr2x: "Appelez le 144 (ambulance) avant tout. Mettez le haut-parleur et posez le téléphone.",
    cpr3t: "Position", cpr3x: "Allongez la personne sur le dos, sur une surface ferme. Agenouillez-vous près de sa poitrine.",
    cpr4t: "Position des mains", cpr4x: "Deux mains, talon de la paume au centre de la poitrine, doigts entrecroisés, bras tendus.",
    cpr5t: "Comprimer", cpr5x: "Appuyez fort et vite, environ 5–6 cm de profondeur, à un rythme de 100–120 par minute — le tempo d'un cœur rapide. Laissez la poitrine remonter complètement entre les compressions.",
    cpr6t: "Continuer", cpr6x: "Poursuivez les compressions sans arrêt jusqu'à l'arrivée des secours ou jusqu'à ce que la personne respire normalement. Relayez-vous toutes les ~2 minutes si possible, sans interrompre longtemps les compressions.",
    cpr7t: "DAE si disponible", cpr7x: "Si un défibrillateur (DAE) est à proximité, envoyez quelqu'un le chercher — allumez-le et suivez ses instructions vocales en parallèle des compressions.",
    weatherTitle: "Météo", weatherAt: "À votre emplacement", weatherLoading: "Localisation…",
    weatherError: "Impossible d'obtenir la météo — vérifiez l'autorisation de localisation et la connexion.", weatherRefresh: "Actualiser",
    weatherSource: "Données MétéoSuisse via Open-Meteo", windLabel: "Vent",
    changeLocation: "Changer de lieu", cityPlaceholder: "Nom de la ville", locationNotFound: "Lieu introuvable — essayez une autre orthographe.",
    copyBtn: "Copier", suggestionsTitle: "Suggestions",
    sizePlaceholder: "Taille / dimension (ex. 5x80, facultatif)",
    categoryLabel: "Catégorie", projectCatFlat: "Toit plat", projectCatPitched: "Toit en pente", projectCatFacade: "Façade", projectCatOther: "Autre",
    navCalendar: "Calendrier", requestLeave: "Demander un congé", leaveVacation: "Vacances", leaveSick: "Congé maladie", leaveOther: "Autre",
    leaveNotePlaceholder: "Note (facultatif)", statusPending: "En attente", statusApproved: "Approuvé", statusDeclined: "Refusé",
    markApproved: "Marquer comme approuvé", markDeclined: "Marquer comme refusé", supervisorContactHeading: "Contact du responsable",
    supervisorNameLabel: "Nom du responsable", supervisorEmailLabel: "E-mail du responsable", supervisorPhoneLabel: "Téléphone du responsable",
    sendRequestBtn: "Envoyer au responsable", dayJournalHeading: "Enregistré ce jour-là",
    profileInsurance: "Cartes d'assurance", profileCertificates: "Certificats", addInsuranceCard: "Ajouter une carte d'assurance", addCertificate: "Ajouter un certificat",
    insuranceTypeLabel: "Type (ex. maladie, accident)", providerLabel: "Assureur / entreprise", policyNumberLabel: "Numéro de police / carte", insurancePhoneLabel: "Numéro pour déclarer un sinistre",
    certTitleLabel: "Nom du certificat", issuerLabel: "Délivré par", issueDateLabel: "Date de délivrance", expiryDateLabel: "Date d'expiration (facultatif)",
    deleteLabel: "Supprimer", noDocsYet: "Rien d'enregistré pour l'instant", expiredLabel: "Expiré",
    shareProject: "Partager le projet", importProject: "Importer un projet", projectCodeLabel: "Code du projet",
    pasteCodePlaceholder: "Collez le code du projet ici", importBtn: "Ajouter à mes projets",
    invalidCode: "Ce code n'a pas pu être lu — vérifiez qu'il a été copié en entier.",
    shareHint: "Envoyez ce code à votre collègue par WhatsApp ou e-mail — il le colle dans « Importer un projet » sur son téléphone.",
    sentReports: "Rapports envoyés", editReportHint: "Ajustez les heures ou ajoutez une note si quelque chose doit être corrigé.",
    hoursFieldLabel: "Heures", notesLabel: "Notes", savePdfBtn: "Enregistrer en PDF", resendBtn: "Renvoyer au responsable",
    noReportsYet: "Aucun rapport envoyé pour l'instant", sentOnLabel: "Envoyé", editedTag: "Modifié", generatedOnLabel: "Généré",
    backupTitle: "Sauvegarde et restauration", exportBackup: "Exporter une sauvegarde", importBackupBtn: "Restaurer depuis une sauvegarde",
    backupHint: "Copiez ce code en lieu sûr (application Notes, e-mail à vous-même). Si l'appli perd vos données, collez-le ici pour tout restaurer.",
    invalidBackupCode: "Ce code de sauvegarde n'a pas pu être lu.", backupRestored: "Sauvegarde restaurée",
    charactersLabel: "caractères",
    condClear: "Dégagé", condPartly: "Partiellement nuageux", condCloudy: "Nuageux", condFog: "Brouillard",
    condDrizzle: "Bruine", condRain: "Pluie", condSnow: "Neige", condStorm: "Orage",
    profileTitle: "Mon profil", yourName: "Votre nom", yourPhone: "Votre téléphone",
    emergencyContact: "Contact d'urgence", contactName: "Nom du contact", contactRelationship: "Lien de parenté",
    contactPhone: "Téléphone du contact", saveProfile: "Enregistrer le profil", callEmergencyContact: "Appeler le contact d'urgence",
    safetyCatRoof: "Toiture", safetyCatMetal: "Métallerie", safetyCatFormwork: "Coffrage", safetyCatGround: "Terrassement",
    profileTitle: "Votre profil et contact d'urgence", yourNameLabel: "Votre nom", yourPhoneLabel: "Votre téléphone",
    employerLabel: "Employeur / entreprise", emergencyContactTitle: "Contact d'urgence (membre de la famille)",
    contactNameLabel: "Nom du contact", contactRelationLabel: "Lien de parenté", contactPhoneLabel: "Téléphone du contact",
    profileHint: "Stocké uniquement sur cet appareil.", callContact: "Appeler le contact d'urgence",
    safetyCatFall: "Chutes (hauteur)", safetyCatExcavation: "Fouilles et terrassement",
    safetyCatScaffolding: "Échafaudage", safetyCatElectrical: "Électricité et métallerie",
  },
  it: {
    appLabel: "Registro di cantiere", onSite: "In cantiere",
    navToday: "Oggi", navProjects: "Progetti", navReports: "Rapporti", navSafety: "Sicurezza",
    startYourDay: "Inizia la giornata", addProjectFirst: "Aggiungi prima un progetto per timbrare.", clockOut: "Timbra uscita",
    workingAt: "Al lavoro presso", tellLog: "Racconta al registro cosa è successo", tellLogPlaceholder: "es. usati 8 sacchi di cemento, 2 pallet di tegole",
    autoSortHint: "Viene classificato automaticamente in Tempo, Materiali o Attrezzi.",
    materials: "Materiali", tools: "Attrezzi", photoLabel: "Foto",
    scanDelivery: "Scansiona bolla di consegna", beforeAfter: "Consumo prima / dopo",
    pickupCode: "Genera codice ritiro grossista", newInspection: "Nuova ispezione tetto",
    todaysTickets: "Voci di oggi", nothingLogged: "Nessuna voce registrata.",
    newProjectSite: "Nuovo progetto / cantiere", noProjectsYet: "Nessun progetto ancora — aggiungi il tuo primo cantiere qui sopra.",
    entriesLabelFmt: "voci registrate", addAddress: "Aggiungi indirizzo", editLabel: "Modifica",
    daily: "Giornaliero", monthly: "Mensile", hoursWorked: "Ore lavorate", materialsLogged: "Materiali registrati",
    toolsLogged: "Attrezzi registrati", sitesVisited: "Cantieri visitati", sitesLabel: "Cantieri",
    sendToSupervisor: "Invia al responsabile", entriesTitle: "Voci",
    sosButton: "SOS — Incidente in cantiere", emergencyNumbers: "Numeri di emergenza",
    fallProtectionTitle: "Lavori sul tetto — basi protezione anticaduta", fullRulesLink: "Regole complete su suva.ch",
    summaryDisclaimer: "Solo un riassunto — fa fede sempre il testo vincolante SUVA / OLCostr, che può cambiare.",
    ambulance: "Ambulanza", police: "Polizia", fire: "Pompieri", generalEmergency: "Generale (UE)",
    emergencyTitle: "Emergenza", closeAndLog: "Chiudi e registra",
    notBreathingHint: "La persona non respira normalmente? Appoggia il telefono e leggi ad alta voce.",
    back: "Indietro", nextStep: "Passo successivo",
    cprDisclaimer: "Questa è una guida generale di primo soccorso, non sostituisce un corso o un soccorritore. Chiama sempre prima il 144.",
    detectedHint: "Rilevato — deseleziona ciò che è sbagliato", addToMaterialsLog: "Aggiungi al registro materiali",
    readMaterials: "Leggi materiali", readingPhoto: "Lettura foto…", before: "Prima", after: "Dopo",
    scanErrorHint: "Impossibile leggere chiaramente la foto — riprova o registra manualmente.",
    scanTitleSingle: "Scansiona bolla di consegna", scanTitleCompare: "Consumo prima / dopo",
    scanHintCompare: "Aggiungi una foto della pila prima del lavoro, poi una dopo — l'assistente stimerà quanto è stato usato.",
    pickupTitle: "Ritiro dal grossista",
    pickupHint: "Inserisci il numero d'ordine o di riferimento della fattura del tuo responsabile — il banco lo scansiona per rilasciare la consegna.",
    orderPlaceholder: "Numero d'ordine / riferimento", supplierPlaceholder: "Fornitore / grossista (facoltativo)",
    qrLabel: "Codice QR", barcodeLabel: "Codice a barre", generateCode: "Genera codice",
    showScreenHint: "Mostra questa schermata al banco. Serve una connessione dati per caricare l'immagine del codice.", doneLabel: "Fatto",
    inspectionTitle: "Ispezione tetto", inspectionPlaceholder: "Descrivi l'ispezione — condizioni, cosa stai facendo, dettagli rilevanti…",
    startTimeLabel: "Ora di inizio", ladderLabel: "Scala (m)", psaLabel: "Numero DPI anticaduta",
    sendToAdvisors: "Invia ai consulenti",
    advisorsHint: "Un consulente per la sicurezza, uno stimatore di materiali e un compilatore di rapporti esamineranno questo a turno.",
    logInspection: "Registra ispezione", materialsAlsoLog: "Materiali da registrare anche — deseleziona ciò che è sbagliato",
    agent1Note: "Il consulente sicurezza esamina la protezione anticaduta…", agent2Note: "Lo stimatore legge la descrizione e le foto…",
    agent3Note: "Compilazione del rapporto di ispezione…", couldntReach: "Impossibile contattare i consulenti — controlla la connessione e riprova.",
    newProjectTitle: "Nuovo progetto", editProjectTitle: "Modifica progetto", projectNameLabel: "Nome del progetto",
    clientNameLabel: "Nome del cliente (facoltativo)", addressLabel: "Indirizzo (facoltativo)", addProjectBtn: "Aggiungi progetto", saveLabel: "Salva",
    addMaterialTitle: "Aggiungi materiali", addToolTitle: "Aggiungi attrezzi", attachPhotoTitle: "Aggiungi foto",
    captionPlaceholder: "Didascalia (facoltativo)", whatUsedPlaceholder: "Cosa è stato usato / serve",
    qtyPlaceholder: "Qtà", unitPlaceholder: "Unità (sacchi, pz...)", logItBtn: "Registra",
    clockedIn: "Entrata timbrata", clockedOutLogged: "Uscita timbrata e registrata", projectAdded: "Progetto aggiunto",
    projectUpdated: "Progetto aggiornato", couldntSave: "Salvataggio non riuscito — riprova",
    inspectionLogged: "Rapporto di ispezione registrato", pickupLogged: "Codice di ritiro generato",
    typeTime: "Tempo", typeMaterial: "Materiali", typeTool: "Attrezzi", typeNote: "Nota", typePhoto: "Foto", typePickup: "Ritiro", typeInspection: "Ispezione",
    cpr1t: "Controlla", cpr1x: "Scuoti e chiama ad alta voce. Nessuna risposta, respiro non normale? Passa al punto successivo.",
    cpr2t: "Chiama subito", cpr2x: "Chiama il 144 (ambulanza) prima di tutto. Attiva il vivavoce e appoggia il telefono.",
    cpr3t: "Posizione", cpr3x: "Sdraia la persona sulla schiena, su una superficie rigida. Inginocchiati accanto al torace.",
    cpr4t: "Posizione mani", cpr4x: "Due mani, base del palmo al centro del torace, dita intrecciate, braccia tese.",
    cpr5t: "Comprimi", cpr5x: "Spingi forte e veloce, circa 5–6 cm di profondità, a un ritmo di 100–120 al minuto — il tempo di un battito cardiaco veloce. Lascia risalire completamente il torace tra una compressione e l'altra.",
    cpr6t: "Continua", cpr6x: "Continua le compressioni senza fermarti finché non arrivano i soccorsi o la persona respira normalmente. Se possibile, cambia con qualcun altro ogni ~2 minuti, senza interrompere a lungo le compressioni.",
    cpr7t: "DAE se disponibile", cpr7x: "Se c'è un defibrillatore (DAE) nelle vicinanze, manda qualcuno a prenderlo — accendilo e segui le istruzioni vocali insieme alle compressioni.",
    weatherTitle: "Meteo", weatherAt: "Nella tua posizione", weatherLoading: "Localizzazione…",
    weatherError: "Impossibile ottenere il meteo — controlla il permesso di posizione e la connessione.", weatherRefresh: "Aggiorna",
    weatherSource: "Dati MeteoSvizzera via Open-Meteo", windLabel: "Vento",
    changeLocation: "Cambia località", cityPlaceholder: "Nome città", locationNotFound: "Località non trovata — prova un'altra grafia.",
    copyBtn: "Copia", suggestionsTitle: "Suggerimenti",
    sizePlaceholder: "Misura / dimensione (es. 5x80, facoltativo)",
    categoryLabel: "Categoria", projectCatFlat: "Tetto piano", projectCatPitched: "Tetto a falde", projectCatFacade: "Facciata", projectCatOther: "Altro",
    navCalendar: "Calendario", requestLeave: "Richiedi permesso", leaveVacation: "Ferie", leaveSick: "Malattia", leaveOther: "Altro",
    leaveNotePlaceholder: "Nota (facoltativo)", statusPending: "In attesa", statusApproved: "Approvato", statusDeclined: "Rifiutato",
    markApproved: "Segna come approvato", markDeclined: "Segna come rifiutato", supervisorContactHeading: "Contatto del responsabile",
    supervisorNameLabel: "Nome del responsabile", supervisorEmailLabel: "Email del responsabile", supervisorPhoneLabel: "Telefono del responsabile",
    sendRequestBtn: "Invia al responsabile", dayJournalHeading: "Registrato quel giorno",
    profileInsurance: "Carte assicurative", profileCertificates: "Certificati", addInsuranceCard: "Aggiungi carta assicurativa", addCertificate: "Aggiungi certificato",
    insuranceTypeLabel: "Tipo (es. malattia, infortuni)", providerLabel: "Assicuratore / azienda", policyNumberLabel: "Numero di polizza / tessera", insurancePhoneLabel: "Numero per sinistri",
    certTitleLabel: "Nome del certificato", issuerLabel: "Rilasciato da", issueDateLabel: "Data di rilascio", expiryDateLabel: "Data di scadenza (facoltativo)",
    deleteLabel: "Elimina", noDocsYet: "Nessuno salvato ancora", expiredLabel: "Scaduto",
    shareProject: "Condividi progetto", importProject: "Importa progetto", projectCodeLabel: "Codice del progetto",
    pasteCodePlaceholder: "Incolla qui il codice del progetto", importBtn: "Aggiungi ai miei progetti",
    invalidCode: "Impossibile leggere il codice — verifica di averlo copiato per intero.",
    shareHint: "Invia questo codice al tuo collega via WhatsApp o e-mail — lo incollerà in \"Importa progetto\" sul suo telefono.",
    sentReports: "Rapporti inviati", editReportHint: "Modifica le ore o aggiungi una nota se qualcosa va corretto.",
    hoursFieldLabel: "Ore", notesLabel: "Note", savePdfBtn: "Salva come PDF", resendBtn: "Invia di nuovo al responsabile",
    noReportsYet: "Nessun rapporto inviato ancora", sentOnLabel: "Inviato", editedTag: "Modificato", generatedOnLabel: "Generato",
    backupTitle: "Backup e ripristino", exportBackup: "Esporta backup", importBackupBtn: "Ripristina da backup",
    backupHint: "Copia questo codice in un posto sicuro (app Note, e-mail a te stesso). Se l'app perde i dati, incollalo qui per ripristinare tutto.",
    invalidBackupCode: "Impossibile leggere questo codice di backup.", backupRestored: "Backup ripristinato",
    charactersLabel: "caratteri",
    condClear: "Sereno", condPartly: "Parzialmente nuvoloso", condCloudy: "Nuvoloso", condFog: "Nebbia",
    condDrizzle: "Pioviggine", condRain: "Pioggia", condSnow: "Neve", condStorm: "Temporale",
    profileTitle: "Il mio profilo", yourName: "Il tuo nome", yourPhone: "Il tuo telefono",
    emergencyContact: "Contatto di emergenza", contactName: "Nome del contatto", contactRelationship: "Parentela",
    contactPhone: "Telefono del contatto", saveProfile: "Salva profilo", callEmergencyContact: "Chiama il contatto di emergenza",
    safetyCatRoof: "Tetti", safetyCatMetal: "Carpenteria metallica", safetyCatFormwork: "Casseforme", safetyCatGround: "Scavi",
    profileTitle: "Il tuo profilo e contatto d'emergenza", yourNameLabel: "Il tuo nome", yourPhoneLabel: "Il tuo telefono",
    employerLabel: "Datore di lavoro / azienda", emergencyContactTitle: "Contatto d'emergenza (familiare)",
    contactNameLabel: "Nome del contatto", contactRelationLabel: "Relazione", contactPhoneLabel: "Telefono del contatto",
    profileHint: "Salvato solo su questo dispositivo.", callContact: "Chiama il contatto d'emergenza",
    safetyCatFall: "Cadute (altezza)", safetyCatExcavation: "Scavi e movimento terra",
    safetyCatScaffolding: "Ponteggio", safetyCatElectrical: "Elettricità e carpenteria metallica",
  },
  es: {
    appLabel: "Registro de obra", onSite: "En obra",
    navToday: "Hoy", navProjects: "Proyectos", navReports: "Informes", navSafety: "Seguridad",
    startYourDay: "Empezar el día", addProjectFirst: "Añade primero un proyecto para fichar.", clockOut: "Fichar salida",
    workingAt: "Trabajando en", tellLog: "Cuéntale al registro qué pasó", tellLogPlaceholder: "ej. usados 8 sacos de cemento, 2 palés de tejas",
    autoSortHint: "Se clasifica automáticamente en Tiempo, Materiales o Herramientas.",
    materials: "Materiales", tools: "Herramientas", photoLabel: "Foto",
    scanDelivery: "Escanear albarán", beforeAfter: "Consumo antes / después",
    pickupCode: "Generar código de recogida para el mayorista", newInspection: "Nueva inspección de tejado",
    todaysTickets: "Registros de hoy", nothingLogged: "Nada registrado todavía.",
    newProjectSite: "Nuevo proyecto / obra", noProjectsYet: "Aún no hay proyectos — añade tu primera obra arriba.",
    entriesLabelFmt: "registros", addAddress: "Añadir dirección", editLabel: "Editar",
    daily: "Diario", monthly: "Mensual", hoursWorked: "Horas trabajadas", materialsLogged: "Materiales registrados",
    toolsLogged: "Herramientas registradas", sitesVisited: "Obras visitadas", sitesLabel: "Obras",
    sendToSupervisor: "Enviar al supervisor", entriesTitle: "Registros",
    sosButton: "SOS — Accidente en la obra", emergencyNumbers: "Números de emergencia",
    fallProtectionTitle: "Trabajos en tejado — protección contra caídas", fullRulesLink: "Normas completas en suva.ch",
    summaryDisclaimer: "Solo un resumen — siempre rige el texto vinculante de SUVA / BauAV, que puede cambiar.",
    ambulance: "Ambulancia", police: "Policía", fire: "Bomberos", generalEmergency: "General (UE)",
    emergencyTitle: "Emergencia", closeAndLog: "Cerrar y registrar",
    notBreathingHint: "¿La persona no respira con normalidad? Pon el teléfono en el suelo y lee en voz alta.",
    back: "Atrás", nextStep: "Siguiente paso",
    cprDisclaimer: "Esto es orientación general de primeros auxilios, no sustituye una formación ni a un sanitario. Llama siempre primero al 144.",
    detectedHint: "Detectado — desmarca lo que esté mal", addToMaterialsLog: "Añadir al registro de materiales",
    readMaterials: "Leer materiales", readingPhoto: "Leyendo la foto…", before: "Antes", after: "Después",
    scanErrorHint: "No se pudo leer la foto con claridad — inténtalo de nuevo o regístralo manualmente.",
    scanTitleSingle: "Escanear albarán", scanTitleCompare: "Consumo antes / después",
    scanHintCompare: "Añade una foto del montón antes del trabajo y otra después — el asistente estimará lo usado.",
    pickupTitle: "Recogida en el mayorista",
    pickupHint: "Introduce el número de pedido o referencia de la factura de tu jefe — en el mostrador lo escanean para liberar la entrega.",
    orderPlaceholder: "Número de pedido / referencia", supplierPlaceholder: "Proveedor / mayorista (opcional)",
    qrLabel: "Código QR", barcodeLabel: "Código de barras", generateCode: "Generar código",
    showScreenHint: "Muestra esta pantalla en el mostrador. Necesita conexión de datos para cargar la imagen del código.", doneLabel: "Listo",
    inspectionTitle: "Inspección de tejado", inspectionPlaceholder: "Describe la inspección — estado, qué estás haciendo, algo destacable…",
    startTimeLabel: "Hora de inicio", ladderLabel: "Escalera (m)", psaLabel: "Número de EPI anticaídas",
    sendToAdvisors: "Enviar a los asesores",
    advisorsHint: "Un asesor de seguridad, un estimador de materiales y un redactor de informes revisarán esto por turnos.",
    logInspection: "Registrar inspección", materialsAlsoLog: "Materiales que también registrar — desmarca lo que esté mal",
    agent1Note: "El asesor de seguridad revisa la protección contra caídas…", agent2Note: "El estimador lee la descripción y las fotos…",
    agent3Note: "Redactando el informe de inspección…", couldntReach: "No se pudo contactar con los asesores — revisa tu conexión e inténtalo de nuevo.",
    newProjectTitle: "Nuevo proyecto", editProjectTitle: "Editar proyecto", projectNameLabel: "Nombre del proyecto",
    clientNameLabel: "Nombre del cliente (opcional)", addressLabel: "Dirección (opcional)", addProjectBtn: "Añadir proyecto", saveLabel: "Guardar",
    addMaterialTitle: "Añadir materiales", addToolTitle: "Añadir herramientas", attachPhotoTitle: "Añadir foto",
    captionPlaceholder: "Descripción (opcional)", whatUsedPlaceholder: "Qué se usó / necesita",
    qtyPlaceholder: "Cant.", unitPlaceholder: "Unidad (sacos, uds...)", logItBtn: "Registrar",
    clockedIn: "Entrada fichada", clockedOutLogged: "Salida fichada y registrada", projectAdded: "Proyecto añadido",
    projectUpdated: "Proyecto actualizado", couldntSave: "No se pudo guardar — inténtalo de nuevo",
    inspectionLogged: "Informe de inspección registrado", pickupLogged: "Código de recogida generado",
    typeTime: "Tiempo", typeMaterial: "Materiales", typeTool: "Herramientas", typeNote: "Nota", typePhoto: "Foto", typePickup: "Recogida", typeInspection: "Inspección",
    cpr1t: "Comprobar", cpr1x: "Toca con firmeza y grita. ¿Sin respuesta, no respira con normalidad? Pasa al siguiente paso.",
    cpr2t: "Llamar primero", cpr2x: "Llama al 144 (ambulancia) antes que nada. Pon el altavoz y deja el teléfono en el suelo.",
    cpr3t: "Posición", cpr3x: "Tumba a la persona boca arriba, sobre una superficie firme. Arrodíllate junto a su pecho.",
    cpr4t: "Posición de las manos", cpr4x: "Dos manos, talón de la palma en el centro del pecho, dedos entrelazados, brazos rectos.",
    cpr5t: "Comprimir", cpr5x: "Empuja fuerte y rápido, unos 5–6 cm de profundidad, a un ritmo de 100–120 por minuto — el ritmo de un corazón acelerado. Deja que el pecho suba del todo entre compresiones.",
    cpr6t: "Continuar", cpr6x: "Sigue con las compresiones sin parar hasta que llegue la ambulancia o la persona respire con normalidad. Si puedes, túrnate con otra persona cada ~2 minutos, sin interrumpir mucho las compresiones.",
    cpr7t: "DEA si hay uno disponible", cpr7x: "Si hay un desfibrilador (DEA) cerca, que alguien lo traiga ya — enciéndelo y sigue sus instrucciones de voz mientras continúan las compresiones.",
    weatherTitle: "Meteorología", weatherAt: "En tu ubicación", weatherLoading: "Localizando…",
    weatherError: "No se pudo obtener el tiempo — comprueba el permiso de ubicación y la conexión.", weatherRefresh: "Actualizar",
    weatherSource: "Datos de MeteoSwiss vía Open-Meteo", windLabel: "Viento",
    changeLocation: "Cambiar ubicación", cityPlaceholder: "Nombre de la ciudad", locationNotFound: "Ubicación no encontrada — prueba otra grafía.",
    copyBtn: "Copiar", suggestionsTitle: "Sugerencias",
    sizePlaceholder: "Tamaño / medida (ej. 5x80, opcional)",
    categoryLabel: "Categoría", projectCatFlat: "Cubierta plana", projectCatPitched: "Cubierta inclinada", projectCatFacade: "Fachada", projectCatOther: "Otro",
    navCalendar: "Calendario", requestLeave: "Solicitar permiso", leaveVacation: "Vacaciones", leaveSick: "Baja por enfermedad", leaveOther: "Otro",
    leaveNotePlaceholder: "Nota (opcional)", statusPending: "Pendiente", statusApproved: "Aprobado", statusDeclined: "Rechazado",
    markApproved: "Marcar como aprobado", markDeclined: "Marcar como rechazado", supervisorContactHeading: "Contacto del supervisor",
    supervisorNameLabel: "Nombre del supervisor", supervisorEmailLabel: "Correo del supervisor", supervisorPhoneLabel: "Teléfono del supervisor",
    sendRequestBtn: "Enviar al supervisor", dayJournalHeading: "Registrado ese día",
    profileInsurance: "Tarjetas de seguro", profileCertificates: "Certificados", addInsuranceCard: "Añadir tarjeta de seguro", addCertificate: "Añadir certificado",
    insuranceTypeLabel: "Tipo (ej. salud, accidentes)", providerLabel: "Aseguradora / empresa", policyNumberLabel: "Número de póliza / tarjeta", insurancePhoneLabel: "Teléfono para siniestros",
    certTitleLabel: "Nombre del certificado", issuerLabel: "Emitido por", issueDateLabel: "Fecha de emisión", expiryDateLabel: "Fecha de caducidad (opcional)",
    deleteLabel: "Eliminar", noDocsYet: "Nada guardado todavía", expiredLabel: "Caducado",
    shareProject: "Compartir proyecto", importProject: "Importar proyecto", projectCodeLabel: "Código del proyecto",
    pasteCodePlaceholder: "Pega aquí el código del proyecto", importBtn: "Añadir a mis proyectos",
    invalidCode: "No se pudo leer ese código — comprueba que lo copiaste completo.",
    shareHint: "Envía este código a tu compañero por WhatsApp o correo — lo pegará en \"Importar proyecto\" en su teléfono.",
    sentReports: "Informes enviados", editReportHint: "Ajusta las horas o añade una nota si algo necesita corrección.",
    hoursFieldLabel: "Horas", notesLabel: "Notas", savePdfBtn: "Guardar como PDF", resendBtn: "Reenviar al supervisor",
    noReportsYet: "Aún no se ha enviado ningún informe", sentOnLabel: "Enviado", editedTag: "Editado", generatedOnLabel: "Generado",
    backupTitle: "Copia de seguridad y restauración", exportBackup: "Exportar copia de seguridad", importBackupBtn: "Restaurar copia de seguridad",
    backupHint: "Copia este código en un lugar seguro (app Notas, correo a ti mismo). Si la app pierde tus datos, pégalo aquí para restaurarlo todo.",
    invalidBackupCode: "No se pudo leer ese código de copia de seguridad.", backupRestored: "Copia de seguridad restaurada",
    charactersLabel: "caracteres",
    condClear: "Despejado", condPartly: "Parcialmente nublado", condCloudy: "Nublado", condFog: "Niebla",
    condDrizzle: "Llovizna", condRain: "Lluvia", condSnow: "Nieve", condStorm: "Tormenta",
    profileTitle: "Mi perfil", yourName: "Tu nombre", yourPhone: "Tu teléfono",
    emergencyContact: "Contacto de emergencia", contactName: "Nombre del contacto", contactRelationship: "Parentesco",
    contactPhone: "Teléfono del contacto", saveProfile: "Guardar perfil", callEmergencyContact: "Llamar al contacto de emergencia",
    safetyCatRoof: "Tejados", safetyCatMetal: "Metalistería", safetyCatFormwork: "Encofrado", safetyCatGround: "Movimiento de tierras",
    profileTitle: "Tu perfil y contacto de emergencia", yourNameLabel: "Tu nombre", yourPhoneLabel: "Tu teléfono",
    employerLabel: "Empleador / empresa", emergencyContactTitle: "Contacto de emergencia (familiar)",
    contactNameLabel: "Nombre del contacto", contactRelationLabel: "Parentesco", contactPhoneLabel: "Teléfono del contacto",
    profileHint: "Se guarda solo en este dispositivo.", callContact: "Llamar al contacto de emergencia",
    safetyCatFall: "Caídas (altura)", safetyCatExcavation: "Excavación y movimiento de tierras",
    safetyCatScaffolding: "Andamios", safetyCatElectrical: "Electricidad y metalistería",
  },
  pt: {
    appLabel: "Registo de obra", onSite: "Na obra",
    navToday: "Hoje", navProjects: "Projetos", navReports: "Relatórios", navSafety: "Segurança",
    startYourDay: "Começar o dia", addProjectFirst: "Adicione primeiro um projeto para picar o ponto.", clockOut: "Picar saída",
    workingAt: "A trabalhar em", tellLog: "Diga ao registo o que aconteceu", tellLogPlaceholder: "ex. usados 8 sacos de cimento, 2 paletes de telhas",
    autoSortHint: "É classificado automaticamente em Tempo, Materiais ou Ferramentas.",
    materials: "Materiais", tools: "Ferramentas", photoLabel: "Foto",
    scanDelivery: "Digitalizar guia de remessa", beforeAfter: "Consumo antes / depois",
    pickupCode: "Gerar código de recolha do grossista", newInspection: "Nova inspeção de telhado",
    todaysTickets: "Registos de hoje", nothingLogged: "Nada registado ainda.",
    newProjectSite: "Novo projeto / obra", noProjectsYet: "Ainda sem projetos — adicione a sua primeira obra acima.",
    entriesLabelFmt: "registos", addAddress: "Adicionar morada", editLabel: "Editar",
    daily: "Diário", monthly: "Mensal", hoursWorked: "Horas trabalhadas", materialsLogged: "Materiais registados",
    toolsLogged: "Ferramentas registadas", sitesVisited: "Obras visitadas", sitesLabel: "Obras",
    sendToSupervisor: "Enviar ao supervisor", entriesTitle: "Registos",
    sosButton: "SOS — Acidente na obra", emergencyNumbers: "Números de emergência",
    fallProtectionTitle: "Trabalho em telhado — proteção antiqueda", fullRulesLink: "Regras completas em suva.ch",
    summaryDisclaimer: "Apenas um resumo — prevalece sempre o texto vinculativo da SUVA / BauAV, que pode mudar.",
    ambulance: "Ambulância", police: "Polícia", fire: "Bombeiros", generalEmergency: "Geral (UE)",
    emergencyTitle: "Emergência", closeAndLog: "Fechar e registar",
    notBreathingHint: "A pessoa não respira normalmente? Pouse o telefone na horizontal e leia em voz alta.",
    back: "Voltar", nextStep: "Passo seguinte",
    cprDisclaimer: "Isto é orientação geral de primeiros socorros, não substitui formação nem um socorrista. Ligue sempre primeiro para o 144.",
    detectedHint: "Detetado — desmarque o que estiver errado", addToMaterialsLog: "Adicionar ao registo de materiais",
    readMaterials: "Ler materiais", readingPhoto: "A ler a foto…", before: "Antes", after: "Depois",
    scanErrorHint: "Não foi possível ler a foto claramente — tente novamente ou registe manualmente.",
    scanTitleSingle: "Digitalizar guia de remessa", scanTitleCompare: "Consumo antes / depois",
    scanHintCompare: "Adicione uma foto da pilha antes do trabalho e outra depois — o assistente estimará o que foi usado.",
    pickupTitle: "Recolha no grossista",
    pickupHint: "Introduza o número de encomenda ou referência da fatura do seu chefe — o balcão digitaliza-o para libertar a entrega.",
    orderPlaceholder: "Número de encomenda / referência", supplierPlaceholder: "Fornecedor / grossista (opcional)",
    qrLabel: "Código QR", barcodeLabel: "Código de barras", generateCode: "Gerar código",
    showScreenHint: "Mostre este ecrã no balcão. Precisa de ligação de dados para carregar a imagem do código.", doneLabel: "Concluído",
    inspectionTitle: "Inspeção de telhado", inspectionPlaceholder: "Descreva a inspeção — condição, o que está a fazer, algo notável…",
    startTimeLabel: "Hora de início", ladderLabel: "Escada (m)", psaLabel: "Número de EPI antiqueda",
    sendToAdvisors: "Enviar aos consultores",
    advisorsHint: "Um consultor de segurança, um estimador de materiais e um redator de relatórios irão rever isto por ordem.",
    logInspection: "Registar inspeção", materialsAlsoLog: "Materiais a registar também — desmarque o que estiver errado",
    agent1Note: "O consultor de segurança está a rever a proteção antiqueda…", agent2Note: "O estimador está a ler a descrição e as fotos…",
    agent3Note: "A compilar o relatório de inspeção…", couldntReach: "Não foi possível contactar os consultores — verifique a ligação e tente novamente.",
    newProjectTitle: "Novo projeto", editProjectTitle: "Editar projeto", projectNameLabel: "Nome do projeto",
    clientNameLabel: "Nome do cliente (opcional)", addressLabel: "Morada (opcional)", addProjectBtn: "Adicionar projeto", saveLabel: "Guardar",
    addMaterialTitle: "Adicionar materiais", addToolTitle: "Adicionar ferramentas", attachPhotoTitle: "Adicionar foto",
    captionPlaceholder: "Legenda (opcional)", whatUsedPlaceholder: "O que foi usado / é necessário",
    qtyPlaceholder: "Qtd", unitPlaceholder: "Unidade (sacos, unid...)", logItBtn: "Registar",
    clockedIn: "Entrada picada", clockedOutLogged: "Saída picada e registada", projectAdded: "Projeto adicionado",
    projectUpdated: "Projeto atualizado", couldntSave: "Não foi possível guardar — tente novamente",
    inspectionLogged: "Relatório de inspeção registado", pickupLogged: "Código de recolha gerado",
    typeTime: "Tempo", typeMaterial: "Materiais", typeTool: "Ferramentas", typeNote: "Nota", typePhoto: "Foto", typePickup: "Recolha", typeInspection: "Inspeção",
    cpr1t: "Verificar", cpr1x: "Toque com firmeza e chame em voz alta. Sem resposta, sem respiração normal? Passe ao passo seguinte.",
    cpr2t: "Ligar primeiro", cpr2x: "Ligue para o 144 (ambulância) antes de mais nada. Ative o alta-voz e pouse o telefone.",
    cpr3t: "Posição", cpr3x: "Deite a pessoa de costas, numa superfície firme. Ajoelhe-se junto ao peito dela.",
    cpr4t: "Posição das mãos", cpr4x: "Duas mãos, base da palma no centro do peito, dedos entrelaçados, braços esticados.",
    cpr5t: "Comprimir", cpr5x: "Empurre com força e rapidez, cerca de 5–6 cm de profundidade, a um ritmo de 100–120 por minuto — o ritmo de um coração acelerado. Deixe o peito subir totalmente entre compressões.",
    cpr6t: "Continuar", cpr6x: "Continue as compressões sem parar até a ambulância chegar ou a pessoa começar a respirar normalmente. Se possível, revezem-se a cada ~2 minutos, sem interromper muito as compressões.",
    cpr7t: "DAE se disponível", cpr7x: "Se houver um desfibrilhador (DAE) por perto, mande alguém buscá-lo — ligue-o e siga as instruções de voz juntamente com as compressões.",
    weatherTitle: "Meteorologia", weatherAt: "No seu local", weatherLoading: "A localizar…",
    weatherError: "Não foi possível obter o tempo — verifique a permissão de localização e a ligação.", weatherRefresh: "Atualizar",
    weatherSource: "Dados da MeteoSwiss via Open-Meteo", windLabel: "Vento",
    changeLocation: "Mudar localização", cityPlaceholder: "Nome da cidade", locationNotFound: "Localização não encontrada — tente outra grafia.",
    copyBtn: "Copiar", suggestionsTitle: "Sugestões",
    sizePlaceholder: "Tamanho / medida (ex. 5x80, opcional)",
    categoryLabel: "Categoria", projectCatFlat: "Telhado plano", projectCatPitched: "Telhado inclinado", projectCatFacade: "Fachada", projectCatOther: "Outro",
    navCalendar: "Calendário", requestLeave: "Solicitar folga", leaveVacation: "Férias", leaveSick: "Baixa médica", leaveOther: "Outro",
    leaveNotePlaceholder: "Nota (opcional)", statusPending: "Pendente", statusApproved: "Aprovado", statusDeclined: "Recusado",
    markApproved: "Marcar como aprovado", markDeclined: "Marcar como recusado", supervisorContactHeading: "Contacto do supervisor",
    supervisorNameLabel: "Nome do supervisor", supervisorEmailLabel: "Email do supervisor", supervisorPhoneLabel: "Telefone do supervisor",
    sendRequestBtn: "Enviar ao supervisor", dayJournalHeading: "Registado nesse dia",
    profileInsurance: "Cartões de seguro", profileCertificates: "Certificados", addInsuranceCard: "Adicionar cartão de seguro", addCertificate: "Adicionar certificado",
    insuranceTypeLabel: "Tipo (ex. saúde, acidentes)", providerLabel: "Seguradora / empresa", policyNumberLabel: "Número de apólice / cartão", insurancePhoneLabel: "Telefone para sinistros",
    certTitleLabel: "Nome do certificado", issuerLabel: "Emitido por", issueDateLabel: "Data de emissão", expiryDateLabel: "Data de validade (opcional)",
    deleteLabel: "Eliminar", noDocsYet: "Ainda nada guardado", expiredLabel: "Expirado",
    shareProject: "Partilhar projeto", importProject: "Importar projeto", projectCodeLabel: "Código do projeto",
    pasteCodePlaceholder: "Cole aqui o código do projeto", importBtn: "Adicionar aos meus projetos",
    invalidCode: "Não foi possível ler esse código — verifique se foi copiado por inteiro.",
    shareHint: "Envie este código à sua equipa por WhatsApp ou email — eles colam em \"Importar projeto\" no telemóvel deles.",
    sentReports: "Relatórios enviados", editReportHint: "Ajuste as horas ou adicione uma nota se algo precisar de correção.",
    hoursFieldLabel: "Horas", notesLabel: "Notas", savePdfBtn: "Guardar como PDF", resendBtn: "Reenviar ao supervisor",
    noReportsYet: "Ainda não foi enviado nenhum relatório", sentOnLabel: "Enviado", editedTag: "Editado", generatedOnLabel: "Gerado",
    backupTitle: "Cópia de segurança e restauro", exportBackup: "Exportar cópia de segurança", importBackupBtn: "Restaurar cópia de segurança",
    backupHint: "Copie este código para um local seguro (app Notas, email para si mesmo). Se a app perder os seus dados, cole-o aqui para restaurar tudo.",
    invalidBackupCode: "Não foi possível ler este código de cópia de segurança.", backupRestored: "Cópia de segurança restaurada",
    charactersLabel: "caracteres",
    condClear: "Céu limpo", condPartly: "Parcialmente nublado", condCloudy: "Nublado", condFog: "Nevoeiro",
    condDrizzle: "Chuvisco", condRain: "Chuva", condSnow: "Neve", condStorm: "Trovoada",
    profileTitle: "O meu perfil", yourName: "O seu nome", yourPhone: "O seu telefone",
    emergencyContact: "Contacto de emergência", contactName: "Nome do contacto", contactRelationship: "Parentesco",
    contactPhone: "Telefone do contacto", saveProfile: "Guardar perfil", callEmergencyContact: "Ligar ao contacto de emergência",
    safetyCatRoof: "Coberturas", safetyCatMetal: "Serralharia", safetyCatFormwork: "Cofragem", safetyCatGround: "Terraplanagem",
    profileTitle: "O seu perfil e contacto de emergência", yourNameLabel: "O seu nome", yourPhoneLabel: "O seu telefone",
    employerLabel: "Empregador / empresa", emergencyContactTitle: "Contacto de emergência (familiar)",
    contactNameLabel: "Nome do contacto", contactRelationLabel: "Relação", contactPhoneLabel: "Telefone do contacto",
    profileHint: "Guardado apenas neste dispositivo.", callContact: "Ligar ao contacto de emergência",
    safetyCatFall: "Quedas (altura)", safetyCatExcavation: "Escavação e terraplenagem",
    safetyCatScaffolding: "Andaime", safetyCatElectrical: "Eletricidade e metalomecânica",
  },
  pl: {
    appLabel: "Dziennik budowy", onSite: "Na budowie",
    navToday: "Dziś", navProjects: "Projekty", navReports: "Raporty", navSafety: "Bezpieczeństwo",
    startYourDay: "Rozpocznij dzień", addProjectFirst: "Najpierw dodaj projekt, aby rozpocząć pracę.", clockOut: "Zakończ pracę",
    workingAt: "Praca na", tellLog: "Powiedz dziennikowi, co się stało", tellLogPlaceholder: "np. zużyto 8 worków cementu, 2 palety dachówki",
    autoSortHint: "Zostanie automatycznie przypisane do Czasu, Materiałów lub Narzędzi.",
    materials: "Materiały", tools: "Narzędzia", photoLabel: "Zdjęcie",
    scanDelivery: "Zeskanuj dokument dostawy", beforeAfter: "Zużycie przed / po",
    pickupCode: "Wygeneruj kod odbioru u hurtownika", newInspection: "Nowa inspekcja dachu",
    todaysTickets: "Dzisiejsze wpisy", nothingLogged: "Jeszcze nic nie zapisano.",
    newProjectSite: "Nowy projekt / budowa", noProjectsYet: "Brak projektów — dodaj swoją pierwszą budowę powyżej.",
    entriesLabelFmt: "zapisanych wpisów", addAddress: "Dodaj adres", editLabel: "Edytuj",
    daily: "Dziennie", monthly: "Miesięcznie", hoursWorked: "Przepracowane godziny", materialsLogged: "Zapisane materiały",
    toolsLogged: "Zapisane narzędzia", sitesVisited: "Odwiedzone budowy", sitesLabel: "Budowy",
    sendToSupervisor: "Wyślij do przełożonego", entriesTitle: "Wpisy",
    sosButton: "SOS — Wypadek na budowie", emergencyNumbers: "Numery alarmowe",
    fallProtectionTitle: "Prace dachowe — podstawy ochrony przed upadkiem", fullRulesLink: "Pełne zasady na suva.ch",
    summaryDisclaimer: "To tylko streszczenie — wiążący jest zawsze oficjalny tekst SUVA / BauAV, który może się zmienić.",
    ambulance: "Pogotowie", police: "Policja", fire: "Straż pożarna", generalEmergency: "Ogólny (UE)",
    emergencyTitle: "Nagły wypadek", closeAndLog: "Zamknij i zapisz",
    notBreathingHint: "Osoba nie oddycha normalnie? Połóż telefon płasko i czytaj na głos.",
    back: "Wstecz", nextStep: "Następny krok",
    cprDisclaimer: "To ogólne wskazówki pierwszej pomocy, nie zastępują szkolenia ani ratownika. Zawsze najpierw zadzwoń pod 144.",
    detectedHint: "Wykryto — odznacz to, co jest błędne", addToMaterialsLog: "Dodaj do dziennika materiałów",
    readMaterials: "Odczytaj materiały", readingPhoto: "Odczytywanie zdjęcia…", before: "Przed", after: "Po",
    scanErrorHint: "Nie udało się wyraźnie odczytać zdjęcia — spróbuj ponownie lub zapisz ręcznie.",
    scanTitleSingle: "Zeskanuj dokument dostawy", scanTitleCompare: "Zużycie przed / po",
    scanHintCompare: "Dodaj zdjęcie stosu przed pracą, a potem po — asystent oszacuje, ile zużyto.",
    pickupTitle: "Odbiór u hurtownika",
    pickupHint: "Wpisz numer zamówienia lub referencji z faktury od przełożonego — na ladzie zeskanują go, aby wydać dostawę.",
    orderPlaceholder: "Numer zamówienia / referencji", supplierPlaceholder: "Dostawca / hurtownik (opcjonalnie)",
    qrLabel: "Kod QR", barcodeLabel: "Kod kreskowy", generateCode: "Wygeneruj kod",
    showScreenHint: "Pokaż ten ekran przy ladzie. Do wczytania obrazu kodu potrzebne jest połączenie z internetem.", doneLabel: "Gotowe",
    inspectionTitle: "Inspekcja dachu", inspectionPlaceholder: "Opisz inspekcję — stan, co robisz, coś istotnego…",
    startTimeLabel: "Godzina rozpoczęcia", ladderLabel: "Drabina (m)", psaLabel: "Liczba uprzęży (PSA)",
    sendToAdvisors: "Wyślij do doradców",
    advisorsHint: "Doradca ds. bezpieczeństwa, szacujący materiały i sporządzający raport przejrzą to po kolei.",
    logInspection: "Zapisz inspekcję", materialsAlsoLog: "Materiały do dodatkowego zapisania — odznacz błędne",
    agent1Note: "Doradca ds. bezpieczeństwa sprawdza ochronę przed upadkiem…", agent2Note: "Szacujący materiały czyta opis i zdjęcia…",
    agent3Note: "Tworzenie raportu z inspekcji…", couldntReach: "Nie udało się połączyć z doradcami — sprawdź połączenie i spróbuj ponownie.",
    newProjectTitle: "Nowy projekt", editProjectTitle: "Edytuj projekt", projectNameLabel: "Nazwa projektu",
    clientNameLabel: "Nazwa klienta (opcjonalnie)", addressLabel: "Adres (opcjonalnie)", addProjectBtn: "Dodaj projekt", saveLabel: "Zapisz",
    addMaterialTitle: "Dodaj materiały", addToolTitle: "Dodaj narzędzia", attachPhotoTitle: "Dodaj zdjęcie",
    captionPlaceholder: "Podpis (opcjonalnie)", whatUsedPlaceholder: "Co zostało użyte / jest potrzebne",
    qtyPlaceholder: "Ilość", unitPlaceholder: "Jednostka (worki, szt...)", logItBtn: "Zapisz",
    clockedIn: "Rozpoczęto pracę", clockedOutLogged: "Zakończono i zapisano", projectAdded: "Dodano projekt",
    projectUpdated: "Zaktualizowano projekt", couldntSave: "Nie udało się zapisać — spróbuj ponownie",
    inspectionLogged: "Zapisano raport z inspekcji", pickupLogged: "Wygenerowano kod odbioru",
    typeTime: "Czas", typeMaterial: "Materiały", typeTool: "Narzędzia", typeNote: "Notatka", typePhoto: "Zdjęcie", typePickup: "Odbiór", typeInspection: "Inspekcja",
    cpr1t: "Sprawdź", cpr1x: "Potrząśnij mocno i głośno zawołaj. Brak reakcji, nienormalny oddech? Przejdź do następnego kroku.",
    cpr2t: "Zadzwoń najpierw", cpr2x: "Zadzwoń pod 144 (pogotowie) zanim zrobisz cokolwiek innego. Włącz głośnomówiący i połóż telefon.",
    cpr3t: "Ułożenie", cpr3x: "Połóż osobę na plecach, na twardym podłożu. Uklęknij przy jej klatce piersiowej.",
    cpr4t: "Ułożenie rąk", cpr4x: "Obie dłonie, nasada dłoni na środku klatki piersiowej, palce splecione, ręce proste.",
    cpr5t: "Uciskaj", cpr5x: "Uciskaj mocno i szybko, na głębokość ok. 5–6 cm, w tempie 100–120 na minutę — tempo szybkiego bicia serca. Pozwól klatce piersiowej w pełni unieść się między uciśnięciami.",
    cpr6t: "Kontynuuj", cpr6x: "Kontynuuj uciski bez przerwy, aż przyjedzie pogotowie lub osoba zacznie oddychać normalnie. Jeśli możesz, zmieniaj się z kimś co ok. 2 minuty, nie przerywając ucisków na długo.",
    cpr7t: "AED, jeśli dostępny", cpr7x: "Jeśli w pobliżu jest defibrylator (AED), wyślij kogoś po niego — włącz go i postępuj zgodnie z instrukcjami głosowymi, kontynuując uciski.",
    weatherTitle: "Pogoda", weatherAt: "W Twojej lokalizacji", weatherLoading: "Ustalanie lokalizacji…",
    weatherError: "Nie udało się pobrać pogody — sprawdź uprawnienia lokalizacji i połączenie.", weatherRefresh: "Odśwież",
    weatherSource: "Dane MeteoSwiss przez Open-Meteo", windLabel: "Wiatr",
    changeLocation: "Zmień lokalizację", cityPlaceholder: "Nazwa miasta", locationNotFound: "Nie znaleziono lokalizacji — spróbuj innej pisowni.",
    copyBtn: "Kopiuj", suggestionsTitle: "Sugestie",
    sizePlaceholder: "Rozmiar / wymiar (np. 5x80, opcjonalnie)",
    categoryLabel: "Kategoria", projectCatFlat: "Dach płaski", projectCatPitched: "Dach skośny", projectCatFacade: "Fasada", projectCatOther: "Inne",
    navCalendar: "Kalendarz", requestLeave: "Złóż wniosek urlopowy", leaveVacation: "Urlop", leaveSick: "Zwolnienie chorobowe", leaveOther: "Inne",
    leaveNotePlaceholder: "Notatka (opcjonalnie)", statusPending: "Oczekuje", statusApproved: "Zaakceptowany", statusDeclined: "Odrzucony",
    markApproved: "Oznacz jako zaakceptowany", markDeclined: "Oznacz jako odrzucony", supervisorContactHeading: "Kontakt do przełożonego",
    supervisorNameLabel: "Imię przełożonego", supervisorEmailLabel: "E-mail przełożonego", supervisorPhoneLabel: "Telefon przełożonego",
    sendRequestBtn: "Wyślij do przełożonego", dayJournalHeading: "Zarejestrowane tego dnia",
    profileInsurance: "Karty ubezpieczeniowe", profileCertificates: "Certyfikaty", addInsuranceCard: "Dodaj kartę ubezpieczeniową", addCertificate: "Dodaj certyfikat",
    insuranceTypeLabel: "Typ (np. zdrowotne, wypadkowe)", providerLabel: "Ubezpieczyciel / firma", policyNumberLabel: "Numer polisy / karty", insurancePhoneLabel: "Telefon do zgłoszeń szkód",
    certTitleLabel: "Nazwa certyfikatu", issuerLabel: "Wydany przez", issueDateLabel: "Data wydania", expiryDateLabel: "Data ważności (opcjonalnie)",
    deleteLabel: "Usuń", noDocsYet: "Jeszcze nic nie zapisano", expiredLabel: "Wygasł",
    shareProject: "Udostępnij projekt", importProject: "Importuj projekt", projectCodeLabel: "Kod projektu",
    pasteCodePlaceholder: "Wklej tutaj kod projektu", importBtn: "Dodaj do moich projektów",
    invalidCode: "Nie udało się odczytać tego kodu — sprawdź, czy skopiowano go w całości.",
    shareHint: "Wyślij ten kod do pracownika przez WhatsApp lub e-mail — wklei go w \"Importuj projekt\" na swoim telefonie.",
    sentReports: "Wysłane raporty", editReportHint: "Popraw godziny lub dodaj notatkę, jeśli coś wymaga korekty.",
    hoursFieldLabel: "Godziny", notesLabel: "Notatki", savePdfBtn: "Zapisz jako PDF", resendBtn: "Wyślij ponownie do przełożonego",
    noReportsYet: "Jeszcze nie wysłano żadnego raportu", sentOnLabel: "Wysłano", editedTag: "Edytowano", generatedOnLabel: "Wygenerowano",
    backupTitle: "Kopia zapasowa i przywracanie", exportBackup: "Eksportuj kopię zapasową", importBackupBtn: "Przywróć z kopii zapasowej",
    backupHint: "Skopiuj ten kod w bezpieczne miejsce (aplikacja Notatki, e-mail do siebie). Jeśli aplikacja kiedykolwiek utraci dane, wklej go tutaj, aby wszystko przywrócić.",
    invalidBackupCode: "Nie udało się odczytać tego kodu kopii zapasowej.", backupRestored: "Przywrócono kopię zapasową",
    charactersLabel: "znaków",
    condClear: "Bezchmurnie", condPartly: "Częściowe zachmurzenie", condCloudy: "Pochmurno", condFog: "Mgła",
    condDrizzle: "Mżawka", condRain: "Deszcz", condSnow: "Śnieg", condStorm: "Burza",
    profileTitle: "Mój profil", yourName: "Twoje imię", yourPhone: "Twój telefon",
    emergencyContact: "Kontakt alarmowy", contactName: "Imię kontaktu", contactRelationship: "Pokrewieństwo",
    contactPhone: "Telefon kontaktu", saveProfile: "Zapisz profil", callEmergencyContact: "Zadzwoń do kontaktu alarmowego",
    safetyCatRoof: "Dekarstwo", safetyCatMetal: "Prace metalowe", safetyCatFormwork: "Deskowanie", safetyCatGround: "Roboty ziemne",
  },
  sk: {
    appLabel: "Denník stavby", onSite: "Na stavbe",
    navToday: "Dnes", navProjects: "Projekty", navReports: "Reporty", navSafety: "Bezpečnosť",
    startYourDay: "Začať deň", addProjectFirst: "Najprv pridajte projekt, aby ste si mohli odpichnúť príchod.", clockOut: "Odpichnúť odchod",
    workingAt: "Práca na", tellLog: "Povedzte denníku, čo sa stalo", tellLogPlaceholder: "napr. použitých 8 vriec cementu, 2 palety škridiel",
    autoSortHint: "Automaticky sa zaradí do Času, Materiálu alebo Náradia.",
    materials: "Materiál", tools: "Náradie", photoLabel: "Fotka",
    scanDelivery: "Naskenovať dodací list", beforeAfter: "Spotreba pred / po",
    pickupCode: "Vygenerovať kód na vyzdvihnutie u veľkoobchodníka", newInspection: "Nová kontrola strechy",
    todaysTickets: "Dnešné záznamy", nothingLogged: "Zatiaľ nič nezaznamenané.",
    newProjectSite: "Nový projekt / stavba", noProjectsYet: "Zatiaľ žiadne projekty — pridajte vyššie svoju prvú stavbu.",
    entriesLabelFmt: "zaznamenaných záznamov", addAddress: "Pridať adresu", editLabel: "Upraviť",
    daily: "Denne", monthly: "Mesačne", hoursWorked: "Odpracované hodiny", materialsLogged: "Zaznamenaný materiál",
    toolsLogged: "Zaznamenané náradie", sitesVisited: "Navštívené stavby", sitesLabel: "Stavby",
    sendToSupervisor: "Odoslať nadriadenému", entriesTitle: "Záznamy",
    sosButton: "SOS — Úraz na stavbe", emergencyNumbers: "Tiesňové čísla",
    fallProtectionTitle: "Práce na streche — základy ochrany proti pádu", fullRulesLink: "Kompletné pravidlá na suva.ch",
    summaryDisclaimer: "Len zhrnutie — vždy platí záväzný text SUVA / BauAV, ktorý sa môže zmeniť.",
    ambulance: "Sanitka", police: "Polícia", fire: "Hasiči", generalEmergency: "Všeobecné (EÚ)",
    emergencyTitle: "Núdzová situácia", closeAndLog: "Zavrieť a zaznamenať",
    notBreathingHint: "Osoba nedýcha normálne? Položte telefón naplocho a čítajte nahlas.",
    back: "Späť", nextStep: "Ďalší krok",
    cprDisclaimer: "Toto je všeobecná príručka prvej pomoci, nenahrádza školenie ani záchranára. Vždy najprv volajte 144.",
    detectedHint: "Rozpoznané — odznačte, čo je nesprávne", addToMaterialsLog: "Pridať do zoznamu materiálu",
    readMaterials: "Rozpoznať materiál", readingPhoto: "Čítanie fotky…", before: "Pred", after: "Po",
    scanErrorHint: "Fotku sa nepodarilo jasne prečítať — skúste znova alebo zaznamenajte ručne.",
    scanTitleSingle: "Naskenovať dodací list", scanTitleCompare: "Spotreba pred / po",
    scanHintCompare: "Pridajte fotku hromady pred prácou a potom po nej — asistent odhadne, čo sa spotrebovalo.",
    pickupTitle: "Vyzdvihnutie u veľkoobchodníka",
    pickupHint: "Zadajte číslo objednávky alebo referenčné číslo z faktúry od nadriadeného — na pulte ho naskenujú a uvoľnia dodávku.",
    orderPlaceholder: "Číslo objednávky / referencie", supplierPlaceholder: "Dodávateľ / veľkoobchodník (voliteľné)",
    qrLabel: "QR kód", barcodeLabel: "Čiarový kód", generateCode: "Vygenerovať kód",
    showScreenHint: "Ukážte túto obrazovku na pulte. Na načítanie obrázka kódu je potrebné pripojenie na internet.", doneLabel: "Hotovo",
    inspectionTitle: "Kontrola strechy", inspectionPlaceholder: "Opíšte kontrolu — stav, čo robíte, čokoľvek pozoruhodné…",
    startTimeLabel: "Čas začiatku", ladderLabel: "Rebrík (m)", psaLabel: "Počet OOPP proti pádu",
    sendToAdvisors: "Odoslať poradcom",
    advisorsHint: "Poradca pre bezpečnosť, odhadca materiálu a autor správy si to postupne prejdú.",
    logInspection: "Zaznamenať kontrolu", materialsAlsoLog: "Materiál na dodatočné zaznamenanie — odznačte nesprávne",
    agent1Note: "Poradca pre bezpečnosť kontroluje ochranu proti pádu…", agent2Note: "Odhadca číta popis a fotky…",
    agent3Note: "Zostavuje sa správa z kontroly…", couldntReach: "Nepodarilo sa spojiť s poradcami — skontrolujte pripojenie a skúste znova.",
    newProjectTitle: "Nový projekt", editProjectTitle: "Upraviť projekt", projectNameLabel: "Názov projektu",
    clientNameLabel: "Meno klienta (voliteľné)", addressLabel: "Adresa (voliteľné)", addProjectBtn: "Pridať projekt", saveLabel: "Uložiť",
    addMaterialTitle: "Pridať materiál", addToolTitle: "Pridať náradie", attachPhotoTitle: "Pridať fotku",
    captionPlaceholder: "Popis (voliteľné)", whatUsedPlaceholder: "Čo bolo použité / potrebné",
    qtyPlaceholder: "Množstvo", unitPlaceholder: "Jednotka (vrecia, ks...)", logItBtn: "Zaznamenať",
    clockedIn: "Príchod odpichnutý", clockedOutLogged: "Odchod odpichnutý a zaznamenaný", projectAdded: "Projekt pridaný",
    projectUpdated: "Projekt aktualizovaný", couldntSave: "Uloženie zlyhalo — skúste znova",
    inspectionLogged: "Správa z kontroly zaznamenaná", pickupLogged: "Kód na vyzdvihnutie vygenerovaný",
    typeTime: "Čas", typeMaterial: "Materiál", typeTool: "Náradie", typeNote: "Poznámka", typePhoto: "Fotka", typePickup: "Vyzdvihnutie", typeInspection: "Kontrola",
    cpr1t: "Skontrolujte", cpr1x: "Rázne zatraste a nahlas oslovte. Žiadna reakcia, nedýcha normálne? Prejdite na ďalší krok.",
    cpr2t: "Najprv volajte", cpr2x: "Najprv zavolajte 144 (sanitku). Zapnite hlasitý odposluch a položte telefón.",
    cpr3t: "Poloha", cpr3x: "Položte osobu na chrbát na pevný podklad. Kľaknite si vedľa jej hrudníka.",
    cpr4t: "Poloha rúk", cpr4x: "Obe ruky, dlaň v strede hrudníka, prsty prepletené, ruky vystreté.",
    cpr5t: "Stláčajte", cpr5x: "Stláčajte silno a rýchlo, do hĺbky asi 5–6 cm, tempom 100–120 za minútu — tempo rýchleho tepu srdca. Medzi stlačeniami nechajte hrudník úplne vystúpiť.",
    cpr6t: "Pokračujte", cpr6x: "Pokračujte v stláčaní bez prestávky, kým nepríde záchranka alebo osoba nezačne dýchať normálne. Ak môžete, striedajte sa s niekým každé ~2 minúty bez dlhého prerušenia stláčania.",
    cpr7t: "AED, ak je k dispozícii", cpr7x: "Ak je nablízku defibrilátor (AED), pošlite po neho niekoho — zapnite ho a postupujte podľa hlasových pokynov popri stláčaní.",
    weatherTitle: "Počasie", weatherAt: "Na vašej polohe", weatherLoading: "Zisťovanie polohy…",
    weatherError: "Nepodarilo sa načítať počasie — skontrolujte povolenie polohy a pripojenie.", weatherRefresh: "Obnoviť",
    weatherSource: "Údaje MeteoSwiss cez Open-Meteo", windLabel: "Vietor",
    changeLocation: "Zmeniť polohu", cityPlaceholder: "Názov mesta", locationNotFound: "Poloha sa nenašla — skúste iný pravopis.",
    copyBtn: "Kopírovať", suggestionsTitle: "Návrhy",
    sizePlaceholder: "Veľkosť / rozmer (napr. 5x80, voliteľné)",
    categoryLabel: "Kategória", projectCatFlat: "Plochá strecha", projectCatPitched: "Šikmá strecha", projectCatFacade: "Fasáda", projectCatOther: "Iné",
    navCalendar: "Kalendár", requestLeave: "Požiadať o voľno", leaveVacation: "Dovolenka", leaveSick: "PN (choroba)", leaveOther: "Iné",
    leaveNotePlaceholder: "Poznámka (voliteľné)", statusPending: "Čaká sa", statusApproved: "Schválené", statusDeclined: "Zamietnuté",
    markApproved: "Označiť ako schválené", markDeclined: "Označiť ako zamietnuté", supervisorContactHeading: "Kontakt na nadriadeného",
    supervisorNameLabel: "Meno nadriadeného", supervisorEmailLabel: "E-mail nadriadeného", supervisorPhoneLabel: "Telefón nadriadeného",
    sendRequestBtn: "Odoslať nadriadenému", dayJournalHeading: "Zaznamenané v tento deň",
    profileInsurance: "Poistné karty", profileCertificates: "Certifikáty", addInsuranceCard: "Pridať poistnú kartu", addCertificate: "Pridať certifikát",
    insuranceTypeLabel: "Typ (napr. zdravotné, úrazové)", providerLabel: "Poisťovňa / firma", policyNumberLabel: "Číslo poistky / karty", insurancePhoneLabel: "Telefón pre hlásenie škody",
    certTitleLabel: "Názov certifikátu", issuerLabel: "Vydal", issueDateLabel: "Dátum vydania", expiryDateLabel: "Dátum platnosti (voliteľné)",
    deleteLabel: "Vymazať", noDocsYet: "Zatiaľ nič nie je uložené", expiredLabel: "Platnosť vypršala",
    shareProject: "Zdieľať projekt", importProject: "Importovať projekt", projectCodeLabel: "Kód projektu",
    pasteCodePlaceholder: "Sem vložte kód projektu", importBtn: "Pridať do mojich projektov",
    invalidCode: "Tento kód sa nepodarilo prečítať — skontrolujte, či bol skopírovaný celý.",
    shareHint: "Pošlite tento kód svojmu zamestnancovi cez WhatsApp alebo e-mail — vloží ho do \"Importovať projekt\" vo svojom telefóne.",
    sentReports: "Odoslané reporty", editReportHint: "Upravte hodiny alebo pridajte poznámku, ak je potrebná oprava.",
    hoursFieldLabel: "Hodiny", notesLabel: "Poznámky", savePdfBtn: "Uložiť ako PDF", resendBtn: "Odoslať znova nadriadenému",
    noReportsYet: "Zatiaľ nebol odoslaný žiadny report", sentOnLabel: "Odoslané", editedTag: "Upravené", generatedOnLabel: "Vygenerované",
    backupTitle: "Záloha a obnovenie", exportBackup: "Exportovať zálohu", importBackupBtn: "Obnoviť zo zálohy",
    backupHint: "Skopírujte tento kód na bezpečné miesto (aplikácia Poznámky, e-mail sebe). Ak aplikácia niekedy stratí vaše dáta, vložte ho sem a obnovte všetko.",
    invalidBackupCode: "Tento záložný kód sa nepodarilo prečítať.", backupRestored: "Záloha obnovená",
    charactersLabel: "znakov",
    condClear: "Jasno", condPartly: "Čiastočne oblačno", condCloudy: "Oblačno", condFog: "Hmla",
    condDrizzle: "Mrholenie", condRain: "Dážď", condSnow: "Sneženie", condStorm: "Búrka",
    profileTitle: "Môj profil", yourName: "Vaše meno", yourPhone: "Váš telefón",
    emergencyContact: "Núdzový kontakt", contactName: "Meno kontaktu", contactRelationship: "Vzťah",
    contactPhone: "Telefón kontaktu", saveProfile: "Uložiť profil", callEmergencyContact: "Zavolať núdzový kontakt",
    safetyCatRoof: "Strešné práce", safetyCatMetal: "Kovovýroba", safetyCatFormwork: "Debnenie", safetyCatGround: "Zemné práce",
  },
  cs: {
    appLabel: "Deník stavby", onSite: "Na stavbě",
    navToday: "Dnes", navProjects: "Projekty", navReports: "Reporty", navSafety: "Bezpečnost",
    startYourDay: "Začít den", addProjectFirst: "Nejprve přidejte projekt, abyste si mohli píchnout příchod.", clockOut: "Píchnout odchod",
    workingAt: "Práce na", tellLog: "Řekněte deníku, co se stalo", tellLogPlaceholder: "např. použito 8 pytlů cementu, 2 palety tašek",
    autoSortHint: "Automaticky se zařadí do Času, Materiálu nebo Nářadí.",
    materials: "Materiál", tools: "Nářadí", photoLabel: "Foto",
    scanDelivery: "Naskenovat dodací list", beforeAfter: "Spotřeba před / po",
    pickupCode: "Vygenerovat kód pro vyzvednutí u velkoobchodu", newInspection: "Nová kontrola střechy",
    todaysTickets: "Dnešní záznamy", nothingLogged: "Zatím nic nezaznamenáno.",
    newProjectSite: "Nový projekt / stavba", noProjectsYet: "Zatím žádné projekty — přidejte výše svou první stavbu.",
    entriesLabelFmt: "zaznamenaných položek", addAddress: "Přidat adresu", editLabel: "Upravit",
    daily: "Denně", monthly: "Měsíčně", hoursWorked: "Odpracované hodiny", materialsLogged: "Zaznamenaný materiál",
    toolsLogged: "Zaznamenané nářadí", sitesVisited: "Navštívené stavby", sitesLabel: "Stavby",
    sendToSupervisor: "Odeslat nadřízenému", entriesTitle: "Záznamy",
    sosButton: "SOS — Úraz na stavbě", emergencyNumbers: "Tísňová čísla",
    fallProtectionTitle: "Práce na střeše — základy ochrany proti pádu", fullRulesLink: "Kompletní pravidla na suva.ch",
    summaryDisclaimer: "Pouze shrnutí — vždy platí závazný text SUVA / BauAV, který se může změnit.",
    ambulance: "Sanitka", police: "Policie", fire: "Hasiči", generalEmergency: "Obecné (EU)",
    emergencyTitle: "Nouzová situace", closeAndLog: "Zavřít a zaznamenat",
    notBreathingHint: "Osoba nedýchá normálně? Položte telefon naplocho a čtěte nahlas.",
    back: "Zpět", nextStep: "Další krok",
    cprDisclaimer: "Toto je obecný návod první pomoci, nenahrazuje školení ani záchranáře. Vždy nejdřív volejte 144.",
    detectedHint: "Rozpoznáno — odškrtněte, co je špatně", addToMaterialsLog: "Přidat do seznamu materiálu",
    readMaterials: "Rozpoznat materiál", readingPhoto: "Čtení fotky…", before: "Před", after: "Po",
    scanErrorHint: "Fotku se nepodařilo jasně přečíst — zkuste to znovu nebo zaznamenejte ručně.",
    scanTitleSingle: "Naskenovat dodací list", scanTitleCompare: "Spotřeba před / po",
    scanHintCompare: "Přidejte fotku hromady před prací a poté po ní — asistent odhadne, co bylo spotřebováno.",
    pickupTitle: "Vyzvednutí u velkoobchodu",
    pickupHint: "Zadejte číslo objednávky nebo reference z faktury od nadřízeného — na pultu ho naskenují a uvolní dodávku.",
    orderPlaceholder: "Číslo objednávky / reference", supplierPlaceholder: "Dodavatel / velkoobchod (volitelné)",
    qrLabel: "QR kód", barcodeLabel: "Čárový kód", generateCode: "Vygenerovat kód",
    showScreenHint: "Ukažte tuto obrazovku na pultu. K načtení obrázku kódu je potřeba datové připojení.", doneLabel: "Hotovo",
    inspectionTitle: "Kontrola střechy", inspectionPlaceholder: "Popište kontrolu — stav, co děláte, cokoliv pozoruhodného…",
    startTimeLabel: "Čas zahájení", ladderLabel: "Žebřík (m)", psaLabel: "Počet OOPP proti pádu",
    sendToAdvisors: "Odeslat poradcům",
    advisorsHint: "Poradce pro bezpečnost, odhadce materiálu a autor zprávy si to postupně projdou.",
    logInspection: "Zaznamenat kontrolu", materialsAlsoLog: "Materiál k dodatečnému zaznamenání — odškrtněte nesprávné",
    agent1Note: "Poradce pro bezpečnost kontroluje ochranu proti pádu…", agent2Note: "Odhadce čte popis a fotky…",
    agent3Note: "Sestavuje se zpráva z kontroly…", couldntReach: "Nepodařilo se spojit s poradci — zkontrolujte připojení a zkuste to znovu.",
    newProjectTitle: "Nový projekt", editProjectTitle: "Upravit projekt", projectNameLabel: "Název projektu",
    clientNameLabel: "Jméno klienta (volitelné)", addressLabel: "Adresa (volitelné)", addProjectBtn: "Přidat projekt", saveLabel: "Uložit",
    addMaterialTitle: "Přidat materiál", addToolTitle: "Přidat nářadí", attachPhotoTitle: "Přidat foto",
    captionPlaceholder: "Popisek (volitelné)", whatUsedPlaceholder: "Co bylo použito / je potřeba",
    qtyPlaceholder: "Množství", unitPlaceholder: "Jednotka (pytle, ks...)", logItBtn: "Zaznamenat",
    clockedIn: "Příchod zaznamenán", clockedOutLogged: "Odchod zaznamenán", projectAdded: "Projekt přidán",
    projectUpdated: "Projekt aktualizován", couldntSave: "Uložení se nezdařilo — zkuste to znovu",
    inspectionLogged: "Zpráva z kontroly zaznamenána", pickupLogged: "Kód pro vyzvednutí vygenerován",
    typeTime: "Čas", typeMaterial: "Materiál", typeTool: "Nářadí", typeNote: "Poznámka", typePhoto: "Foto", typePickup: "Vyzvednutí", typeInspection: "Kontrola",
    cpr1t: "Zkontrolujte", cpr1x: "Důrazně zatřeste a nahlas oslovte. Žádná reakce, nedýchá normálně? Přejděte na další krok.",
    cpr2t: "Nejdřív volejte", cpr2x: "Nejdřív zavolejte 144 (sanitku). Zapněte hlasitý odposlech a položte telefon.",
    cpr3t: "Poloha", cpr3x: "Položte osobu na záda na pevný podklad. Klekněte si vedle jejího hrudníku.",
    cpr4t: "Poloha rukou", cpr4x: "Obě ruce, patou dlaně uprostřed hrudníku, prsty propletené, paže napnuté.",
    cpr5t: "Stlačujte", cpr5x: "Stlačujte silně a rychle, do hloubky asi 5–6 cm, tempem 100–120 za minutu — tempo rychlého tepu srdce. Mezi stlačeními nechte hrudník zcela vystoupit.",
    cpr6t: "Pokračujte", cpr6x: "Pokračujte ve stlačování bez přestávky, dokud nedorazí záchranka nebo osoba nezačne dýchat normálně. Pokud můžete, střídejte se s někým každé ~2 minuty bez dlouhého přerušení stlačování.",
    cpr7t: "AED, pokud je k dispozici", cpr7x: "Pokud je poblíž defibrilátor (AED), pošlete pro něj někoho — zapněte ho a postupujte podle hlasových pokynů souběžně se stlačováním.",
    weatherTitle: "Počasí", weatherAt: "Ve vaší poloze", weatherLoading: "Zjišťování polohy…",
    weatherError: "Nepodařilo se načíst počasí — zkontrolujte oprávnění k poloze a připojení.", weatherRefresh: "Obnovit",
    weatherSource: "Data MeteoSwiss přes Open-Meteo", windLabel: "Vítr",
    changeLocation: "Změnit polohu", cityPlaceholder: "Název města", locationNotFound: "Poloha nebyla nalezena — zkuste jiný pravopis.",
    copyBtn: "Kopírovat", suggestionsTitle: "Návrhy",
    sizePlaceholder: "Velikost / rozměr (např. 5x80, volitelné)",
    categoryLabel: "Kategorie", projectCatFlat: "Plochá střecha", projectCatPitched: "Šikmá střecha", projectCatFacade: "Fasáda", projectCatOther: "Jiné",
    navCalendar: "Kalendář", requestLeave: "Požádat o volno", leaveVacation: "Dovolená", leaveSick: "Nemocenská", leaveOther: "Jiné",
    leaveNotePlaceholder: "Poznámka (volitelné)", statusPending: "Čeká se", statusApproved: "Schváleno", statusDeclined: "Zamítnuto",
    markApproved: "Označit jako schváleno", markDeclined: "Označit jako zamítnuto", supervisorContactHeading: "Kontakt na nadřízeného",
    supervisorNameLabel: "Jméno nadřízeného", supervisorEmailLabel: "E-mail nadřízeného", supervisorPhoneLabel: "Telefon nadřízeného",
    sendRequestBtn: "Odeslat nadřízenému", dayJournalHeading: "Zaznamenáno tento den",
    profileInsurance: "Pojistné karty", profileCertificates: "Certifikáty", addInsuranceCard: "Přidat pojistnou kartu", addCertificate: "Přidat certifikát",
    insuranceTypeLabel: "Typ (např. zdravotní, úrazové)", providerLabel: "Pojišťovna / firma", policyNumberLabel: "Číslo pojistky / karty", insurancePhoneLabel: "Telefon pro hlášení škody",
    certTitleLabel: "Název certifikátu", issuerLabel: "Vydal", issueDateLabel: "Datum vydání", expiryDateLabel: "Datum platnosti (volitelné)",
    deleteLabel: "Smazat", noDocsYet: "Zatím nic není uloženo", expiredLabel: "Platnost vypršela",
    shareProject: "Sdílet projekt", importProject: "Importovat projekt", projectCodeLabel: "Kód projektu",
    pasteCodePlaceholder: "Sem vložte kód projektu", importBtn: "Přidat do mých projektů",
    invalidCode: "Tento kód se nepodařilo přečíst — zkontrolujte, zda byl zkopírován celý.",
    shareHint: "Pošlete tento kód svému zaměstnanci přes WhatsApp nebo e-mail — vloží ho do \"Importovat projekt\" ve svém telefonu.",
    sentReports: "Odeslané reporty", editReportHint: "Upravte hodiny nebo přidejte poznámku, pokud je potřeba oprava.",
    hoursFieldLabel: "Hodiny", notesLabel: "Poznámky", savePdfBtn: "Uložit jako PDF", resendBtn: "Odeslat znovu nadřízenému",
    noReportsYet: "Zatím nebyl odeslán žádný report", sentOnLabel: "Odesláno", editedTag: "Upraveno", generatedOnLabel: "Vygenerováno",
    backupTitle: "Záloha a obnovení", exportBackup: "Exportovat zálohu", importBackupBtn: "Obnovit ze zálohy",
    backupHint: "Zkopírujte tento kód na bezpečné místo (aplikace Poznámky, e-mail sami sobě). Pokud aplikace někdy ztratí vaše data, vložte ho sem a obnovte vše.",
    invalidBackupCode: "Tento záložní kód se nepodařilo přečíst.", backupRestored: "Záloha obnovena",
    charactersLabel: "znaků",
    condClear: "Jasno", condPartly: "Polojasno", condCloudy: "Zataženo", condFog: "Mlha",
    condDrizzle: "Mrholení", condRain: "Déšť", condSnow: "Sněžení", condStorm: "Bouřka",
    profileTitle: "Můj profil", yourName: "Vaše jméno", yourPhone: "Váš telefon",
    emergencyContact: "Nouzový kontakt", contactName: "Jméno kontaktu", contactRelationship: "Vztah",
    contactPhone: "Telefon kontaktu", saveProfile: "Uložit profil", callEmergencyContact: "Zavolat nouzový kontakt",
    safetyCatRoof: "Střešní práce", safetyCatMetal: "Kovovýroba", safetyCatFormwork: "Bednění", safetyCatGround: "Zemní práce",
  },
};

const MATERIALS_CATALOG = {
  en: {
    cats: { wood: "Wood", membranes: "Membranes", metal: "Flashing & metalwork", insulation: "Insulation", fasteners: "Fasteners", covering: "Roof covering", hgc: "HGC (wholesaler)", gabs: "GABS (Spenglerei)", soprema: "Soprema (Liquids)", velux: "Velux (roof windows)", glaromat: "Glaromat (fasteners)", gyso: "Gyso (adhesives & sealants)" },
    items: {
      wood: ["Counter battens", "Battens", "Fascia boards", "Rafters", "Purlins", "Ridge beam", "Roof sheathing boards"],
      membranes: ["Roofing underlay membrane", "Vapour barrier film", "Bitumen underlay felt", "Breather membrane", "Ridge vent tape", "Sealing tape", "Self-adhesive flashing tape"],
      metal: ["Eaves flashing", "Gutters", "Downpipes", "Ridge caps", "Valley flashing", "Wall flashing", "Snow guards"],
      insulation: ["Mineral wool", "EPS insulation board", "PIR insulation board", "XPS insulation board", "Roof insulation batts", "Facade insulation board"],
      fasteners: ["Roofing nails", "Wood screws", "Storm clips", "Sealing washers", "EPDM roofing screws", "Wind clips"],
      covering: ["Ceramic roof tiles", "Concrete roof tiles", "Metal roof tiles", "Bitumen shingles", "Slate tiles", "Standing seam roofing"],
      hgc: ["HGC solid structural timber (KVH)", "HGC glulam beams (BSH)", "HGC cross-laminated timber (BSP)", "HGC formwork panels", "HGC finger-jointed battens", "HGC plasterboard", "HGC mineral wool insulation", "HGC roofing underlay", "HGC EPDM waterproofing membrane", "HGC drywall boards & metal stud profiles", "HGC composite decking boards"],
      gabs: ["GABS gutters", "GABS downpipes", "GABS leaf guard", "GABS chimney cap", "GABS EPDM roof membrane", "GABS drainage channel", "GABS inspection pipe", "GABS gravel guard edging", "GABS lightning protection kit"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  de: {
    cats: { wood: "Holz", membranes: "Membranen", metal: "Spenglerarbeiten", insulation: "Dämmung", fasteners: "Befestigungsmaterial", covering: "Dacheindeckung", hgc: "HGC (Grossist)", gabs: "GABS (Spenglerei)", soprema: "Soprema (Liquids)", velux: "Velux (Dachfenster)", glaromat: "Glaromat (Schrauben)", gyso: "Gyso (Kleben/Dichten/Schützen)" },
    items: {
      wood: ["Konterlatten", "Dachlatten", "Stirnbretter", "Sparren", "Pfetten", "Firstbalken", "Schalungsbretter"],
      membranes: ["Dachunterspannbahn", "Dampfsperrfolie", "Bitumen-Unterdachbahn", "Diffusionsoffene Membrane", "Firstlüftungsband", "Dichtband", "Selbstklebendes Anschlussband"],
      metal: ["Traufblech", "Dachrinnen", "Fallrohre", "Firstziegel", "Kehlblech", "Wandanschlussblech", "Schneefanggitter"],
      insulation: ["Mineralwolle", "EPS-Dämmplatte", "PIR-Dämmplatte", "XPS-Dämmplatte", "Dach-Dämmmatten", "Fassadendämmplatte"],
      fasteners: ["Dachnägel", "Holzschrauben", "Sturmklammern", "Dichtungsscheiben", "Dachschrauben mit EPDM-Dichtung", "Windklammern"],
      covering: ["Tonziegel", "Betonziegel", "Metalldachplatten", "Bitumenschindeln", "Schieferplatten", "Stehfalzblech"],
      hgc: ["HGC Konstruktionsvollholz (KVH)", "HGC Brettschichtholz (BSH)", "HGC Brettsperrholz (BSP)", "HGC Schaltafeln", "HGC keilgezinkte Baulatten", "HGC Gipskartonplatten", "HGC Mineralwolle-Dämmung", "HGC Unterdachbahn", "HGC Dichtungsbahnen EPDM", "HGC Bauplatten & Trockenbauprofile", "HGC Terrassendielen"],
      gabs: ["GABS Dachrinnen", "GABS Fallrohre", "GABS Laubfänger", "GABS Kaminhut", "GABS EPDM-Dachabdichtung", "GABS Entwässerungsrinne", "GABS Kontrollrohr", "GABS Kiesrahmen", "GABS Blitzschutz-Set"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  fr: {
    cats: { wood: "Bois", membranes: "Membranes", metal: "Ferblanterie", insulation: "Isolation", fasteners: "Fixations", covering: "Couverture", hgc: "HGC (grossiste)", gabs: "GABS (ferblanterie)", soprema: "Soprema (Liquids)", velux: "Velux (fenêtres de toit)", glaromat: "Glaromat (vis)", gyso: "Gyso (collage/étanchéité)" },
    items: {
      wood: ["Contre-lattes", "Liteaux", "Planches de rive", "Chevrons", "Pannes", "Poutre faîtière", "Voliges de toiture"],
      membranes: ["Écran de sous-toiture", "Pare-vapeur", "Feutre bitumineux", "Membrane respirante", "Bande de ventilation de faîtage", "Bande d'étanchéité", "Bande de solin autocollante"],
      metal: ["Bande de rive", "Gouttières", "Descentes d'eau pluviale", "Closoirs de faîtage", "Noue", "Solin mural", "Garde-neige"],
      insulation: ["Laine minérale", "Panneau isolant EPS", "Panneau isolant PIR", "Panneau isolant XPS", "Nattes isolantes de toiture", "Panneau isolant de façade"],
      fasteners: ["Clous de couverture", "Vis à bois", "Crochets anti-tempête", "Rondelles d'étanchéité", "Vis de couverture avec joint EPDM", "Agrafes anti-vent"],
      covering: ["Tuiles en terre cuite", "Tuiles en béton", "Tuiles métalliques", "Bardeaux bitumés", "Ardoises", "Couverture en tôle à joint debout"],
      hgc: ["HGC bois massif reconstitué (KVH)", "HGC bois lamellé-collé (BSH)", "HGC bois lamellé-croisé (BSP)", "HGC panneaux de coffrage", "HGC liteaux aboutés", "HGC plaques de plâtre", "HGC isolation laine minérale", "HGC écran de sous-toiture", "HGC membranes d'étanchéité EPDM", "HGC panneaux de construction et profilés pour cloisons", "HGC lames de terrasse"],
      gabs: ["GABS gouttières", "GABS descentes d'eau", "GABS pare-feuilles", "GABS chapeau de cheminée", "GABS membrane de toiture EPDM", "GABS caniveau d'évacuation", "GABS tube de contrôle", "GABS profil garde-gravier", "GABS kit paratonnerre"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  it: {
    cats: { wood: "Legno", membranes: "Membrane", metal: "Lattoneria", insulation: "Isolamento", fasteners: "Fissaggi", covering: "Copertura", hgc: "HGC (grossista)", gabs: "GABS (lattoneria)", soprema: "Soprema (Liquids)", velux: "Velux (finestre per tetti)", glaromat: "Glaromat (viti)", gyso: "Gyso (incollaggio/sigillatura)" },
    items: {
      wood: ["Controlistelli", "Listelli", "Tavole di gronda", "Travetti", "Arcarecci", "Trave di colmo", "Tavolato di copertura"],
      membranes: ["Membrana sottotegola", "Barriera al vapore", "Feltro bituminoso", "Membrana traspirante", "Nastro di ventilazione del colmo", "Nastro sigillante", "Nastro autoadesivo per scossaline"],
      metal: ["Scossalina di gronda", "Grondaie", "Pluviali", "Colmi", "Scossalina di compluvio", "Scossalina murale", "Ferma neve"],
      insulation: ["Lana minerale", "Pannello isolante EPS", "Pannello isolante PIR", "Pannello isolante XPS", "Materassini isolanti da tetto", "Pannello isolante di facciata"],
      fasteners: ["Chiodi per coperture", "Viti per legno", "Ganci antivento", "Rondelle di tenuta", "Viti per coperture con guarnizione EPDM", "Graffe antivento"],
      covering: ["Tegole in cotto", "Tegole in cemento", "Tegole metalliche", "Scandole bituminose", "Ardesia", "Copertura in lamiera aggraffata"],
      hgc: ["HGC legno strutturale massiccio (KVH)", "HGC legno lamellare (BSH)", "HGC legno lamellare incrociato (BSP)", "HGC pannelli da casseforme", "HGC listelli con giunto a pettine", "HGC lastre in cartongesso", "HGC isolamento in lana minerale", "HGC membrana sottotegola", "HGC membrane impermeabilizzanti EPDM", "HGC pannelli da costruzione e profili per cartongesso", "HGC tavole per terrazzo"],
      gabs: ["GABS grondaie", "GABS pluviali", "GABS parafoglie", "GABS comignolo", "GABS membrana per tetto EPDM", "GABS canale di drenaggio", "GABS tubo di ispezione", "GABS profilo paraghiaia", "GABS kit parafulmine"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  es: {
    cats: { wood: "Madera", membranes: "Membranas", metal: "Chapistería", insulation: "Aislamiento", fasteners: "Fijaciones", covering: "Cubierta", hgc: "HGC (mayorista)", gabs: "GABS (chapistería)", soprema: "Soprema (Liquids)", velux: "Velux (ventanas de tejado)", glaromat: "Glaromat (tornillos)", gyso: "Gyso (adhesivos/sellado)" },
    items: {
      wood: ["Contralistones", "Listones", "Tablas de alero", "Cabios", "Correas", "Viga cumbrera", "Tablero de cubierta"],
      membranes: ["Lámina impermeabilizante bajo teja", "Barrera de vapor", "Fieltro bituminoso", "Membrana transpirable", "Cinta de ventilación de cumbrera", "Cinta selladora", "Cinta autoadhesiva de remate"],
      metal: ["Chapa de alero", "Canalones", "Bajantes", "Caballetes de cumbrera", "Chapa de limahoya", "Chapa de remate mural", "Guardanieves"],
      insulation: ["Lana mineral", "Placa aislante EPS", "Placa aislante PIR", "Placa aislante XPS", "Mantas aislantes de cubierta", "Placa aislante de fachada"],
      fasteners: ["Clavos para tejado", "Tornillos para madera", "Grapas antitormenta", "Arandelas de estanqueidad", "Tornillos para tejado con junta EPDM", "Grapas antiviento"],
      covering: ["Tejas cerámicas", "Tejas de hormigón", "Tejas metálicas", "Tejas asfálticas", "Pizarra", "Cubierta de junta alzada"],
      hgc: ["HGC madera maciza estructural (KVH)", "HGC madera laminada encolada (BSH)", "HGC madera contralaminada (BSP)", "HGC paneles de encofrado", "HGC listones dentados", "HGC placas de yeso laminado", "HGC aislamiento de lana mineral", "HGC lámina bajo teja", "HGC membranas impermeabilizantes EPDM", "HGC paneles de construcción y perfiles para tabiquería", "HGC tablas de terraza"],
      gabs: ["GABS canalones", "GABS bajantes", "GABS guardahojas", "GABS sombrerete de chimenea", "GABS membrana de cubierta EPDM", "GABS canal de drenaje", "GABS tubo de inspección", "GABS perfil guardagravilla", "GABS kit pararrayos"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  pt: {
    cats: { wood: "Madeira", membranes: "Membranas", metal: "Serralharia/Latoaria", insulation: "Isolamento", fasteners: "Fixações", covering: "Cobertura", hgc: "HGC (grossista)", gabs: "GABS (latoaria)", soprema: "Soprema (Liquids)", velux: "Velux (janelas de telhado)", glaromat: "Glaromat (parafusos)", gyso: "Gyso (colagem/vedação)" },
    items: {
      wood: ["Contra-ripas", "Ripas", "Táboas de beiral", "Varas/caibros", "Madres", "Viga de cumeeira", "Forro de telhado"],
      membranes: ["Manta sub-telha", "Barreira de vapor", "Feltro betuminoso", "Membrana respirável", "Fita de ventilação de cumeeira", "Fita vedante", "Fita autoadesiva de remate"],
      metal: ["Chapa de beiral", "Caleiras", "Tubos de queda", "Cumeeiras", "Chapa de rincão", "Chapa de remate de parede", "Guarda-neve"],
      insulation: ["Lã mineral", "Placa isolante EPS", "Placa isolante PIR", "Placa isolante XPS", "Mantas isolantes de cobertura", "Placa isolante de fachada"],
      fasteners: ["Pregos para cobertura", "Parafusos para madeira", "Grampos anti-tempestade", "Anilhas de vedação", "Parafusos de cobertura com junta EPDM", "Grampos anti-vento"],
      covering: ["Telhas cerâmicas", "Telhas de betão", "Telhas metálicas", "Telhas asfálticas", "Ardósia", "Cobertura em junta agrafada"],
      hgc: ["HGC madeira maciça estrutural (KVH)", "HGC madeira lamelada colada (BSH)", "HGC madeira lamelada cruzada (BSP)", "HGC painéis de cofragem", "HGC ripas com junta dentada", "HGC placas de gesso cartonado", "HGC isolamento de lã mineral", "HGC manta sub-telha", "HGC membranas impermeabilizantes EPDM", "HGC painéis de construção e perfis para tabique", "HGC tábuas de terraço"],
      gabs: ["GABS caleiras", "GABS tubos de queda", "GABS guarda-folhas", "GABS remate de chaminé", "GABS membrana de cobertura EPDM", "GABS caleira de drenagem", "GABS tubo de inspeção", "GABS perfil guarda-gravilha", "GABS kit para-raios"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  pl: {
    cats: { wood: "Drewno", membranes: "Membrany", metal: "Obróbki blacharskie", insulation: "Izolacja", fasteners: "Łączniki", covering: "Pokrycie dachowe", hgc: "HGC (hurtownia)", gabs: "GABS (blacharstwo)", soprema: "Soprema (Liquids)", velux: "Velux (okna dachowe)", glaromat: "Glaromat (śruby)", gyso: "Gyso (klejenie/uszczelnianie)" },
    items: {
      wood: ["Kontrłaty", "Łaty", "Deski czołowe", "Krokwie", "Płatwie", "Belka kalenicowa", "Deskowanie połaci"],
      membranes: ["Membrana dachowa", "Folia paroizolacyjna", "Papa podkładowa", "Membrana wstępnego krycia", "Taśma kalenicowa wentylacyjna", "Taśma uszczelniająca", "Samoprzylepna taśma obróbkowa"],
      metal: ["Blacha okapowa", "Rynny", "Rury spustowe", "Gąsiory", "Obróbka koszowa", "Obróbka przyścienna", "Płotki przeciwśniegowe"],
      insulation: ["Wełna mineralna", "Płyta styropianowa EPS", "Płyta izolacyjna PIR", "Płyta izolacyjna XPS", "Maty izolacyjne dachowe", "Płyta izolacyjna elewacyjna"],
      fasteners: ["Gwoździe dekarskie", "Wkręty do drewna", "Klamry sztormowe", "Podkładki uszczelniające", "Wkręty dekarskie z podkładką EPDM", "Klamry wiatrowe"],
      covering: ["Dachówka ceramiczna", "Dachówka betonowa", "Blachodachówka", "Gont bitumiczny", "Łupek dachowy", "Pokrycie na rąbek stojący"],
      hgc: ["HGC drewno konstrukcyjne lite (KVH)", "HGC drewno klejone warstwowo (BSH)", "HGC drewno klejone krzyżowo (BSP)", "HGC płyty szalunkowe", "HGC łaty łączone na mikrowczep", "HGC płyty gipsowo-kartonowe", "HGC izolacja z wełny mineralnej", "HGC membrana dachowa podkładowa", "HGC membrany uszczelniające EPDM", "HGC płyty budowlane i profile do zabudowy", "HGC deski tarasowe"],
      gabs: ["GABS rynny", "GABS rury spustowe", "GABS łapacz liści", "GABS czapa kominowa", "GABS membrana dachowa EPDM", "GABS rynna odwadniająca", "GABS rura kontrolna", "GABS profil obrzeżowy na żwir", "GABS zestaw odgromowy"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  sk: {
    cats: { wood: "Drevo", membranes: "Membrány", metal: "Klampiarske práce", insulation: "Izolácia", fasteners: "Spojovací materiál", covering: "Strešná krytina", hgc: "HGC (veľkoobchod)", gabs: "GABS (klampiarstvo)", soprema: "Soprema (Liquids)", velux: "Velux (strešné okná)", glaromat: "Glaromat (skrutky)", gyso: "Gyso (lepenie/tesnenie)" },
    items: {
      wood: ["Kontralaty", "Laty", "Čelné dosky", "Krokvy", "Väznice", "Hrebeňový trám", "Debnenie strechy"],
      membranes: ["Strešná fólia", "Parozábrana", "Asfaltovaný podkladový pás", "Difúzna fólia", "Vetracia páska hrebeňa", "Tesniaca páska", "Samolepiaca lemovacia páska"],
      metal: ["Odkvapový plech", "Odkvapy", "Zvody", "Hrebenáče", "Úžľabinový plech", "Nástenný lem", "Snehové zachytávače"],
      insulation: ["Minerálna vlna", "EPS izolačná doska", "PIR izolačná doska", "XPS izolačná doska", "Strešné izolačné rohože", "Fasádna izolačná doska"],
      fasteners: ["Strešné klince", "Skrutky do dreva", "Búrkové spony", "Tesniace podložky", "Strešné skrutky s EPDM podložkou", "Veterné spony"],
      covering: ["Keramické škridly", "Betónové škridly", "Plechová krytina", "Asfaltové šindle", "Bridlica", "Krytina na stojatú drážku"],
      hgc: ["HGC konštrukčné rezivo (KVH)", "HGC lepené lamelové drevo (BSH)", "HGC krížom lepené drevo (BSP)", "HGC debniace dosky", "HGC laty s ozubeným spojom", "HGC sadrokartónové dosky", "HGC izolácia z minerálnej vlny", "HGC podstrešná fólia", "HGC hydroizolačné membrány EPDM", "HGC stavebné dosky a profily na sadrokartón", "HGC terasové dosky"],
      gabs: ["GABS odkvapy", "GABS zvody", "GABS lapač lístia", "GABS komínová strieška", "GABS strešná membrána EPDM", "GABS odvodňovací žľab", "GABS kontrolná rúra", "GABS okrajový profil na štrk", "GABS bleskozvodná sada"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
  cs: {
    cats: { wood: "Dřevo", membranes: "Membrány", metal: "Klempířské práce", insulation: "Izolace", fasteners: "Spojovací materiál", covering: "Střešní krytina", hgc: "HGC (velkoobchod)", gabs: "GABS (klempířství)", soprema: "Soprema (Liquids)", velux: "Velux (střešní okna)", glaromat: "Glaromat (šrouby)", gyso: "Gyso (lepení/těsnění)" },
    items: {
      wood: ["Kontralatě", "Latě", "Čelní prkna", "Krokve", "Vaznice", "Hřebenový trám", "Bednění střechy"],
      membranes: ["Střešní fólie", "Parozábrana", "Asfaltový podkladní pás", "Difúzní fólie", "Větrací páska hřebene", "Těsnicí páska", "Samolepicí lemovací páska"],
      metal: ["Okapový plech", "Okapy", "Svody", "Hřebenáče", "Úžlabí", "Nástěnný lem", "Sněhové zábrany"],
      insulation: ["Minerální vlna", "EPS izolační deska", "PIR izolační deska", "XPS izolační deska", "Střešní izolační rohože", "Fasádní izolační deska"],
      fasteners: ["Střešní hřebíky", "Vruty do dřeva", "Bouřkové spony", "Těsnicí podložky", "Střešní vruty s EPDM podložkou", "Větrné spony"],
      covering: ["Keramické tašky", "Betonové tašky", "Plechová krytina", "Asfaltové šindele", "Břidlice", "Krytina na stojatou drážku"],
      hgc: ["HGC konstrukční řezivo (KVH)", "HGC lepené lamelové dřevo (BSH)", "HGC křížem lepené dřevo (BSP)", "HGC bednicí desky", "HGC latě s ozubeným spojem", "HGC sádrokartonové desky", "HGC izolace z minerální vlny", "HGC podstřešní fólie", "HGC hydroizolační membrány EPDM", "HGC stavební desky a profily na sádrokarton", "HGC terasová prkna"],
      gabs: ["GABS okapy", "GABS svody", "GABS lapač listí", "GABS komínová stříška", "GABS střešní membrána EPDM", "GABS odvodňovací žlab", "GABS kontrolní trubka", "GABS okrajový profil na štěrk", "GABS sada hromosvodu"],
      soprema: ["Soprema Alsan Epox 133 Zero (154850)", "Soprema Alsan PMMA 170 (99153)", "Soprema Alsan PMMA 573 Handapplication (267942)", "Soprema Alsan PMMA 770 (99162)", "Soprema Alsan PUR 450 (104616)", "Soprema Alsan Flashing Neo (221714)", "Soprema Alsan PUR 500 FT (31548)", "Soprema Alsan Talofix 112 (120467)", "Soprema Alsan Fleece 110 P (41556)", "Soprema Alsan CAT Katalysatorpulver (221170)", "Soprema Alsan Promo (300154)", "Soprema Joint Tape 1 mm (156712)", "Soprema Alsan Surface Cleaner (267611)", "Soprema Alsan Reku P70 (104722)"],
      velux: ["Velux GGL Dachfenster (Holz)", "Velux GGU Dachfenster (Kunststoff)", "Velux GPU Klapp-Schwingfenster", "Velux GVT Ausstiegsfenster (Kaltdach)", "Velux Eindeckrahmen EDW (Ziegel)", "Velux Eindeckrahmen EDL (Flachdachmaterial)", "Velux Eindeckrahmen EDN (Flachziegel)", "Velux Innenfutter BFX", "Velux Dampfsperrschürze BBX", "Velux Dämmrahmen BDX", "Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL", "Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"],
      glaromat: ["Glaromat Karro-Schrauben K18H20 (6.5×20mm, EPDM-Dichtung)", "Glaromat Karro-Schrauben K18SI20 (Chromstahl, EPDM-Dichtung)", "Glaromat Überlappungs-Schrauben UBER4820 (4.8×20mm)", "Glaromat Sechskant-Bauschrauben BAUS12120 (M12×120mm)", "Glaromat Sechskant-Holzschrauben", "Glaromat Glaro TS Holzbohrschraube", "Glaromat Glaro Disc Tellerkopfschraube", "Glaromat Spenglerschrauben", "Glaromat Zimmermannsschrauben", "Glaromat Wellplattenschrauben", "Glaromat Fassadenschrauben", "Glaromat ATF Holzverbinder-Schrauben HSCH5050"],
      gyso: ["Gyso-Top Weld 520 Unterdachfolie", "Gyso-Top Weld Connect (Anschlussformteile)", "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)", "Gyso Polyflex 444 Montagekleber (Art. 70920)", "Gyso Dichtband", "Gyso Klebeband einseitig", "Gyso Fassadenfolie", "Gyso Dampfbremse", "Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Geistlich Ligamenta PU-Klebstoff", "Gyso Abdeckfolie/Schutzfolie"],
    },
  },
};


function cprSteps(t) {
  return [1, 2, 3, 4, 5, 6, 7].map((n) => ({ title: t[`cpr${n}t`], text: t[`cpr${n}x`] }));
}

const SAFETY_RULES_ROOF = [
  { title: "Fall protection is mandatory above 2–3 m", text: "Any roof edge with a drop of more than 2 m (BauAV) generally needs protection; SUVA's own guidance sets the practical threshold at 3 m depending on roof pitch. Collective protection (scaffolding, guardrails, safety nets) always takes priority over personal gear like a harness." },
  { title: "Steeper roofs need more", text: "Above roughly 25–30° pitch a roofer's protection wall (Dachdeckerschutzwand) is required; above 60° a mobile elevating platform or equivalent is typically needed instead of a harness alone." },
  { title: "Skylights and openings", text: "Roof lights and openings aren't reliably break-proof — they need their own additional securing (safety glass, grille, netting), not just general edge protection." },
  { title: "Harness use needs training", text: "Personal fall-arrest gear (PSAgA) may only be used when collective protection genuinely isn't possible, and requires at least basic training in anchor points and use." },
  { title: "Falling material", text: "Protection is also required against tools or material falling from the roof onto people below, not just against people falling." },
];

const SAFETY_RULES_METAL = [
  { title: "Fume extraction when welding or grinding", text: "Welding and cutting metal must use extraction or ventilation plus the required respirator — welding fume is a recognised health hazard, and some fumes carry a cancer risk." },
  { title: "Hands and eyes are the most common injuries", text: "Cut-resistant gloves, welding-rated eyewear, and spark/UV-resistant welder's clothing are minimum kit — fingers, hands and eyes account for most metalwork injuries." },
  { title: "Fall protection applies here too", text: "Assembling steel frames, glass facade elements, or roof flashing at height follows the same fall-protection rules as any other trade — secure yourself and only stand on load-bearing surfaces." },
  { title: "Only trained staff run cranes or rig loads", text: "Craning and rigging loads (including glass and frame elements) requires trained personnel and properly rated lifting gear." },
  { title: "Check for asbestos on pre-1990 material", text: "Before welding, cutting, or grinding older material, confirm whether it contains asbestos and take the required precautions if so." },
];

const SAFETY_RULES_FORMWORK = [
  { title: "Edge protection required above 2 m since 2025", text: "As of 1 January 2025, fall protection is mandatory on slab/deck formwork work above 2 m (the earlier practical exception sat at 3 m). Collective protection — nets, guardrails — is preferred over a harness alone." },
  { title: "Use a platform ladder above 1 m", text: "When fitting props, pour platforms, or edge-protection parts above 1 m, use a podium/platform ladder or similar aid rather than working freestanding." },
  { title: "Fit elements while they're lying flat", text: "Attach props, pour platforms and side-protection parts to formwork panels while they're still on the ground where possible, and only release the crane sling once the element is fully secured." },
  { title: "Prefer systems built from underneath", text: "Formwork systems assembled from below (element or beam-grid systems) avoid working at height entirely and are inherently safer than conventional top-down formwork." },
];

const SAFETY_RULES_GROUND = [
  { title: "Trenches over 1.5 m need shoring or sloping", text: "Any trench, shaft, or excavation deeper than 1.5 m must be shored, sloped, or otherwise secured (BauAV) — this is the threshold SUVA cites, and fatal accidents have happened at depths as shallow as 1.2 m." },
  { title: "Know what's underground before you dig", text: "Existing gas, water, power, or other buried lines must be located and marked before excavation starts." },
  { title: "Keep vehicles and material back from the edge", text: "A safety strip of at least 0.6 m must stay clear at the top edge on both sides, and slopes must never be additionally loaded by vehicles, machinery, or material stockpiles." },
  { title: "Helmets in and around excavations", text: "Hard hats are required in trenches and pits, and anywhere near excavators or heavy earthmoving machinery." },
  { title: "Steep or deep slopes need an engineer's sign-off", text: "Slopes steeper than roughly 45–63° (depending on soil type), deeper than 4 m, or subject to extra load, water, or vibration require a formal stability assessment by a qualified engineer or geotechnician." },
];

const SAFETY_CATEGORIES = [
  { key: "roof", labelKey: "safetyCatRoof", icon: Mountain, rules: SAFETY_RULES_ROOF, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/dacharbeiten-absturzsicherung" },
  { key: "metal", labelKey: "safetyCatMetal", icon: Flame, rules: SAFETY_RULES_METAL, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/arbeitssicherheit-in-gewerbe-und-industrie/metallbearbeitung" },
  { key: "formwork", labelKey: "safetyCatFormwork", icon: HardHat, rules: SAFETY_RULES_FORMWORK, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/absturzsicherung-deckenschalung" },
  { key: "ground", labelKey: "safetyCatGround", icon: Shovel, rules: SAFETY_RULES_GROUND, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/unternehmer-und-kader-baustelle/graeben-schaechte-baugruben" },
];

const SWISS_EMERGENCY_NUMS = ["144", "117", "118", "112"];

const PROJECT_CATEGORIES = [
  { key: "flat", labelKey: "projectCatFlat" },
  { key: "pitched", labelKey: "projectCatPitched" },
  { key: "facade", labelKey: "projectCatFacade" },
  { key: "other", labelKey: "projectCatOther" },
];

function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtHM(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
function mapsUrl(address) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`; }
function encodeProjectCode(project, entries) {
  const items = (entries || [])
    .filter((e) => e.type !== "photo") // keep the code a manageable size — photos aren't included
    .map((e) => ({ type: e.type, description: e.description, qty: e.qty || "", unit: e.unit || "", date: e.date }));
  const payload = { name: project.name, client: project.client || "", address: project.address || "", category: project.category || "flat", entries: items };
  try {
    return "SITE1-" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (e) {
    return "";
  }
}
function extractCode(text, prefix) {
  if (!text) return null;
  const stripped = text.replace(/\s+/g, ""); // strip all whitespace/newlines, e.g. from email line-wrapping
  const re = new RegExp(prefix + "[A-Za-z0-9+/=]+");
  const m = stripped.match(re);
  return m ? m[0] : null;
}
function decodeProjectCode(code) {
  try {
    const found = extractCode(code, "SITE1-");
    if (!found) return null;
    const raw = found.replace(/^SITE1-/, "");
    const obj = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!obj || !obj.name) return null;
    if (!Array.isArray(obj.entries)) obj.entries = [];
    return obj;
  } catch (e) {
    return null;
  }
}
function encodeBackup(obj) {
  try {
    return "BACKUP1-" + btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch (e) {
    return "";
  }
}
function decodeBackup(code) {
  try {
    const found = extractCode(code, "BACKUP1-");
    if (!found) return null;
    const raw = found.replace(/^BACKUP1-/, "");
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch (e) {
    return null;
  }
}

function classifyNote(text) {
  const t = text.toLowerCase();
  if (/(kg|bag|bags|m2|m²|sq m|pallet|szt|piece|pieces|tile|tiles|nail|shingle|membrane|insulation|felt|beam|plank|sack|zement|ciment|cemento|worki|vrec|pytl)/.test(t)) return "material";
  if (/(drill|saw|ladder|nail gun|hammer|scaffold|harness|tool|grinder|compressor|leiter|échelle|scala|escalera|escada|drabina|rebrík|žebřík)/.test(t)) return "tool";
  if (/(hour|hrs|clock|overtime|start|finish|break|off site|stunde|heure|ora|hora|godzin|hodin)/.test(t)) return "time";
  return "note";
}

function typeMeta(type, t) {
  const map = {
    time: { label: t.typeTime, icon: Clock, color: COLORS.accent },
    material: { label: t.typeMaterial, icon: Package, color: COLORS.success },
    tool: { label: t.typeTool, icon: Wrench, color: COLORS.amber },
    note: { label: t.typeNote, icon: MessageSquare, color: COLORS.muted },
    photo: { label: t.typePhoto, icon: Camera, color: "#7FA0C7" },
    pickup: { label: t.typePickup, icon: QrCode, color: "#C9A6F5" },
    inspection: { label: t.typeInspection, icon: ClipboardCheck, color: "#6FB3D9" },
  };
  return map[type];
}

function weatherFromCode(code, t) {
  if (code === 0) return { label: t.condClear, Icon: Sun };
  if (code === 1 || code === 2) return { label: t.condPartly, Icon: CloudSun };
  if (code === 3) return { label: t.condCloudy, Icon: Cloud };
  if (code === 45 || code === 48) return { label: t.condFog, Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: t.condDrizzle, Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: t.condRain, Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: t.condSnow, Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: t.condStorm, Icon: CloudLightning };
  return { label: t.condCloudy, Icon: Cloud };
}

export default function SiteManager() {
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState("de");
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const t = T[lang] || T.en;

  const [tab, setTab] = useState("today");
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [activeClock, setActiveClock] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [newProjectCat, setNewProjectCat] = useState("flat");
  const [shareProjectModal, setShareProjectModal] = useState(null); // project object
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState("");
  const [importError, setImportError] = useState(null);
  const [sentReports, setSentReports] = useState([]);
  const [reportViewModal, setReportViewModal] = useState(null); // report object being viewed/edited
  const [backupModal, setBackupModal] = useState(null); // 'export' | 'import' | null
  const [backupCodeOutput, setBackupCodeOutput] = useState("");
  const [backupCodeInput, setBackupCodeInput] = useState("");
  const [backupError, setBackupError] = useState(null);
  const [newProjectAddr, setNewProjectAddr] = useState("");
  const [addModal, setAddModal] = useState(null);
  const [suggestCat, setSuggestCat] = useState(null);
  const [pendingSuggestion, setPendingSuggestion] = useState(null);
  const [sizeInput, setSizeInput] = useState("");
  const [form, setForm] = useState({ description: "", qty: "", unit: "" });
  const fileRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [reportView, setReportView] = useState("daily");
  const [tick, setTick] = useState(0);
  const [sosOpen, setSosOpen] = useState(false);
  const [cprStep, setCprStep] = useState(0);
  const [scanModal, setScanModal] = useState(null);
  const scanFileRef = useRef(null);
  const [pickupModal, setPickupModal] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [inspectionModal, setInspectionModal] = useState(null);
  const inspectionFileRef = useRef(null);
  const [weather, setWeather] = useState({ loading: false, error: null, data: null });
  const [weatherLoc, setWeatherLoc] = useState({ name: "Zürich", lat: 47.3769, lon: 8.5417 });
  const [weatherEditOpen, setWeatherEditOpen] = useState(false);
  const [weatherCityInput, setWeatherCityInput] = useState("");
  const [safetyCat, setSafetyCat] = useState("roof");
  const [profile, setProfile] = useState({ name: "", phone: "", contactName: "", contactRelationship: "", contactPhone: "", supervisorName: "", supervisorEmail: "", supervisorPhone: "" });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: "vacation", note: "" });
  const [insuranceCards, setInsuranceCards] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [insuranceForm, setInsuranceForm] = useState(null); // {id?, label, provider, policyNumber, phone, photo}
  const [certForm, setCertForm] = useState(null); // {id?, title, issuer, issueDate, expiryDate, photo}
  const docFileRef = useRef(null);
  const certFileRef = useRef(null);
  const backupTextareaRef = useRef(null);
  const [profileDraft, setProfileDraft] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("site-data");
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setProjects(data.projects || []);
          setEntries(data.entries || []);
          setActiveClock(data.activeClock || null);
          setLeaveRequests(data.leaveRequests || []);
          setSentReports(data.sentReports || []);
        }
      } catch (e) {}
      try {
        const langRes = await window.storage.get("site-lang");
        if (langRes && langRes.value && T[langRes.value]) setLang(langRes.value);
      } catch (e) {}
      try {
        const profRes = await window.storage.get("site-profile");
        if (profRes && profRes.value) setProfile(JSON.parse(profRes.value));
      } catch (e) {}
      let loc = { name: "Zürich", lat: 47.3769, lon: 8.5417 };
      try {
        const locRes = await window.storage.get("site-weather-loc");
        if (locRes && locRes.value) loc = JSON.parse(locRes.value);
      } catch (e) {}
      setWeatherLoc(loc);
      try {
        const docsRes = await window.storage.get("site-docs");
        if (docsRes && docsRes.value) {
          const docs = JSON.parse(docsRes.value);
          setInsuranceCards(docs.insurance || []);
          setCertificates(docs.certificates || []);
        }
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) fetchWeather(weatherLoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weatherLoc.lat, weatherLoc.lon]);

  function openProfile() {
    setProfileDraft({ ...profile });
    setProfileModalOpen(true);
  }

  async function saveProfileInfo() {
    setProfile(profileDraft);
    setProfileModalOpen(false);
    try { await window.storage.set("site-profile", JSON.stringify(profileDraft)); } catch (e) {}
  }

  async function saveDocs(next) {
    const data = { insurance: next.insurance ?? insuranceCards, certificates: next.certificates ?? certificates };
    if (next.insurance) setInsuranceCards(next.insurance);
    if (next.certificates) setCertificates(next.certificates);
    try { await window.storage.set("site-docs", JSON.stringify(data)); } catch (e) {}
  }

  function openInsuranceForm(existing) {
    setInsuranceForm(existing ? { ...existing } : { id: null, label: "", provider: "", policyNumber: "", phone: "", photo: null });
  }

  function submitInsurance() {
    if (!insuranceForm) return;
    if (insuranceForm.id) {
      saveDocs({ insurance: insuranceCards.map((c) => (c.id === insuranceForm.id ? insuranceForm : c)) });
    } else {
      saveDocs({ insurance: [...insuranceCards, { ...insuranceForm, id: uid() }] });
    }
    setInsuranceForm(null);
  }

  function deleteInsurance(id) {
    saveDocs({ insurance: insuranceCards.filter((c) => c.id !== id) });
    setInsuranceForm(null);
  }

  function openCertForm(existing) {
    setCertForm(existing ? { ...existing } : { id: null, title: "", issuer: "", issueDate: "", expiryDate: "", photo: null });
  }

  function submitCert() {
    if (!certForm) return;
    if (certForm.id) {
      saveDocs({ certificates: certificates.map((c) => (c.id === certForm.id ? certForm : c)) });
    } else {
      saveDocs({ certificates: [...certificates, { ...certForm, id: uid() }] });
    }
    setCertForm(null);
  }

  function deleteCert(id) {
    saveDocs({ certificates: certificates.filter((c) => c.id !== id) });
    setCertForm(null);
  }

  async function handleDocPhoto(e, setter) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setter((s) => ({ ...s, photo: `data:${file.type || "image/jpeg"};base64,${b64}` }));
    } catch (err) {}
  }

  function openDay(dateStr) {
    setSelectedDay(dateStr);
    const existing = leaveRequests.find((r) => r.date === dateStr);
    setLeaveForm({ type: existing?.type || "vacation", note: existing?.note || "" });
  }

  function submitLeaveRequest() {
    if (!selectedDay) return;
    const existing = leaveRequests.find((r) => r.date === selectedDay);
    let updated;
    if (existing) {
      updated = leaveRequests.map((r) => (r.id === existing.id ? { ...r, type: leaveForm.type, note: leaveForm.note } : r));
    } else {
      updated = [...leaveRequests, { id: uid(), date: selectedDay, type: leaveForm.type, note: leaveForm.note, status: "pending", createdAt: Date.now() }];
    }
    persist({ leaveRequests: updated });
  }

  function setLeaveStatus(id, status) {
    persist({ leaveRequests: leaveRequests.map((r) => (r.id === id ? { ...r, status } : r)) });
  }

  function sendLeaveToSupervisor(request) {
    const typeLabel = request.type === "vacation" ? t.leaveVacation : request.type === "sick" ? t.leaveSick : t.leaveOther;
    const subject = `${t.requestLeave}: ${request.date}`;
    const body = `${profile.name || ""}\n${typeLabel} — ${request.date}\n${request.note || ""}`;
    if (profile.supervisorEmail) {
      window.open(`mailto:${profile.supervisorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    } else if (profile.supervisorPhone) {
      window.open(`https://wa.me/${profile.supervisorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`${subject}\n${body}`)}`, "_blank");
    } else {
      setProfileModalOpen(true);
      setProfileDraft({ ...profile });
    }
  }

  function reportSendText(report) {
    const periodLabel = report.period === "daily" ? t.daily : t.monthly;
    const subject = `${periodLabel} ${t.sendToSupervisor}: ${report.periodLabel}`;
    const body = `${profile.name || ""}\n${t.hoursFieldLabel}: ${report.hours}\n${t.materialsLogged}: ${report.materialsCount}\n${t.toolsLogged}: ${report.toolsCount}\n${t.sitesLabel}: ${report.sitesVisited.join(", ")}${report.notes ? `\n${t.notesLabel}: ${report.notes}` : ""}`;
    return { subject, body };
  }

  function sendReportVia(report) {
    const { subject, body } = reportSendText(report);
    if (profile.supervisorEmail) {
      window.open(`mailto:${profile.supervisorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    } else if (profile.supervisorPhone) {
      window.open(`https://wa.me/${profile.supervisorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`${subject}\n${body}`)}`, "_blank");
    } else {
      setProfileModalOpen(true);
      setProfileDraft({ ...profile });
    }
  }

  function sendReportToSupervisor(view, summary, list) {
    const report = {
      id: uid(),
      period: view,
      periodLabel: view === "daily" ? todayKey() : monthKey(),
      hours: Number(summary.hours.toFixed(2)),
      materialsCount: summary.materials.length,
      toolsCount: summary.tools.length,
      sitesVisited: summary.projIds.map(projectName).filter(Boolean),
      entries: list.map((e) => ({ id: e.id, type: e.type, description: e.description, qty: e.qty || "", unit: e.unit || "", projectName: e.projectId ? projectName(e.projectId) : "" })),
      notes: "",
      sentAt: Date.now(),
      editedAt: null,
    };
    persist({ sentReports: [report, ...sentReports] });
    setReportViewModal(report);
    sendReportVia(report);
  }

  function saveReportEdits() {
    if (!reportViewModal) return;
    const updated = { ...reportViewModal, editedAt: Date.now() };
    persist({ sentReports: sentReports.map((r) => (r.id === updated.id ? updated : r)) });
    setReportViewModal(updated);
    showToast(t.saveProfile);
  }

  function buildReportHtml(report) {
    const periodLabel = report.period === "daily" ? t.daily : t.monthly;
    const rows = report.entries
      .map((e) => {
        const meta = typeMeta(e.type, t);
        const qtyStr = e.qty ? `${e.qty}${e.unit ? " " + e.unit : ""}` : meta.label;
        return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${e.description || ""}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${meta.label}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${qtyStr}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${e.projectName || ""}</td></tr>`;
      })
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.appLabel} — ${periodLabel} ${report.periodLabel}</title>
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; color: #111; padding: 32px; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 20px; margin-bottom: 2px; }
        .sub { color: #666; margin-bottom: 20px; font-size: 14px; }
        .field { margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #333; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
        <h1>${t.appLabel}</h1>
        <div class="sub">${periodLabel} · ${report.periodLabel}</div>
        <div class="field"><strong>${t.yourName}:</strong> ${profile.name || "—"}</div>
        <div class="field"><strong>${t.hoursFieldLabel}:</strong> ${report.hours}</div>
        <div class="field"><strong>${t.materialsLogged}:</strong> ${report.materialsCount}</div>
        <div class="field"><strong>${t.toolsLogged}:</strong> ${report.toolsCount}</div>
        <div class="field"><strong>${t.sitesLabel}:</strong> ${report.sitesVisited.join(", ") || "—"}</div>
        ${report.notes ? `<div class="field"><strong>${t.notesLabel}:</strong> ${report.notes}</div>` : ""}
        <table>
          <thead><tr><th>${t.entriesTitle}</th><th>${t.categoryLabel}</th><th>${t.hoursFieldLabel}/${t.qtyPlaceholder}</th><th>${t.sitesLabel}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">${t.generatedOnLabel}: ${new Date().toLocaleString()}${report.editedAt ? ` · ${t.editedTag}` : ""}</div>
      </body></html>`;
  }

  function saveReportAsPdf(report) {
    try {
      const html = buildReportHtml(report);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      showToast(t.couldntSave);
    }
  }

  function openBackupExport() {
    // Photos (base64 images) are left out — they'd make the code far too long to
    // reliably copy/paste through Notes, email, or messaging apps without truncation.
    const lightEntries = entries.map(({ photo, ...rest }) => rest);
    const lightInsurance = insuranceCards.map(({ photo, ...rest }) => rest);
    const lightCertificates = certificates.map(({ photo, ...rest }) => rest);
    const payload = { projects, entries: lightEntries, leaveRequests, sentReports, profile, insurance: lightInsurance, certificates: lightCertificates, lang };
    const code = encodeBackup(payload);
    setBackupCodeOutput(code);
    setBackupModal("export");
  }

  function openBackupImport() {
    setBackupCodeInput("");
    setBackupError(null);
    setBackupModal("import");
  }

  async function submitBackupImport() {
    const data = decodeBackup(backupCodeInput);
    if (!data) {
      setBackupError(t.invalidBackupCode);
      return;
    }
    const newProjects = data.projects || [];
    const newEntries = data.entries || [];
    const newLeave = data.leaveRequests || [];
    const newReports = data.sentReports || [];
    setProjects(newProjects);
    setEntries(newEntries);
    setLeaveRequests(newLeave);
    setSentReports(newReports);
    try { await window.storage.set("site-data", JSON.stringify({ projects: newProjects, entries: newEntries, activeClock: null, leaveRequests: newLeave, sentReports: newReports })); } catch (e) {}
    if (data.profile) {
      setProfile(data.profile);
      try { await window.storage.set("site-profile", JSON.stringify(data.profile)); } catch (e) {}
    }
    if (data.insurance || data.certificates) {
      const newInsurance = data.insurance || [];
      const newCerts = data.certificates || [];
      setInsuranceCards(newInsurance);
      setCertificates(newCerts);
      try { await window.storage.set("site-docs", JSON.stringify({ insurance: newInsurance, certificates: newCerts })); } catch (e) {}
    }
    setBackupModal(null);
    showToast(t.backupRestored);
  }

  function copyBackupCode() {
    const el = backupTextareaRef.current;
    if (el) {
      el.focus();
      el.select();
      try { el.setSelectionRange(0, backupCodeOutput.length); } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(backupCodeOutput).then(() => showToast(t.copyBtn)).catch(() => showToast(t.copyBtn));
    } else {
      showToast(t.copyBtn);
    }
  }

  async function fetchWeather(loc) {
    setWeather({ loading: true, error: null, data: null });
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto&models=meteoswiss_icon_ch1`);
      const data = await res.json();
      if (!data.current) throw new Error("no data");
      setWeather({ loading: false, error: null, data: data.current });
    } catch (e) {
      try {
        const res2 = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
        const data2 = await res2.json();
        setWeather({ loading: false, error: null, data: data2.current });
      } catch (e2) {
        setWeather({ loading: false, error: t.weatherError, data: null });
      }
    }
  }

  async function submitWeatherCity() {
    if (!weatherCityInput.trim()) return;
    setWeather({ loading: true, error: null, data: null });
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCityInput.trim())}&count=1`);
      const data = await res.json();
      const hit = data.results && data.results[0];
      if (!hit) {
        setWeather({ loading: false, error: t.locationNotFound, data: null });
        return;
      }
      const loc = { name: hit.name, lat: hit.latitude, lon: hit.longitude };
      setWeatherLoc(loc);
      setWeatherEditOpen(false);
      setWeatherCityInput("");
      try { await window.storage.set("site-weather-loc", JSON.stringify(loc)); } catch (e) {}
    } catch (e) {
      setWeather({ loading: false, error: t.locationNotFound, data: null });
    }
  }

  async function changeLang(code) {
    setLang(code);
    setLangPickerOpen(false);
    try { await window.storage.set("site-lang", code); } catch (e) {}
  }

  async function persist(next) {
    const data = {
      projects: next.projects ?? projects,
      entries: next.entries ?? entries,
      activeClock: next.activeClock !== undefined ? next.activeClock : activeClock,
      leaveRequests: next.leaveRequests ?? leaveRequests,
      sentReports: next.sentReports ?? sentReports,
    };
    if (next.projects) setProjects(next.projects);
    if (next.entries) setEntries(next.entries);
    if (next.activeClock !== undefined) setActiveClock(next.activeClock);
    if (next.leaveRequests) setLeaveRequests(next.leaveRequests);
    if (next.sentReports) setSentReports(next.sentReports);
    try {
      await window.storage.set("site-data", JSON.stringify(data));
    } catch (e) {
      showToast(t.couldntSave);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function addEntry(entry) {
    const e = { id: uid(), date: todayKey(), createdAt: Date.now(), ...entry };
    persist({ entries: [e, ...entries] });
  }

  function addProject() {
    if (!newProjectName.trim()) return;
    const p = { id: uid(), name: newProjectName.trim(), client: newProjectClient.trim(), address: newProjectAddr.trim(), category: newProjectCat, createdAt: Date.now() };
    persist({ projects: [p, ...projects] });
    setNewProjectName("");
    setNewProjectClient("");
    setNewProjectAddr("");
    setNewProjectCat("flat");
    setNewProjectOpen(false);
    showToast(t.projectAdded);
  }

  function saveProjectEdit() {
    if (!editProject) return;
    const updated = projects.map((p) => (p.id === editProject.id ? { ...p, name: editProject.name.trim() || p.name, client: editProject.client.trim(), address: editProject.address.trim(), category: editProject.category } : p));
    persist({ projects: updated });
    setEditProject(null);
    showToast(t.projectUpdated);
  }

  function shareProjectVia(project, entriesForProject, channel) {
    const code = encodeProjectCode(project, entriesForProject);
    const text = `${t.shareProject}: ${project.name}${project.address ? " — " + project.address : ""}\n\n${code}`;
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`mailto:?subject=${encodeURIComponent(t.shareProject + ": " + project.name)}&body=${encodeURIComponent(text)}`, "_blank");
    }
  }

  function submitImportProject() {
    const obj = decodeProjectCode(importCodeInput);
    if (!obj) {
      setImportError(t.invalidCode);
      return;
    }
    const p = { id: uid(), name: obj.name, client: obj.client || "", address: obj.address || "", category: obj.category || "flat", createdAt: Date.now() };
    const newEntries = (obj.entries || []).map((e) => ({
      id: uid(),
      date: e.date || todayKey(),
      createdAt: Date.now(),
      type: e.type,
      projectId: p.id,
      description: e.description,
      qty: e.qty,
      unit: e.unit,
    }));
    persist({ projects: [p, ...projects], entries: [...newEntries, ...entries] });
    setImportModalOpen(false);
    setImportCodeInput("");
    setImportError(null);
    showToast(t.projectAdded);
  }

  function clockIn(projectId) {
    if (activeClock) return;
    persist({ activeClock: { projectId, startedAt: Date.now() } });
    showToast(t.clockedIn);
  }

  function clockOut() {
    if (!activeClock) return;
    const durationMs = Date.now() - activeClock.startedAt;
    const e = {
      id: uid(), date: todayKey(), createdAt: Date.now(), type: "time",
      projectId: activeClock.projectId, description: `${fmtHM(durationMs)}`,
      qty: (durationMs / 3600000).toFixed(2), unit: "h",
    };
    persist({ entries: [e, ...entries], activeClock: null });
    showToast(t.clockedOutLogged);
  }

  function submitNote() {
    if (!noteText.trim()) return;
    const type = classifyNote(noteText);
    addEntry({ type, projectId: activeClock?.projectId || null, description: noteText.trim() });
    showToast(typeMeta(type, t).label);
    setNoteText("");
  }

  function openAdd(type, projectId) {
    setForm({ description: "", qty: "", unit: "" });
    setPhotoPreview(null);
    setSuggestCat(null);
    setPendingSuggestion(null);
    setSizeInput("");
    setAddModal({ type, projectId, editingId: null });
  }

  function openEditEntry(entry) {
    setForm({ description: entry.description || "", qty: entry.qty || "", unit: entry.unit || "" });
    setPhotoPreview(entry.photo || null);
    setSuggestCat(null);
    setPendingSuggestion(null);
    setSizeInput("");
    setAddModal({ type: entry.type, projectId: entry.projectId, editingId: entry.id });
  }

  function confirmSuggestion() {
    if (!pendingSuggestion) return;
    const size = sizeInput.trim();
    setForm((f) => ({ ...f, description: size ? `${pendingSuggestion.name} ${size}` : pendingSuggestion.name }));
    setPendingSuggestion(null);
    setSizeInput("");
    setSuggestCat(null);
  }

  function copyEntryFn(entry) {
    addEntry({ type: entry.type, projectId: entry.projectId, description: entry.description, qty: entry.qty, unit: entry.unit });
    showToast(t.projectAdded);
  }

  function submitAdd() {
    if (addModal.type === "photo") {
      if (!photoPreview) return;
      if (addModal.editingId) {
        persist({ entries: entries.map((e) => (e.id === addModal.editingId ? { ...e, description: form.description || t.photoLabel, photo: photoPreview } : e)) });
      } else {
        addEntry({ type: "photo", projectId: addModal.projectId, description: form.description || t.photoLabel, photo: photoPreview });
      }
    } else {
      if (!form.description.trim()) return;
      if (addModal.editingId) {
        persist({ entries: entries.map((e) => (e.id === addModal.editingId ? { ...e, description: form.description.trim(), qty: form.qty, unit: form.unit } : e)) });
      } else {
        addEntry({ type: addModal.type, projectId: addModal.projectId, description: form.description.trim(), qty: form.qty, unit: form.unit });
      }
    }
    setAddModal(null);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function logIncident() {
    addEntry({ type: "note", projectId: activeClock?.projectId || null, description: "SOS" });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
  }

  function openScan(mode) {
    setScanModal({ mode, images: [], items: null, loading: false, error: null, projectId: activeClock?.projectId || projects[0]?.id || null });
  }

  async function addScanImage(e) {
    const file = e.target.files?.[0];
    if (!file || !scanModal) return;
    try {
      const b64 = await fileToBase64(file);
      setScanModal((s) => ({ ...s, images: [...s.images, { b64, mediaType: file.type || "image/jpeg" }], items: null, error: null }));
    } catch {
      setScanModal((s) => ({ ...s, error: t.scanErrorHint }));
    }
  }

  async function callClaude(content) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
    });
    const data = await response.json();
    return (data.content || []).map((b) => b.text || "").join("\n");
  }

  function parseJsonSafe(text, fallback) {
    try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { return fallback; }
  }

  async function runScan() {
    if (!scanModal || scanModal.images.length === 0) return;
    setScanModal((s) => ({ ...s, loading: true, error: null }));
    const isCompare = scanModal.mode === "compare";
    const prompt = isCompare
      ? "The first image is a stack/pallet of construction materials BEFORE work, the second is the SAME stack AFTER work. Estimate how much material was consumed. Respond ONLY with JSON, no markdown, no prose: {\"items\":[{\"name\":string,\"qty\":number,\"unit\":string}]}. Use whole, practical units. If unsure, make a reasonable best guess and keep the list short."
      : "Identify the construction materials visible in this photo (delivery note, pallet, or stacked materials) and estimate quantities. Respond ONLY with JSON: {\"items\":[{\"name\":string,\"qty\":number,\"unit\":string}]}. Keep the list short and practical.";
    try {
      const content = [
        ...scanModal.images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.b64 } })),
        { type: "text", text: prompt },
      ];
      const text = await callClaude(content);
      const parsed = parseJsonSafe(text, { items: [] });
      const items = (parsed.items || []).map((it) => ({ ...it, id: uid(), checked: true }));
      setScanModal((s) => ({ ...s, loading: false, items }));
    } catch (err) {
      setScanModal((s) => ({ ...s, loading: false, error: t.scanErrorHint }));
    }
  }

  function confirmScan() {
    if (!scanModal || !scanModal.items) return;
    const chosen = scanModal.items.filter((i) => i.checked);
    const newEntries = chosen.map((i) => ({ id: uid(), date: todayKey(), createdAt: Date.now(), type: "material", projectId: scanModal.projectId, description: i.name, qty: i.qty, unit: i.unit }));
    persist({ entries: [...newEntries, ...entries] });
    setScanModal(null);
  }

  function openPickup() {
    setPickupModal({ step: "form", orderRef: "", supplier: "", projectId: activeClock?.projectId || projects[0]?.id || null, codeType: "qr" });
  }

  function generatePickupCode() {
    if (!pickupModal || !pickupModal.orderRef.trim()) return;
    addEntry({ type: "pickup", projectId: pickupModal.projectId, description: `${pickupModal.orderRef.trim()}${pickupModal.supplier ? " — " + pickupModal.supplier.trim() : ""}` });
    setPickupModal((s) => ({ ...s, step: "code" }));
  }

  function openInspection() {
    setInspectionModal({
      step: "form", text: "", startTime: new Date().toTimeString().slice(0, 5), ladderLength: "", psaCount: "",
      images: [], projectId: activeClock?.projectId || projects[0]?.id || null, progress: 0, agentNote: "",
      report: null, materials: null, error: null,
    });
  }

  async function addInspectionImage(e) {
    const file = e.target.files?.[0];
    if (!file || !inspectionModal) return;
    try {
      const b64 = await fileToBase64(file);
      setInspectionModal((s) => ({ ...s, images: [...s.images, { b64, mediaType: file.type || "image/jpeg" }] }));
    } catch {
      setInspectionModal((s) => ({ ...s, error: t.scanErrorHint }));
    }
  }

  async function runInspection() {
    if (!inspectionModal || !inspectionModal.text.trim()) return;
    const m = inspectionModal;
    const imageBlocks = m.images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.b64 } }));
    const contextLine = `Roof inspection note: "${m.text.trim()}". Start time: ${m.startTime || "not given"}. Ladder length: ${m.ladderLength || "not given"} m. PSA (fall-arrest) harnesses used: ${m.psaCount || "not given"}.`;
    try {
      setInspectionModal((s) => ({ ...s, step: "running", progress: 1, agentNote: t.agent1Note }));
      const safetyText = await callClaude([{ type: "text", text: `You are a Swiss construction site safety advisor familiar with SUVA and BauAV fall-protection rules. ${contextLine} List 2-5 short, concrete safety observations or compliance notes. Respond ONLY with JSON: {"safety":["...", "..."]}` }]);
      const safety = parseJsonSafe(safetyText, { safety: [] }).safety || [];

      setInspectionModal((s) => ({ ...s, progress: 2, agentNote: t.agent2Note }));
      const materialsText = await callClaude([
        ...imageBlocks,
        { type: "text", text: `You are a materials/tools estimator for a Swiss roofing crew. ${contextLine} Based on the note${imageBlocks.length ? " and attached photo(s)" : ""}, list materials or tools implied or visible. Respond ONLY with JSON: {"materials":[{"name":string,"qty":number,"unit":string}]}. Keep it short and practical.` },
      ]);
      const materials = (parseJsonSafe(materialsText, { materials: [] }).materials || []).map((it) => ({ ...it, id: uid(), checked: true }));

      setInspectionModal((s) => ({ ...s, progress: 3, agentNote: t.agent3Note }));
      const langNames = { en: "English", de: "German", fr: "French", it: "Italian", es: "Spanish", pt: "Portuguese", pl: "Polish", sk: "Slovak", cs: "Czech" };
      const reportText = await callClaude([{ type: "text", text: `Compile a concise roof inspection report for a Swiss roofing company, in ${langNames[lang] || "English"}, plain text, no markdown symbols, under 180 words, with sections: Summary, Safety Notes, Materials, Recommendations. ${contextLine} Safety advisor findings: ${JSON.stringify(safety)}. Materials estimator findings: ${JSON.stringify(materials.map(({ name, qty, unit }) => ({ name, qty, unit })))}.` }]);

      setInspectionModal((s) => ({ ...s, step: "result", report: reportText.trim(), materials, safety }));
    } catch (err) {
      setInspectionModal((s) => ({ ...s, step: "form", error: t.couldntReach }));
    }
  }

  function confirmInspection() {
    if (!inspectionModal || !inspectionModal.report) return;
    const chosenMaterials = (inspectionModal.materials || []).filter((i) => i.checked);
    const newEntries = [
      { id: uid(), date: todayKey(), createdAt: Date.now(), type: "inspection", projectId: inspectionModal.projectId, description: inspectionModal.report },
      ...chosenMaterials.map((i) => ({ id: uid(), date: todayKey(), createdAt: Date.now(), type: "material", projectId: inspectionModal.projectId, description: i.name, qty: i.qty, unit: i.unit })),
    ];
    persist({ entries: [...newEntries, ...entries] });
    showToast(t.inspectionLogged);
    setInspectionModal(null);
  }

  function projectName(id) { return projects.find((p) => p.id === id)?.name || ""; }

  const todayEntries = entries.filter((e) => e.date === todayKey());
  const monthEntries = entries.filter((e) => e.date.slice(0, 7) === monthKey());

  function dailySummary(list) {
    const hours = list.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
    const materials = list.filter((e) => e.type === "material");
    const tools = list.filter((e) => e.type === "tool");
    const projIds = [...new Set(list.map((e) => e.projectId).filter(Boolean))];
    return { hours, materials, tools, projIds };
  }

  if (!ready) {
    return (
      <div style={{ background: COLORS.shell, color: COLORS.muted, height: "100dvh" }} className="w-full h-screen flex items-center justify-center text-sm">
        …
      </div>
    );
  }

  const daily = dailySummary(todayEntries);
  const monthly = dailySummary(monthEntries);
  const CPR_STEPS = cprSteps(t);
  const wCond = weather.data ? weatherFromCode(weather.data.weather_code, t) : null;

  return (
    <div style={{ background: COLORS.shell, color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif", height: "100dvh" }} className="w-full h-screen max-w-md mx-auto flex flex-col relative overflow-hidden">
      <MountainBackground />
      <div style={{ borderBottom: `1px solid ${COLORS.border}` }} className="relative px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <SwissCross size={13} />
            <div style={{ color: COLORS.accent, letterSpacing: "0.15em" }} className="text-xs font-bold uppercase">{t.appLabel}</div>
          </div>
          <div className="text-xl font-black uppercase tracking-tight">{tab === "today" ? t.navToday : tab === "calendar" ? t.navCalendar : tab === "projects" ? t.navProjects : tab === "reports" ? t.navReports : t.navSafety}</div>
        </div>
        <div className="relative flex items-center gap-2">
          {activeClock ? (
            <div style={{ background: "#2E2620", color: COLORS.amber, border: `1px solid ${COLORS.amber}` }} className="text-xs font-bold px-2 py-1 rounded uppercase">{t.onSite}</div>
          ) : null}
          <button onClick={openProfile} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex items-center justify-center w-7 h-7 rounded-full">
            <User size={13} color={COLORS.muted} />
          </button>
          <button onClick={() => setLangPickerOpen(true)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex items-center gap-1 px-2 py-1 rounded-full">
            <Globe size={13} color={COLORS.muted} />
            <span style={{ color: COLORS.muted }} className="text-xs font-bold uppercase">{lang}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accent}`, color: COLORS.text }} className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto px-5 pb-28 pt-4" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
        {tab === "today" && (
          <div className="flex flex-col gap-4">
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.weatherTitle} · {weatherLoc.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setWeatherEditOpen((o) => !o); setWeatherCityInput(""); }} className="text-xs font-bold uppercase" style={{ color: COLORS.accent }}>{t.changeLocation}</button>
                  <button onClick={() => fetchWeather(weatherLoc)}><RefreshCw size={14} color={COLORS.muted} /></button>
                </div>
              </div>
              {weatherEditOpen && (
                <div className="flex gap-2 my-2">
                  <input value={weatherCityInput} onChange={(e) => setWeatherCityInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitWeatherCity()} placeholder={t.cityPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                  <button onClick={submitWeatherCity} style={{ background: COLORS.accent }} className="rounded-lg px-3 flex items-center justify-center"><Check size={16} /></button>
                </div>
              )}
              {weather.loading && <div style={{ color: COLORS.muted }} className="text-sm">{t.weatherLoading}</div>}
              {weather.error && <div style={{ color: COLORS.danger }} className="text-xs">{weather.error}</div>}
              {weather.data && wCond && (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <wCond.Icon size={26} color={COLORS.accent} />
                    <div className="text-2xl font-black">{Math.round(weather.data.temperature_2m)}°C</div>
                    <div style={{ color: COLORS.muted }} className="text-sm">{wCond.label}</div>
                  </div>
                  <div style={{ color: COLORS.muted }} className="text-xs mt-1">{t.windLabel}: {Math.round(weather.data.wind_speed_10m)} km/h</div>
                </>
              )}
              <div style={{ color: COLORS.muted }} className="text-[10px] mt-2">{t.weatherSource}</div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              {activeClock ? (
                <>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">{t.workingAt}</div>
                  <div className="font-bold text-lg mb-3">{projectName(activeClock.projectId)}</div>
                  <div style={{ color: COLORS.accent }} className="text-3xl font-black mb-4 tabular-nums">{fmtHM(Date.now() - activeClock.startedAt)}</div>
                  <button onClick={clockOut} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                    <Square size={16} /> {t.clockOut}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3">{t.startYourDay}</div>
                  {projects.length === 0 ? (
                    <div style={{ color: COLORS.muted }} className="text-sm">{t.addProjectFirst}</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {projects.slice(0, 4).map((p) => (
                        <button key={p.id} onClick={() => clockIn(p.id)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full py-3 px-3 rounded-lg text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2"><Play size={14} color={COLORS.accent} /> {p.name}</span>
                          <ChevronRight size={16} color={COLORS.muted} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={13} /> {t.tellLog}
              </div>
              <div className="flex gap-2">
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitNote()} placeholder={t.tellLogPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                <button onClick={submitNote} style={{ background: COLORS.accent }} className="rounded-lg px-3 flex items-center justify-center"><Send size={16} /></button>
              </div>
              <div style={{ color: COLORS.muted }} className="text-xs mt-2">{t.autoSortHint}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["material", "tool", "photo"].map((ty) => {
                const meta = typeMeta(ty, t);
                const Icon = meta.icon;
                return (
                  <button key={ty} onClick={() => openAdd(ty, activeClock?.projectId || projects[0]?.id)} disabled={projects.length === 0} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, opacity: projects.length === 0 ? 0.4 : 1 }} className="rounded-xl p-3 flex flex-col items-center gap-1">
                    <Icon size={18} color={meta.color} />
                    <span className="text-xs font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openScan("single")} disabled={projects.length === 0} style={{ background: COLORS.card, border: `1px dashed ${COLORS.success}`, opacity: projects.length === 0 ? 0.4 : 1 }} className="rounded-xl p-3 flex flex-col items-center gap-1">
                <ScanLine size={18} color={COLORS.success} />
                <span className="text-xs font-semibold text-center">{t.scanDelivery}</span>
              </button>
              <button onClick={() => openScan("compare")} disabled={projects.length === 0} style={{ background: COLORS.card, border: `1px dashed ${COLORS.success}`, opacity: projects.length === 0 ? 0.4 : 1 }} className="rounded-xl p-3 flex flex-col items-center gap-1">
                <ImagePlus size={18} color={COLORS.success} />
                <span className="text-xs font-semibold text-center">{t.beforeAfter}</span>
              </button>
            </div>

            <button onClick={openPickup} disabled={projects.length === 0} style={{ background: COLORS.card, border: `1px dashed #C9A6F5`, opacity: projects.length === 0 ? 0.4 : 1 }} className="w-full rounded-xl p-3 flex items-center justify-center gap-2">
              <QrCode size={18} color="#C9A6F5" />
              <span className="text-sm font-semibold">{t.pickupCode}</span>
            </button>

            <button onClick={openInspection} disabled={projects.length === 0} style={{ background: COLORS.card, border: `1px dashed #6FB3D9`, opacity: projects.length === 0 ? 0.4 : 1 }} className="w-full rounded-xl p-3 flex items-center justify-center gap-2">
              <ClipboardCheck size={18} color="#6FB3D9" />
              <span className="text-sm font-semibold">{t.newInspection}</span>
            </button>

            <div>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 mt-2">{t.todaysTickets}</div>
              <EntryGroups entries={todayEntries} projectName={projectName} t={t} emptyLabel={t.nothingLogged} />
            </div>
          </div>
        )}

        {tab === "calendar" && (() => {
          const localeMap = { en: "en-US", de: "de-CH", fr: "fr-CH", it: "it-CH", es: "es-ES", pt: "pt-PT", pl: "pl-PL", sk: "sk-SK", cs: "cs-CZ" };
          const locale = localeMap[lang] || "en-US";
          const year = calMonth.getFullYear();
          const month = calMonth.getMonth();
          const monthLabel = calMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
          const firstOfMonth = new Date(year, month, 1);
          const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const weekdayLabels = [0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = new Date(2024, 0, 1 + i); // a known Monday
            return d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 2);
          });
          const pad = (n) => String(n).padStart(2, "0");
          const cells = [];
          for (let i = 0; i < startOffset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          return (
            <div className="flex flex-col gap-4">
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}><ChevronLeft size={18} color={COLORS.muted} /></button>
                  <div className="font-bold text-sm capitalize">{monthLabel}</div>
                  <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}><ChevronRight size={18} color={COLORS.muted} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekdayLabels.map((w, i) => (
                    <div key={i} style={{ color: COLORS.muted }} className="text-center text-[10px] font-bold uppercase">{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d, i) => {
                    if (d === null) return <div key={i} />;
                    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                    const hasEntries = entries.some((e) => e.date === dateStr);
                    const leave = leaveRequests.find((r) => r.date === dateStr);
                    const isToday = dateStr === todayKey();
                    const leaveColor = leave ? (leave.status === "approved" ? COLORS.success : leave.status === "declined" ? COLORS.danger : COLORS.amber) : null;
                    return (
                      <button
                        key={i}
                        onClick={() => openDay(dateStr)}
                        style={{
                          background: leaveColor ? `${leaveColor}22` : COLORS.cardAlt,
                          border: `1px solid ${isToday ? COLORS.accent : leaveColor || COLORS.border}`,
                        }}
                        className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                      >
                        <span style={{ color: isToday ? COLORS.accent : COLORS.text }} className="text-xs font-semibold">{d}</span>
                        {hasEntries && <div style={{ background: COLORS.success }} className="w-1 h-1 rounded-full absolute bottom-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 px-1 text-[10px]" style={{ color: COLORS.muted }}>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.success }} className="w-2 h-2 rounded-full" /> {t.dayJournalHeading}</div>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.amber }} className="w-2 h-2 rounded-full" /> {t.statusPending}</div>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.success }} className="w-2 h-2 rounded-full" /> {t.statusApproved}</div>
              </div>
            </div>
          );
        })()}

        {tab === "projects" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setNewProjectOpen(true)} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Plus size={16} /> {t.newProjectSite}
              </button>
              <button onClick={() => { setImportModalOpen(true); setImportCodeInput(""); setImportError(null); }} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <ClipboardPaste size={16} /> {t.importProject}
              </button>
            </div>
            {projects.map((p) => {
              const pEntries = entries.filter((e) => e.projectId === p.id);
              return (
                <button key={p.id} onClick={() => setSelectedProject(p.id)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold">{p.name}</div>
                      {p.category && (
                        <span style={{ background: COLORS.cardAlt, color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {t[PROJECT_CATEGORIES.find((c) => c.key === p.category)?.labelKey] || p.category}
                        </span>
                      )}
                    </div>
                    {p.client && <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">{p.client}</div>}
                    {p.address && (
                      <a href={mapsUrl(p.address)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: COLORS.accent }} className="text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {p.address}
                      </a>
                    )}
                    <div style={{ color: COLORS.muted }} className="text-xs mt-1">{pEntries.length} {t.entriesLabelFmt}</div>
                  </div>
                  <ChevronRight size={18} color={COLORS.muted} />
                </button>
              );
            })}
            {projects.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm text-center mt-8">{t.noProjectsYet}</div>}
          </div>
        )}

        {tab === "reports" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button onClick={() => setReportView("daily")} style={{ background: reportView === "daily" ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-sm font-bold uppercase">{t.daily}</button>
              <button onClick={() => setReportView("monthly")} style={{ background: reportView === "monthly" ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-sm font-bold uppercase">{t.monthly}</button>
            </div>
            {(() => {
              const s = reportView === "daily" ? daily : monthly;
              const list = reportView === "daily" ? todayEntries : monthEntries;
              return (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3">{reportView === "daily" ? todayKey() : monthKey()}</div>
                  <Stat label={t.hoursWorked} value={s.hours.toFixed(1)} color={COLORS.accent} />
                  <Stat label={t.materialsLogged} value={s.materials.length} color={COLORS.success} />
                  <Stat label={t.toolsLogged} value={s.tools.length} color={COLORS.amber} />
                  <Stat label={t.sitesVisited} value={s.projIds.length} color="#7FA0C7" />
                  <div style={{ color: COLORS.muted }} className="text-xs mt-3 mb-1">{t.sitesLabel}: {s.projIds.map(projectName).join(", ") || "—"}</div>
                  <button onClick={() => sendReportToSupervisor(reportView, s, list)} style={{ background: COLORS.accentDim }} className="w-full mt-3 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                    <FileText size={15} /> {t.sendToSupervisor}
                  </button>
                </div>
              );
            })()}
            <div>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.entriesTitle}</div>
              <EntryGroups entries={reportView === "daily" ? todayEntries : monthEntries} projectName={projectName} t={t} emptyLabel={t.nothingLogged} />
            </div>
            <div>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.sentReports}</div>
              {sentReports.length === 0 ? (
                <div style={{ color: COLORS.muted }} className="text-sm">{t.noReportsYet}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sentReports.map((r) => (
                    <button key={r.id} onClick={() => setReportViewModal(r)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{(r.period === "daily" ? t.daily : t.monthly)} · {r.periodLabel}</div>
                        <div style={{ color: COLORS.muted }} className="text-xs">{r.hours}h{r.editedAt ? ` · ${t.editedTag}` : ""}</div>
                      </div>
                      <ChevronRight size={16} color={COLORS.muted} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "safety" && (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setSosOpen(true); setCprStep(0); }} style={{ background: COLORS.danger }} className="w-full py-5 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-2">
              <Siren size={22} /> {t.sosButton}
            </button>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3 flex items-center gap-1"><Phone size={12} /> {t.emergencyNumbers}</div>
              <div className="grid grid-cols-2 gap-2">
                {[t.ambulance, t.police, t.fire, t.generalEmergency].map((label, i) => (
                  <a key={SWISS_EMERGENCY_NUMS[i]} href={`tel:${SWISS_EMERGENCY_NUMS[i]}`} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg py-3 text-center">
                    <div style={{ color: COLORS.danger }} className="text-2xl font-black">{SWISS_EMERGENCY_NUMS[i]}</div>
                    <div style={{ color: COLORS.muted }} className="text-xs">{label}</div>
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SAFETY_CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const active = safetyCat === cat.key;
                return (
                  <button key={cat.key} onClick={() => setSafetyCat(cat.key)} style={{ background: active ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-lg py-2 px-1 flex flex-col items-center gap-1">
                    <CatIcon size={16} color={active ? "#fff" : COLORS.muted} />
                    <span style={{ color: active ? "#fff" : COLORS.muted }} className="text-[10px] font-bold text-center leading-tight">{t[cat.labelKey]}</span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const cat = SAFETY_CATEGORIES.find((c) => c.key === safetyCat) || SAFETY_CATEGORIES[0];
              const CatIcon = cat.icon;
              return (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3 flex items-center gap-1"><CatIcon size={12} /> {t[cat.labelKey]}</div>
                  <div className="flex flex-col gap-3">
                    {cat.rules.map((r, i) => (
                      <div key={i}>
                        <div className="text-sm font-bold">{r.title}</div>
                        <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">{r.text}</div>
                      </div>
                    ))}
                  </div>
                  <a href={cat.url} target="_blank" rel="noreferrer" style={{ color: COLORS.accent, borderTop: `1px solid ${COLORS.border}` }} className="mt-3 pt-3 text-xs font-bold flex items-center gap-1">
                    {t.fullRulesLink} <ExternalLink size={12} />
                  </a>
                  <div style={{ color: COLORS.muted }} className="text-[10px] mt-2">{t.summaryDisclaimer}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}` }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex">
        {[
          { id: "today", label: t.navToday, icon: Clock },
          { id: "calendar", label: t.navCalendar, icon: CalendarDays },
          { id: "projects", label: t.navProjects, icon: MapPin },
          { id: "reports", label: t.navReports, icon: FileText },
          { id: "safety", label: t.navSafety, icon: ShieldAlert },
        ].map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          const isSafety = it.id === "safety";
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className="flex-1 py-3 flex flex-col items-center gap-1">
              <Icon size={19} color={active ? (isSafety ? COLORS.danger : COLORS.accent) : COLORS.muted} />
              <span style={{ color: active ? (isSafety ? COLORS.danger : COLORS.accent) : COLORS.muted }} className="text-[10px] font-bold uppercase tracking-wide">{it.label}</span>
            </button>
          );
        })}
      </div>

      {langPickerOpen && (
        <Modal onClose={() => setLangPickerOpen(false)} title="Language / Sprache / Langue">
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => changeLang(l.code)} style={{ background: lang === l.code ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg text-sm font-semibold">
                {l.label}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {profileModalOpen && profileDraft && (
        <Modal onClose={() => setProfileModalOpen(false)} title={t.profileTitle}>
          <div className="flex flex-col gap-2">
            <input value={profileDraft.name} onChange={(e) => setProfileDraft((s) => ({ ...s, name: e.target.value }))} placeholder={t.yourName} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.phone} onChange={(e) => setProfileDraft((s) => ({ ...s, phone: e.target.value }))} placeholder={t.yourPhone} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-2 pt-3">{t.emergencyContact}</div>
            <input value={profileDraft.contactName} onChange={(e) => setProfileDraft((s) => ({ ...s, contactName: e.target.value }))} placeholder={t.contactName} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.contactRelationship} onChange={(e) => setProfileDraft((s) => ({ ...s, contactRelationship: e.target.value }))} placeholder={t.contactRelationship} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.contactPhone} onChange={(e) => setProfileDraft((s) => ({ ...s, contactPhone: e.target.value }))} placeholder={t.contactPhone} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-2 pt-3">{t.supervisorContactHeading}</div>
            <input value={profileDraft.supervisorName} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorName: e.target.value }))} placeholder={t.supervisorNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.supervisorEmail} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorEmail: e.target.value }))} placeholder={t.supervisorEmailLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.supervisorPhone} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorPhone: e.target.value }))} placeholder={t.supervisorPhoneLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <button onClick={saveProfileInfo} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveProfile}</button>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3 flex items-center gap-1"><CreditCard size={12} /> {t.profileInsurance}</div>
            <div className="flex flex-col gap-1.5">
              {insuranceCards.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.noDocsYet}</div>}
              {insuranceCards.map((c) => (
                <button key={c.id} onClick={() => openInsuranceForm(c)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.label || c.provider}</div>
                    <div style={{ color: COLORS.muted }} className="text-xs">{c.provider}{c.policyNumber ? ` · ${c.policyNumber}` : ""}</div>
                  </div>
                  <ChevronRight size={16} color={COLORS.muted} />
                </button>
              ))}
              <button onClick={() => openInsuranceForm(null)} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addInsuranceCard}</button>
            </div>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3 flex items-center gap-1"><Award size={12} /> {t.profileCertificates}</div>
            <div className="flex flex-col gap-1.5">
              {certificates.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.noDocsYet}</div>}
              {certificates.map((c) => {
                const expired = c.expiryDate && c.expiryDate < todayKey();
                return (
                  <button key={c.id} onClick={() => openCertForm(c)} style={{ background: COLORS.cardAlt, border: `1px solid ${expired ? COLORS.danger : COLORS.border}` }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div style={{ color: expired ? COLORS.danger : COLORS.muted }} className="text-xs">{c.issuer}{c.expiryDate ? ` · ${expired ? t.expiredLabel + " " : ""}${c.expiryDate}` : ""}</div>
                    </div>
                    <ChevronRight size={16} color={COLORS.muted} />
                  </button>
                );
              })}
              <button onClick={() => openCertForm(null)} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addCertificate}</button>
            </div>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3">{t.backupTitle}</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={openBackupExport} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg text-xs font-bold">{t.exportBackup}</button>
              <button onClick={openBackupImport} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg text-xs font-bold">{t.importBackupBtn}</button>
            </div>
          </div>
        </Modal>
      )}

      {backupModal === "export" && (
        <Modal onClose={() => setBackupModal(null)} title={t.exportBackup}>
          <div className="flex flex-col gap-3">
            <div style={{ color: COLORS.muted }} className="text-xs">{t.backupHint}</div>
            <textarea
              ref={backupTextareaRef}
              readOnly
              value={backupCodeOutput}
              rows={6}
              onFocus={(e) => e.target.select()}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none font-mono"
            />
            <div style={{ color: COLORS.muted }} className="text-[10px]">{backupCodeOutput.length.toLocaleString()} {t.charactersLabel}</div>
            <button onClick={copyBackupCode} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"><Copy size={15} /> {t.copyBtn}</button>
          </div>
        </Modal>
      )}

      {backupModal === "import" && (
        <Modal onClose={() => setBackupModal(null)} title={t.importBackupBtn}>
          <div className="flex flex-col gap-2">
            <textarea
              value={backupCodeInput}
              onChange={(e) => { setBackupCodeInput(e.target.value); setBackupError(null); }}
              placeholder={t.pasteCodePlaceholder}
              rows={6}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none font-mono"
            />
            {backupError && <div style={{ color: COLORS.danger }} className="text-xs">{backupError}</div>}
            <button onClick={submitBackupImport} disabled={!backupCodeInput.trim()} style={{ background: COLORS.accent, opacity: backupCodeInput.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.importBackupBtn}</button>
          </div>
        </Modal>
      )}

      {insuranceForm && (
        <Modal onClose={() => setInsuranceForm(null)} title={t.addInsuranceCard}>
          <div className="flex flex-col gap-2">
            <input value={insuranceForm.label} onChange={(e) => setInsuranceForm((s) => ({ ...s, label: e.target.value }))} placeholder={t.insuranceTypeLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.provider} onChange={(e) => setInsuranceForm((s) => ({ ...s, provider: e.target.value }))} placeholder={t.providerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.policyNumber} onChange={(e) => setInsuranceForm((s) => ({ ...s, policyNumber: e.target.value }))} placeholder={t.policyNumberLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.phone} onChange={(e) => setInsuranceForm((s) => ({ ...s, phone: e.target.value }))} placeholder={t.insurancePhoneLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input ref={docFileRef} type="file" accept="image/*" onChange={(e) => handleDocPhoto(e, setInsuranceForm)} className="hidden" />
            <button onClick={() => docFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-3 rounded-lg flex items-center justify-center gap-2">
              <Camera size={16} color={COLORS.accent} />
              <span style={{ color: COLORS.accent }} className="text-sm font-bold">{t.attachPhotoTitle}</span>
            </button>
            {insuranceForm.photo && <img src={insuranceForm.photo} alt="" className="w-full rounded-lg max-h-40 object-cover" />}
            <button onClick={submitInsurance} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            {insuranceForm.id && <button onClick={() => deleteInsurance(insuranceForm.id)} style={{ color: COLORS.danger }} className="w-full py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"><Trash2 size={13} /> {t.deleteLabel}</button>}
          </div>
        </Modal>
      )}

      {certForm && (
        <Modal onClose={() => setCertForm(null)} title={t.addCertificate}>
          <div className="flex flex-col gap-2">
            <input value={certForm.title} onChange={(e) => setCertForm((s) => ({ ...s, title: e.target.value }))} placeholder={t.certTitleLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={certForm.issuer} onChange={(e) => setCertForm((s) => ({ ...s, issuer: e.target.value }))} placeholder={t.issuerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div className="flex gap-2">
              <input type="date" value={certForm.issueDate} onChange={(e) => setCertForm((s) => ({ ...s, issueDate: e.target.value }))} placeholder={t.issueDateLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm((s) => ({ ...s, expiryDate: e.target.value }))} placeholder={t.expiryDateLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <input ref={certFileRef} type="file" accept="image/*" onChange={(e) => handleDocPhoto(e, setCertForm)} className="hidden" />
            <button onClick={() => certFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-3 rounded-lg flex items-center justify-center gap-2">
              <Camera size={16} color={COLORS.accent} />
              <span style={{ color: COLORS.accent }} className="text-sm font-bold">{t.attachPhotoTitle}</span>
            </button>
            {certForm.photo && <img src={certForm.photo} alt="" className="w-full rounded-lg max-h-40 object-cover" />}
            <button onClick={submitCert} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            {certForm.id && <button onClick={() => deleteCert(certForm.id)} style={{ color: COLORS.danger }} className="w-full py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"><Trash2 size={13} /> {t.deleteLabel}</button>}
          </div>
        </Modal>
      )}

      {selectedDay && (() => {
        const dayEntries = entries.filter((e) => e.date === selectedDay);
        const leave = leaveRequests.find((r) => r.date === selectedDay);
        return (
          <Modal onClose={() => setSelectedDay(null)} title={selectedDay}>
            <div className="flex flex-col gap-4">
              <div>
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.dayJournalHeading}</div>
                <EntryGroups entries={dayEntries} projectName={projectName} t={t} emptyLabel={t.nothingLogged} />
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="pt-4">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1"><CalendarDays size={12} /> {t.requestLeave}</div>
                <div className="flex gap-2 mb-2">
                  {["vacation", "sick", "other"].map((ty) => (
                    <button key={ty} onClick={() => setLeaveForm((f) => ({ ...f, type: ty }))} style={{ background: leaveForm.type === ty ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">
                      {ty === "vacation" ? t.leaveVacation : ty === "sick" ? t.leaveSick : t.leaveOther}
                    </button>
                  ))}
                </div>
                <input value={leaveForm.note} onChange={(e) => setLeaveForm((f) => ({ ...f, note: e.target.value }))} placeholder={t.leaveNotePlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" />
                <button onClick={submitLeaveRequest} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full py-2.5 rounded-lg font-bold uppercase text-xs mb-2">{leave ? t.saveLabel : t.requestLeave}</button>

                {leave && (
                  <div style={{ background: COLORS.cardAlt }} className="rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span style={{ color: leave.status === "approved" ? COLORS.success : leave.status === "declined" ? COLORS.danger : COLORS.amber }} className="text-xs font-bold uppercase">
                        {leave.status === "approved" ? t.statusApproved : leave.status === "declined" ? t.statusDeclined : t.statusPending}
                      </span>
                      <button onClick={() => sendLeaveToSupervisor(leave)} style={{ color: COLORS.accent }} className="text-xs font-bold uppercase flex items-center gap-1"><Mail size={12} /> {t.sendRequestBtn}</button>
                    </div>
                    {leave.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => setLeaveStatus(leave.id, "approved")} style={{ background: COLORS.success }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.markApproved}</button>
                        <button onClick={() => setLeaveStatus(leave.id, "declined")} style={{ background: COLORS.danger }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.markDeclined}</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {selectedProject && (
        <ProjectDetail
          project={projects.find((p) => p.id === selectedProject)}
          entries={entries.filter((e) => e.projectId === selectedProject)}
          onClose={() => setSelectedProject(null)}
          onAdd={(type) => openAdd(type, selectedProject)}
          onEditEntry={openEditEntry}
          onCopyEntry={copyEntryFn}
          onShare={(project, ents) => setShareProjectModal({ project, entries: ents })}
          onEdit={() => {
            const p = projects.find((pr) => pr.id === selectedProject);
            setEditProject({ id: p.id, name: p.name, client: p.client || "", address: p.address || "", category: p.category || "flat" });
          }}
          t={t}
        />
      )}

      {newProjectOpen && (
        <Modal onClose={() => setNewProjectOpen(false)} title={t.newProjectTitle}>
          <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder={t.projectNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)} placeholder={t.clientNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={newProjectAddr} onChange={(e) => setNewProjectAddr(e.target.value)} placeholder={t.addressLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.categoryLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setNewProjectCat(c.key)} style={{ background: newProjectCat === c.key ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                {t[c.labelKey]}
              </button>
            ))}
          </div>
          <button onClick={addProject} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.addProjectBtn}</button>
        </Modal>
      )}

      {editProject && (
        <Modal onClose={() => setEditProject(null)} title={t.editProjectTitle}>
          <input value={editProject.name} onChange={(e) => setEditProject((s) => ({ ...s, name: e.target.value }))} placeholder={t.projectNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={editProject.client} onChange={(e) => setEditProject((s) => ({ ...s, client: e.target.value }))} placeholder={t.clientNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={editProject.address} onChange={(e) => setEditProject((s) => ({ ...s, address: e.target.value }))} placeholder={t.addressLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.categoryLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setEditProject((s) => ({ ...s, category: c.key }))} style={{ background: editProject.category === c.key ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                {t[c.labelKey]}
              </button>
            ))}
          </div>
          <button onClick={saveProjectEdit} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
        </Modal>
      )}

      {shareProjectModal && (
        <Modal onClose={() => setShareProjectModal(null)} title={t.shareProject}>
          <div className="flex flex-col gap-3">
            <div style={{ color: COLORS.muted }} className="text-xs">{t.shareHint}</div>
            <div style={{ color: COLORS.muted }} className="text-xs">
              {shareProjectModal.entries.length} {t.entriesLabelFmt}
            </div>
            <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-3 text-xs break-all font-mono">
              {encodeProjectCode(shareProjectModal.project, shareProjectModal.entries)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => shareProjectVia(shareProjectModal.project, shareProjectModal.entries, "whatsapp")} style={{ background: COLORS.success }} className="py-3 rounded-lg font-bold uppercase text-xs">WhatsApp</button>
              <button onClick={() => shareProjectVia(shareProjectModal.project, shareProjectModal.entries, "email")} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Mail size={14} /> Email</button>
            </div>
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal onClose={() => setImportModalOpen(false)} title={t.importProject}>
          <div className="flex flex-col gap-2">
            <div style={{ color: COLORS.muted }} className="text-xs mb-1">{t.shareHint}</div>
            <textarea
              value={importCodeInput}
              onChange={(e) => { setImportCodeInput(e.target.value); setImportError(null); }}
              placeholder={t.pasteCodePlaceholder}
              rows={3}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono"
            />
            {importError && <div style={{ color: COLORS.danger }} className="text-xs">{importError}</div>}
            <button onClick={submitImportProject} disabled={!importCodeInput.trim()} style={{ background: COLORS.accent, opacity: importCodeInput.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.importBtn}</button>
          </div>
        </Modal>
      )}

      {reportViewModal && (
        <Modal onClose={() => setReportViewModal(null)} title={`${reportViewModal.period === "daily" ? t.daily : t.monthly} · ${reportViewModal.periodLabel}`}>
          <div className="flex flex-col gap-3">
            <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-3">
              <Stat label={t.sitesLabel} value={reportViewModal.sitesVisited.join(", ") || "—"} color={COLORS.text} />
              <Stat label={t.materialsLogged} value={reportViewModal.materialsCount} color={COLORS.success} />
              <Stat label={t.toolsLogged} value={reportViewModal.toolsCount} color={COLORS.amber} />
            </div>
            <div style={{ color: COLORS.muted }} className="text-xs">{t.editReportHint}</div>
            <div className="flex items-center gap-2">
              <span style={{ color: COLORS.muted }} className="text-xs">{t.hoursFieldLabel}</span>
              <input type="number" step="0.1" value={reportViewModal.hours} onChange={(e) => setReportViewModal((r) => ({ ...r, hours: parseFloat(e.target.value) || 0 }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <textarea value={reportViewModal.notes} onChange={(e) => setReportViewModal((r) => ({ ...r, notes: e.target.value }))} placeholder={t.notesLabel} rows={3} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" />
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {reportViewModal.entries.map((e) => {
                const meta = typeMeta(e.type, t);
                return (
                  <div key={e.id} style={{ background: COLORS.cardAlt }} className="rounded-lg px-3 py-2 text-xs flex justify-between">
                    <span>{e.description}</span>
                    <span style={{ color: COLORS.muted }}>{e.qty ? `${e.qty}${e.unit ? " " + e.unit : ""}` : meta.label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={saveReportEdits} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => saveReportAsPdf(reportViewModal)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Printer size={14} /> {t.savePdfBtn}</button>
              <button onClick={() => sendReportVia(reportViewModal)} style={{ background: COLORS.accentDim }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Send size={14} /> {t.resendBtn}</button>
            </div>
          </div>
        </Modal>
      )}

      {addModal && (
        <Modal onClose={() => setAddModal(null)} title={addModal.editingId ? t.editLabel : (addModal.type === "material" ? t.addMaterialTitle : addModal.type === "tool" ? t.addToolTitle : t.attachPhotoTitle)}>
          {addModal.type === "photo" ? (
            <div className="flex flex-col gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-6 rounded-xl flex flex-col items-center gap-2">
                <Camera size={22} color={COLORS.accent} />
                <span style={{ color: COLORS.accent }} className="text-sm font-bold">{t.attachPhotoTitle}</span>
              </button>
              {photoPreview && <img src={photoPreview} alt="preview" className="w-full rounded-lg max-h-48 object-cover" />}
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.captionPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.whatUsedPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />

              {addModal.type === "material" && (() => {
                const catalog = MATERIALS_CATALOG[lang] || MATERIALS_CATALOG.en;
                const q = form.description.trim().toLowerCase();
                const scopedItems = suggestCat
                  ? catalog.items[suggestCat].map((name) => ({ name, catKey: suggestCat }))
                  : Object.entries(catalog.items).flatMap(([catKey, arr]) => arr.map((name) => ({ name, catKey })));
                const list = q.length > 0 ? scopedItems.filter((i) => i.name.toLowerCase().includes(q)).slice(0, suggestCat ? 20 : 6) : scopedItems.slice(0, suggestCat ? 20 : 0);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Object.entries(catalog.cats).map(([key, label]) => (
                        <button key={key} onClick={() => setSuggestCat((c) => (c === key ? null : key))} style={{ background: suggestCat === key ? COLORS.success : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap">
                          {label}
                        </button>
                      ))}
                    </div>
                    {pendingSuggestion ? (
                      <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.success}` }} className="rounded-lg p-2.5 flex flex-col gap-2">
                        <div className="text-xs font-semibold">{pendingSuggestion.name}</div>
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={sizeInput}
                            onChange={(e) => setSizeInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmSuggestion()}
                            placeholder={t.sizePlaceholder}
                            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                          />
                          <button onClick={confirmSuggestion} style={{ background: COLORS.success }} className="rounded-lg px-3 flex items-center justify-center"><Check size={16} /></button>
                          <button onClick={() => { setPendingSuggestion(null); setSizeInput(""); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg px-3 flex items-center justify-center"><X size={16} color={COLORS.muted} /></button>
                        </div>
                      </div>
                    ) : list.length > 0 && (
                      <div>
                        <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.suggestionsTitle}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((it) => (
                            <button key={it.name} onClick={() => { setPendingSuggestion(it); setSizeInput(""); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-2.5 py-1.5 rounded-lg text-xs">
                              {it.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder={t.qtyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder={t.unitPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          )}
          <button onClick={submitAdd} style={{ background: COLORS.accent }} className="w-full mt-4 py-3 rounded-lg font-bold uppercase text-sm">{addModal.editingId ? t.saveLabel : t.logItBtn}</button>
        </Modal>
      )}

      {sosOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#150000" }}>
          <div className="flex items-center justify-between px-5 pt-6 pb-3">
            <div style={{ color: COLORS.danger }} className="text-lg font-black uppercase flex items-center gap-2"><Siren size={20} /> {t.emergencyTitle}</div>
            <button onClick={() => { setSosOpen(false); logIncident(); }} className="text-xs font-bold uppercase" style={{ color: COLORS.muted }}>{t.closeAndLog}</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[t.ambulance, t.police, t.fire, t.generalEmergency].map((label, i) => (
                <a key={SWISS_EMERGENCY_NUMS[i]} href={`tel:${SWISS_EMERGENCY_NUMS[i]}`} style={{ background: COLORS.danger }} className="rounded-xl py-4 text-center">
                  <div className="text-3xl font-black text-white">{SWISS_EMERGENCY_NUMS[i]}</div>
                  <div className="text-xs text-white/80">{label}</div>
                </a>
              ))}
            </div>
            <div style={{ background: "#241414", border: `1px solid ${COLORS.danger}` }} className="rounded-xl p-4">
              <div className="text-white text-xs uppercase tracking-wide mb-2 opacity-70">{t.notBreathingHint}</div>
              <div className="text-white text-2xl font-black mb-1">{cprStep + 1}. {CPR_STEPS[cprStep].title}</div>
              <div className="text-white text-lg leading-snug">{CPR_STEPS[cprStep].text}</div>
              <div className="flex gap-2 mt-4">
                <button disabled={cprStep === 0} onClick={() => setCprStep((s) => Math.max(0, s - 1))} style={{ background: "#3A1F1F", opacity: cprStep === 0 ? 0.4 : 1 }} className="flex-1 py-3 rounded-lg text-white text-sm font-bold uppercase">{t.back}</button>
                <button disabled={cprStep === CPR_STEPS.length - 1} onClick={() => setCprStep((s) => Math.min(CPR_STEPS.length - 1, s + 1))} style={{ background: COLORS.danger, opacity: cprStep === CPR_STEPS.length - 1 ? 0.4 : 1 }} className="flex-1 py-3 rounded-lg text-white text-sm font-bold uppercase">{t.nextStep}</button>
              </div>
            </div>
            <div style={{ color: "#B98888" }} className="text-xs text-center">{t.cprDisclaimer}</div>
            {profile.contactPhone && (
              <a href={`tel:${profile.contactPhone}`} style={{ background: "#241414", border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.emergencyContact}</div>
                  <div className="text-white font-bold">{profile.contactName || profile.contactPhone}{profile.contactRelationship ? ` · ${profile.contactRelationship}` : ""}</div>
                </div>
                <Phone size={18} color={COLORS.muted} />
              </a>
            )}
            {insuranceCards.length > 0 && (
              <div style={{ background: "#241414", border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 flex flex-col gap-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide flex items-center gap-1"><CreditCard size={12} /> {t.profileInsurance}</div>
                {insuranceCards.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="text-white text-sm">
                      <div className="font-bold">{c.label || c.provider}</div>
                      <div style={{ color: COLORS.muted }} className="text-xs">{c.provider}{c.policyNumber ? ` · ${c.policyNumber}` : ""}</div>
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`}><Phone size={16} color={COLORS.muted} /></a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {scanModal && (
        <Modal onClose={() => setScanModal(null)} title={scanModal.mode === "compare" ? t.scanTitleCompare : t.scanTitleSingle}>
          <div className="flex flex-col gap-3">
            {scanModal.mode === "compare" && <div style={{ color: COLORS.muted }} className="text-xs">{t.scanHintCompare}</div>}
            <div className="grid grid-cols-2 gap-2">
              {scanModal.images.map((img, i) => (<img key={i} src={`data:${img.mediaType};base64,${img.b64}`} alt="" className="w-full h-24 object-cover rounded-lg" />))}
              {(scanModal.mode === "single" ? scanModal.images.length < 1 : scanModal.images.length < 2) && (
                <button onClick={() => scanFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="h-24 rounded-lg flex flex-col items-center justify-center gap-1">
                  <ImagePlus size={18} color={COLORS.muted} />
                  <span style={{ color: COLORS.muted }} className="text-xs">{scanModal.images.length === 0 ? t.before : t.after}</span>
                </button>
              )}
            </div>
            <input ref={scanFileRef} type="file" accept="image/*" onChange={addScanImage} className="hidden" />
            {scanModal.error && <div style={{ color: COLORS.danger }} className="text-xs">{scanModal.error}</div>}
            {!scanModal.items && (
              <button onClick={runScan} disabled={scanModal.loading || (scanModal.mode === "single" ? scanModal.images.length < 1 : scanModal.images.length < 2)} style={{ background: COLORS.success, opacity: scanModal.loading ? 0.7 : 1 }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                {scanModal.loading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {scanModal.loading ? t.readingPhoto : t.readMaterials}
              </button>
            )}
            {scanModal.items && (
              <div className="flex flex-col gap-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.detectedHint}</div>
                {scanModal.items.map((it) => (
                  <label key={it.id} style={{ background: COLORS.cardAlt }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                    <input type="checkbox" checked={it.checked} onChange={() => setScanModal((s) => ({ ...s, items: s.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) }))} />
                    <span className="flex-1">{it.name}</span>
                    <span style={{ color: COLORS.muted }}>{it.qty} {it.unit}</span>
                  </label>
                ))}
                <button onClick={confirmScan} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm mt-2">{t.addToMaterialsLog}</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {pickupModal && (
        <Modal onClose={() => setPickupModal(null)} title={t.pickupTitle}>
          {pickupModal.step === "form" ? (
            <div className="flex flex-col gap-2">
              <div style={{ color: COLORS.muted }} className="text-xs mb-1">{t.pickupHint}</div>
              <input value={pickupModal.orderRef} onChange={(e) => setPickupModal((s) => ({ ...s, orderRef: e.target.value }))} placeholder={t.orderPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={pickupModal.supplier} onChange={(e) => setPickupModal((s) => ({ ...s, supplier: e.target.value }))} placeholder={t.supplierPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              <div className="flex gap-2 mt-1">
                <button onClick={() => setPickupModal((s) => ({ ...s, codeType: "qr" }))} style={{ background: pickupModal.codeType === "qr" ? "#C9A6F5" : COLORS.cardAlt }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"><QrCode size={14} /> {t.qrLabel}</button>
                <button onClick={() => setPickupModal((s) => ({ ...s, codeType: "barcode" }))} style={{ background: pickupModal.codeType === "barcode" ? "#C9A6F5" : COLORS.cardAlt }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"><Barcode size={14} /> {t.barcodeLabel}</button>
              </div>
              <button onClick={generatePickupCode} disabled={!pickupModal.orderRef.trim()} style={{ background: "#C9A6F5", opacity: pickupModal.orderRef.trim() ? 1 : 0.5 }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm text-black">{t.generateCode}</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div style={{ background: "#fff" }} className="rounded-xl p-4 w-full flex items-center justify-center">
                {pickupModal.codeType === "qr" ? (
                  <img alt="QR" className="w-56 h-56" src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pickupModal.orderRef)}`} />
                ) : (
                  <img alt="Barcode" className="w-full h-28 object-contain" src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(pickupModal.orderRef)}&scale=3&includetext=true`} />
                )}
              </div>
              <div className="text-center">
                <div className="font-bold">{pickupModal.orderRef}</div>
                {pickupModal.supplier && <div style={{ color: COLORS.muted }} className="text-xs">{pickupModal.supplier}</div>}
              </div>
              <div style={{ color: COLORS.muted }} className="text-xs text-center">{t.showScreenHint}</div>
              <button onClick={() => setPickupModal(null)} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.doneLabel}</button>
            </div>
          )}
        </Modal>
      )}

      {inspectionModal && (
        <Modal onClose={() => setInspectionModal(null)} title={t.inspectionTitle}>
          {inspectionModal.step === "form" && (
            <div className="flex flex-col gap-2">
              <textarea value={inspectionModal.text} onChange={(e) => setInspectionModal((s) => ({ ...s, text: e.target.value }))} placeholder={t.inspectionPlaceholder} rows={4} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              <div className="flex gap-2">
                <input value={inspectionModal.startTime} onChange={(e) => setInspectionModal((s) => ({ ...s, startTime: e.target.value }))} placeholder={t.startTimeLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={inspectionModal.ladderLength} onChange={(e) => setInspectionModal((s) => ({ ...s, ladderLength: e.target.value }))} placeholder={t.ladderLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={inspectionModal.psaCount} onChange={(e) => setInspectionModal((s) => ({ ...s, psaCount: e.target.value }))} placeholder={t.psaLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {inspectionModal.images.map((img, i) => (<img key={i} src={`data:${img.mediaType};base64,${img.b64}`} alt="" className="w-full h-16 object-cover rounded-lg" />))}
                {inspectionModal.images.length < 3 && (
                  <button onClick={() => inspectionFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="h-16 rounded-lg flex items-center justify-center">
                    <ImagePlus size={16} color={COLORS.muted} />
                  </button>
                )}
              </div>
              <input ref={inspectionFileRef} type="file" accept="image/*" onChange={addInspectionImage} className="hidden" />
              {inspectionModal.error && <div style={{ color: COLORS.danger }} className="text-xs">{inspectionModal.error}</div>}
              <button onClick={runInspection} disabled={!inspectionModal.text.trim()} style={{ background: "#6FB3D9", opacity: inspectionModal.text.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm text-black">{t.sendToAdvisors}</button>
              <div style={{ color: COLORS.muted }} className="text-[10px]">{t.advisorsHint}</div>
            </div>
          )}
          {inspectionModal.step === "running" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 size={28} className="animate-spin" color="#6FB3D9" />
              <div className="text-sm font-semibold text-center">{inspectionModal.agentNote}</div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((n) => (<div key={n} className="w-2 h-2 rounded-full" style={{ background: n <= inspectionModal.progress ? "#6FB3D9" : COLORS.border }} />))}
              </div>
            </div>
          )}
          {inspectionModal.step === "result" && (
            <div className="flex flex-col gap-3">
              <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, whiteSpace: "pre-wrap" }} className="rounded-lg p-3 text-sm leading-relaxed">{inspectionModal.report}</div>
              {inspectionModal.materials && inspectionModal.materials.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.materialsAlsoLog}</div>
                  {inspectionModal.materials.map((it) => (
                    <label key={it.id} style={{ background: COLORS.cardAlt }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                      <input type="checkbox" checked={it.checked} onChange={() => setInspectionModal((s) => ({ ...s, materials: s.materials.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) }))} />
                      <span className="flex-1">{it.name}</span>
                      <span style={{ color: COLORS.muted }}>{it.qty} {it.unit}</span>
                    </label>
                  ))}
                </div>
              )}
              <button onClick={confirmInspection} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.logInspection}</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function MountainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        {/* Layer 1 — furthest, palest, tallest peaks */}
        <path d="M0,900 L0,520 L40,420 L80,480 L130,340 L180,460 L230,380 L280,470 L330,360 L400,450 L400,900 Z" fill="#3A4550" opacity="0.5" />
        <polygon points="112,375 130,340 150,372" fill={COLORS.text} opacity="0.4" />
        <polygon points="312,393 330,360 350,392" fill={COLORS.text} opacity="0.4" />
        <polygon points="213,410 230,380 249,412" fill={COLORS.text} opacity="0.35" />

        {/* Layer 2 — mid distance */}
        <path d="M0,900 L0,620 L50,540 L100,600 L150,500 L200,610 L260,520 L310,600 L360,540 L400,610 L400,900 Z" fill="#2C343B" opacity="0.65" />
        <polygon points="133,532 150,500 168,530" fill={COLORS.text} opacity="0.3" />
        <polygon points="243,550 260,520 277,548" fill={COLORS.text} opacity="0.3" />

        {/* Layer 3 — closest foothills, blends into the app shell */}
        <path d="M0,900 L0,760 L60,700 L120,750 L190,680 L260,740 L330,690 L400,750 L400,900 Z" fill="#20262B" opacity="0.9" />
      </svg>
    </div>
  );
}

function SwissCross({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "inline-block" }}>
      <rect x="0" y="0" width="32" height="32" rx="6" fill="#DA291C" />
      <rect x="13" y="6" width="6" height="20" fill="#fff" />
      <rect x="6" y="13" width="20" height="6" fill="#fff" />
    </svg>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.muted }} className="text-sm">{label}</span>
      <span style={{ color }} className="font-black text-lg">{value}</span>
    </div>
  );
}

function EntryRow({ entry, projectName, t }) {
  const meta = typeMeta(entry.type, t);
  const Icon = meta.icon;
  return (
    <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}` }} className="rounded-lg p-3 flex items-start gap-3">
      <div style={{ background: COLORS.shell, border: `1px solid ${meta.color}` }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} color={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ whiteSpace: entry.type === "inspection" ? "pre-wrap" : "normal" }} className="text-sm font-semibold">{entry.description}</div>
        <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">
          {meta.label}{entry.qty ? ` · ${entry.qty}${entry.unit ? " " + entry.unit : ""}` : ""}{entry.projectId ? ` · ${projectName(entry.projectId)}` : ""}
        </div>
        {entry.photo && <img src={entry.photo} alt="" className="w-full rounded-md mt-2 max-h-32 object-cover" />}
      </div>
    </div>
  );
}

const ENTRY_TYPE_ORDER = ["time", "material", "tool", "photo", "pickup", "inspection", "note"];

function EntryGroups({ entries, projectName, t, emptyLabel }) {
  const [expanded, setExpanded] = useState({});
  if (!entries || entries.length === 0) {
    return emptyLabel ? <div style={{ color: COLORS.muted }} className="text-sm">{emptyLabel}</div> : null;
  }
  const groups = {};
  entries.forEach((e) => { (groups[e.type] = groups[e.type] || []).push(e); });
  const presentTypes = ENTRY_TYPE_ORDER.filter((ty) => groups[ty] && groups[ty].length > 0);
  return (
    <div className="flex flex-col gap-2">
      {presentTypes.map((ty) => {
        const meta = typeMeta(ty, t);
        const Icon = meta.icon;
        const isOpen = !!expanded[ty];
        const items = groups[ty];
        return (
          <div key={ty} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-lg overflow-hidden">
            <button onClick={() => setExpanded((s) => ({ ...s, [ty]: !s[ty] }))} className="w-full flex items-center justify-between px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={15} color={meta.color} /> {meta.label}
                <span style={{ color: COLORS.muted }} className="text-xs font-normal">({items.length})</span>
              </span>
              <ChevronRight size={16} color={COLORS.muted} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="px-3 pt-2 pb-3 flex flex-col gap-2">
                {items.map((e) => (<EntryRow key={e.id} entry={e} projectName={projectName} t={t} />))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjectDetail({ project, entries, onClose, onAdd, onEdit, onEditEntry, onCopyEntry, onShare, t }) {
  const materials = entries.filter((e) => e.type === "material");
  const tools = entries.filter((e) => e.type === "tool");
  const photos = entries.filter((e) => e.type === "photo");
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }} className="relative w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="font-black text-lg">{project.name}</div>
              {project.category && (
                <span style={{ background: COLORS.cardAlt, color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t[PROJECT_CATEGORIES.find((c) => c.key === project.category)?.labelKey] || project.category}
                </span>
              )}
            </div>
            {project.client && <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">{project.client}</div>}
            {project.address ? (
              <a href={mapsUrl(project.address)} target="_blank" rel="noreferrer" style={{ color: COLORS.accent }} className="text-xs flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {project.address}
              </a>
            ) : (
              <button onClick={onEdit} style={{ color: COLORS.muted }} className="text-xs flex items-center gap-1 mt-0.5 underline">
                <MapPin size={11} /> {t.addAddress}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onShare(project, entries)} style={{ color: COLORS.muted }}><Share2 size={16} /></button>
            <button onClick={onEdit} style={{ color: COLORS.muted }} className="text-xs font-bold uppercase">{t.editLabel}</button>
            <button onClick={onClose}><X size={20} color={COLORS.muted} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => onAdd("material")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Package size={13} color={COLORS.success} /> {t.materials}</button>
          <button onClick={() => onAdd("tool")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Wrench size={13} color={COLORS.amber} /> {t.tools}</button>
          <button onClick={() => onAdd("photo")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 col-span-2"><Camera size={13} color="#7FA0C7" /> {t.photoLabel}</button>
        </div>
        <Section title={`${t.materials} (${materials.length})`} items={materials} onEditItem={onEditEntry} onCopyItem={onCopyEntry} t={t} />
        <Section title={`${t.tools} (${tools.length})`} items={tools} onEditItem={onEditEntry} onCopyItem={onCopyEntry} t={t} />
        {photos.length > 0 && (
          <div className="mt-3">
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.photoLabel}</div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (<img key={p.id} src={p.photo} alt="" className="w-full h-20 object-cover rounded-md" />))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, onEditItem, onCopyItem, t }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{title}</div>
      <div className="flex flex-col gap-1.5">
        {items.map((i) => (
          <div key={i.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="truncate">{i.description}</div>
            </div>
            <span style={{ color: COLORS.muted }} className="shrink-0">{i.qty ? `${i.qty}${i.unit ? " " + i.unit : ""}` : ""}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onCopyItem(i)} title={t.copyBtn} style={{ color: COLORS.muted }}><Copy size={13} /></button>
              <button onClick={() => onEditItem(i)} title={t.editLabel} style={{ color: COLORS.muted }}><Pencil size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }} className="relative w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-black text-lg uppercase">{title}</div>
          <button onClick={onClose}><X size={20} color={COLORS.muted} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
