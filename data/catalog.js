// The shop catalogues: product groups per supplier, in every language.
// Loaded when the Materials tab or the material composer opens.
export const MATERIALS_CATALOG = {
  en: {
    cats: {
      wood: "Wood",
      membranes: "Membranes",
      metal: "Flashing & metalwork",
      insulation: "Insulation",
      fasteners: "Fasteners",
      covering: "Roof covering",
      hgc: "HGC (wholesaler)",
      gabs: "GABS (Spenglerei)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (roof windows)",
      glaromat: "Glaromat (fasteners)",
      gyso: "Gyso (adhesives & sealants)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Battens", items: ["Counter battens", "Battens", "Ridge battens", "Ventilation battens"] },
        { group: "Structural timber", items: ["Rafters", "Purlins", "Ridge beam", "Ceiling joists", "Roof trusses"] },
        {
          group: "Boards & sheathing",
          items: ["Roof sheathing boards", "Fascia boards", "Soffit boards", "OSB sheathing"],
        },
      ],
      membranes: [
        {
          group: "Underlay membranes",
          items: ["Roofing underlay membrane", "Breather membrane", "Bitumen underlay felt", "Diffusion-open membrane"],
        },
        { group: "Vapour control", items: ["Vapour barrier film", "Vapour check membrane"] },
        {
          group: "Tapes & accessories",
          items: ["Ridge vent tape", "Sealing tape", "Self-adhesive flashing tape", "Butyl tape"],
        },
      ],
      metal: [
        { group: "Eaves & ridge", items: ["Eaves flashing", "Ridge caps", "Ridge vent"] },
        { group: "Rainwater goods", items: ["Gutters", "Downpipes", "Gutter brackets", "Leaf guards"] },
        { group: "Flashings", items: ["Valley flashing", "Wall flashing", "Chimney flashing", "Apron flashing"] },
        { group: "Snow protection", items: ["Snow guards", "Snow fence"] },
      ],
      insulation: [
        { group: "Mineral & wood fibre", items: ["Mineral wool", "Wood fibre insulation board"] },
        { group: "Rigid boards", items: ["EPS insulation board", "XPS insulation board", "PIR insulation board"] },
        { group: "Roof & facade", items: ["Roof insulation batts", "Facade insulation board"] },
      ],
      fasteners: [
        { group: "Nails & screws", items: ["Roofing nails", "Wood screws", "EPDM roofing screws"] },
        { group: "Clips & fixings", items: ["Storm clips", "Wind clips", "Sealing washers"] },
      ],
      covering: [
        { group: "Tiles", items: ["Ceramic roof tiles", "Concrete roof tiles", "Slate tiles"] },
        { group: "Sheet & shingle", items: ["Metal roof tiles", "Bitumen shingles", "Standing seam roofing"] },
      ],
      hgc: [
        {
          group: "Timber construction",
          items: [
            "HGC solid structural timber (KVH)",
            "HGC glulam beams (BSH)",
            "HGC cross-laminated timber (BSP)",
            "HGC finger-jointed battens",
            "HGC formwork panels",
          ],
        },
        {
          group: "Roof & envelope",
          items: ["HGC roofing underlay", "HGC EPDM waterproofing membrane", "HGC composite decking boards"],
        },
        { group: "Drywall", items: ["HGC plasterboard", "HGC drywall boards & metal stud profiles"] },
        { group: "Insulation", items: ["HGC mineral wool insulation"] },
      ],
      gabs: [
        {
          group: "Flat roof",
          items: [
            "GABS EPDM roof membrane",
            "GABS drainage channel",
            "GABS inspection pipe",
            "GABS gravel guard edging",
          ],
        },
        { group: "Pitched roof", items: ["GABS gutters", "GABS downpipes", "GABS leaf guard", "GABS chimney cap"] },
        { group: "Sheet metal & lightning protection", items: ["GABS lightning protection kit"] },
      ],
      soprema: [
        {
          group: "Primers",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 metal primer (110955)",
          ],
        },
        {
          group: "Waterproofing",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Finish & sealing",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Accessories",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT catalyst powder (221170)",
            "Soprema Alsan Promo sealant (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 filler sand (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Roof windows",
          items: [
            "Velux GGL roof window (wood)",
            "Velux GGU roof window (PVC)",
            "Velux GPU centre-pivot/top-hung window",
            "Velux GVT loft access window (cold roof)",
          ],
        },
        {
          group: "Flashing kits & lining",
          items: [
            "Velux EDW flashing kit (tiles)",
            "Velux EDL flashing kit (flat roofing material)",
            "Velux EDN flashing kit (low-profile tiles)",
            "Velux BFX interior lining",
            "Velux BBX vapour barrier collar",
            "Velux BDX insulation collar",
          ],
        },
        {
          group: "Accessories & sun protection",
          items: ["Velux SML solar roller shutter", "Velux MHL heat-protection awning"],
        },
        { group: "Flat roof windows", items: ["Velux CVP flat roof window", "Velux CFP fixed dome (cold roof)"] },
      ],
      glaromat: [
        {
          group: "Karro & lap screws",
          items: [
            "Glaromat Karro screw K18H20 (6.5×20mm, EPDM washer)",
            "Glaromat Karro screw K18SI20 (stainless, EPDM washer)",
            "Glaromat lap screw UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Wood & construction screws",
          items: [
            "Glaromat hex construction screw BAUS12120 (M12×120mm)",
            "Glaromat hex wood screws",
            "Glaromat TS wood self-drilling screw",
            "Glaromat ATF timber-connector screw HSCH5050",
          ],
        },
        {
          group: "Specialty screws",
          items: [
            "Glaromat Disc insulation fastener",
            "Glaromat sheet-metal screws",
            "Glaromat carpenter's screws",
            "Glaromat corrugated-sheet screws",
            "Glaromat facade screws",
          ],
        },
      ],
      gyso: [
        {
          group: "Roof membranes & films",
          items: [
            "Gyso-Top Weld 520 roofing underlay",
            "Gyso-Top Weld Connect (penetration collars)",
            "Gyso-Top Weld Coil (PVC-coated eaves flashing)",
            "Gyso facade membrane",
            "Gyso vapour barrier",
          ],
        },
        {
          group: "Bonding & sealing",
          items: [
            "Gyso Polyflex 444 assembly adhesive (Art. 70920)",
            "Gyso sealing tape",
            "Gyso single-sided adhesive tape",
            "Geistlich Ligamenta PU adhesive",
          ],
        },
        { group: "Accessories", items: ["Gyso primer", "Gyso cleaner & wipes", "Gyso protective/cover film"] },
      ],
    },
  },
  de: {
    cats: {
      wood: "Holz",
      membranes: "Membranen",
      metal: "Spenglerarbeiten",
      insulation: "Dämmung",
      fasteners: "Befestigungsmaterial",
      covering: "Dacheindeckung",
      hgc: "HGC (Grossist)",
      gabs: "GABS (Spenglerei)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (Dachfenster)",
      glaromat: "Glaromat (Schrauben)",
      gyso: "Gyso (Kleben/Dichten/Schützen)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Latten", items: ["Konterlatten", "Dachlatten", "Firstlatten", "Konterlattung Belüftung"] },
        { group: "Konstruktionsholz", items: ["Sparren", "Pfetten", "Firstbalken", "Deckenbalken", "Dachbinder"] },
        {
          group: "Platten & Schalung",
          items: ["Schalungsbretter", "Stirnbretter", "Traufbretter", "OSB-Schalungsplatten"],
        },
      ],
      membranes: [
        {
          group: "Unterspannbahnen",
          items: [
            "Dachunterspannbahn",
            "Diffusionsoffene Membrane",
            "Bitumen-Unterdachbahn",
            "Diffusionsoffene Unterdeckbahn",
          ],
        },
        { group: "Dampfsperren", items: ["Dampfsperrfolie", "Dampfbremsmembrane"] },
        {
          group: "Bänder & Zubehör",
          items: ["Firstlüftungsband", "Dichtband", "Selbstklebendes Anschlussband", "Butylband"],
        },
      ],
      metal: [
        { group: "Traufe & First", items: ["Traufblech", "Firstziegel", "Firstlüftung"] },
        { group: "Entwässerung", items: ["Dachrinnen", "Fallrohre", "Rinnenhalter", "Laubschutzgitter"] },
        {
          group: "Anschlussbleche",
          items: ["Kehlblech", "Wandanschlussblech", "Kaminanschlussblech", "Anschlussschürze"],
        },
        { group: "Schneeschutz", items: ["Schneefanggitter", "Schneefangzaun"] },
      ],
      insulation: [
        { group: "Mineral- & Holzfaser", items: ["Mineralwolle", "Holzfaserdämmplatte"] },
        { group: "Hartschaumplatten", items: ["EPS-Dämmplatte", "XPS-Dämmplatte", "PIR-Dämmplatte"] },
        { group: "Dach & Fassade", items: ["Dach-Dämmmatten", "Fassadendämmplatte"] },
      ],
      fasteners: [
        { group: "Nägel & Schrauben", items: ["Dachnägel", "Holzschrauben", "Dachschrauben mit EPDM-Dichtung"] },
        { group: "Klammern & Befestigung", items: ["Sturmklammern", "Windklammern", "Dichtungsscheiben"] },
      ],
      covering: [
        { group: "Ziegel", items: ["Tonziegel", "Betonziegel", "Schieferplatten"] },
        { group: "Blech & Schindeln", items: ["Metalldachplatten", "Bitumenschindeln", "Stehfalzblech"] },
      ],
      hgc: [
        {
          group: "Holzbau",
          items: [
            "HGC Konstruktionsvollholz (KVH)",
            "HGC Brettschichtholz (BSH)",
            "HGC Brettsperrholz (BSP)",
            "HGC keilgezinkte Baulatten",
            "HGC Schaltafeln",
          ],
        },
        {
          group: "Dach & Gebäudehülle",
          items: ["HGC Unterdachbahn", "HGC Dichtungsbahnen EPDM", "HGC Terrassendielen"],
        },
        { group: "Trockenbau", items: ["HGC Gipskartonplatten", "HGC Bauplatten & Trockenbauprofile"] },
        { group: "Dämmung", items: ["HGC Mineralwolle-Dämmung"] },
      ],
      gabs: [
        {
          group: "Flachdach",
          items: ["GABS EPDM-Dachabdichtung", "GABS Entwässerungsrinne", "GABS Kontrollrohr", "GABS Kiesrahmen"],
        },
        { group: "Steildach", items: ["GABS Dachrinnen", "GABS Fallrohre", "GABS Laubfänger", "GABS Kaminhut"] },
        { group: "Spenglerei & Blitzschutz", items: ["GABS Blitzschutz-Set"] },
      ],
      soprema: [
        {
          group: "Grundierungen",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 Metallgrundierung (110955)",
          ],
        },
        {
          group: "Abdichtung",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Finish & Versiegelung",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Zubehör",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT Katalysatorpulver (221170)",
            "Soprema Alsan Promo Dichtmasse (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 Füllsand (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Dachfenster",
          items: [
            "Velux GGL Dachfenster (Holz)",
            "Velux GGU Dachfenster (Kunststoff)",
            "Velux GPU Klapp-Schwingfenster",
            "Velux GVT Ausstiegsfenster (Kaltdach)",
          ],
        },
        {
          group: "Eindeckrahmen & Anschluss",
          items: [
            "Velux Eindeckrahmen EDW (Ziegel)",
            "Velux Eindeckrahmen EDL (Flachdachmaterial)",
            "Velux Eindeckrahmen EDN (Flachziegel)",
            "Velux Innenfutter BFX",
            "Velux Dampfsperrschürze BBX",
            "Velux Dämmrahmen BDX",
          ],
        },
        { group: "Zubehör & Sonnenschutz", items: ["Velux Rollladen SML (Solar)", "Velux Hitzeschutz-Markise MHL"] },
        { group: "Flachdach-Fenster", items: ["Velux Flachdach-Fenster CVP", "Velux Lichtkuppel Kaltraum CFP"] },
      ],
      glaromat: [
        {
          group: "Karro- & Überlappungsschrauben",
          items: [
            "Glaromat Karro-Schraube K18H20 (6.5×20mm, EPDM-Dichtung)",
            "Glaromat Karro-Schraube K18SI20 (Chromstahl, EPDM-Dichtung)",
            "Glaromat Überlappungs-Schraube UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Holz- & Bauschrauben",
          items: [
            "Glaromat Sechskant-Bauschraube BAUS12120 (M12×120mm)",
            "Glaromat Sechskant-Holzschrauben",
            "Glaromat TS Holzbohrschraube",
            "Glaromat ATF Holzverbinder-Schraube HSCH5050",
          ],
        },
        {
          group: "Spezialschrauben",
          items: [
            "Glaromat Disc Tellerkopfschraube",
            "Glaromat Spenglerschrauben",
            "Glaromat Zimmermannsschrauben",
            "Glaromat Wellplattenschrauben",
            "Glaromat Fassadenschrauben",
          ],
        },
      ],
      gyso: [
        {
          group: "Dachbahnen & Folien",
          items: [
            "Gyso-Top Weld 520 Unterdachfolie",
            "Gyso-Top Weld Connect (Anschlussformteile)",
            "Gyso-Top Weld Coil (Einlaufblech PVC-beschichtet)",
            "Gyso Fassadenfolie",
            "Gyso Dampfbremse",
          ],
        },
        {
          group: "Kleben & Dichten",
          items: [
            "Gyso Polyflex 444 Montagekleber (Art. 70920)",
            "Gyso Dichtband",
            "Gyso Klebeband einseitig",
            "Geistlich Ligamenta PU-Klebstoff",
          ],
        },
        {
          group: "Zubehör",
          items: ["Gyso Primer/Grundierung", "Gyso Reiniger & Tücher", "Gyso Abdeckfolie/Schutzfolie"],
        },
      ],
    },
  },
  fr: {
    cats: {
      wood: "Bois",
      membranes: "Membranes",
      metal: "Ferblanterie",
      insulation: "Isolation",
      fasteners: "Fixations",
      covering: "Couverture",
      hgc: "HGC (grossiste)",
      gabs: "GABS (ferblanterie)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (fenêtres de toit)",
      glaromat: "Glaromat (vis)",
      gyso: "Gyso (collage/étanchéité)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Liteaux", items: ["Contre-lattes", "Liteaux", "Liteaux de faîtage", "Liteaux de ventilation"] },
        {
          group: "Bois de structure",
          items: ["Chevrons", "Pannes", "Poutre faîtière", "Solives de plafond", "Fermes de toit"],
        },
        {
          group: "Panneaux & voligeage",
          items: ["Voliges de toiture", "Planches de rive", "Planches d'égout", "Panneaux OSB"],
        },
      ],
      membranes: [
        {
          group: "Écrans de sous-toiture",
          items: ["Écran de sous-toiture", "Membrane respirante", "Feutre bitumineux", "Membrane hautement diffusante"],
        },
        { group: "Pare-vapeur", items: ["Pare-vapeur", "Membrane frein-vapeur"] },
        {
          group: "Bandes & accessoires",
          items: [
            "Bande de ventilation de faîtage",
            "Bande d'étanchéité",
            "Bande de solin autocollante",
            "Bande butyle",
          ],
        },
      ],
      metal: [
        { group: "Égout & faîtage", items: ["Bande de rive", "Closoirs de faîtage", "Ventilation de faîtage"] },
        {
          group: "Évacuation des eaux",
          items: ["Gouttières", "Descentes d'eau pluviale", "Crochets de gouttière", "Grilles pare-feuilles"],
        },
        { group: "Solins", items: ["Noue", "Solin mural", "Solin de cheminée", "Bavette d'étanchéité"] },
        { group: "Protection neige", items: ["Garde-neige", "Barrière à neige"] },
      ],
      insulation: [
        { group: "Minérale & fibre de bois", items: ["Laine minérale", "Panneau isolant fibre de bois"] },
        { group: "Panneaux rigides", items: ["Panneau isolant EPS", "Panneau isolant XPS", "Panneau isolant PIR"] },
        { group: "Toiture & façade", items: ["Nattes isolantes de toiture", "Panneau isolant de façade"] },
      ],
      fasteners: [
        { group: "Clous & vis", items: ["Clous de couverture", "Vis à bois", "Vis de couverture avec joint EPDM"] },
        {
          group: "Crochets & fixations",
          items: ["Crochets anti-tempête", "Agrafes anti-vent", "Rondelles d'étanchéité"],
        },
      ],
      covering: [
        { group: "Tuiles", items: ["Tuiles en terre cuite", "Tuiles en béton", "Ardoises"] },
        {
          group: "Tôle & bardeaux",
          items: ["Tuiles métalliques", "Bardeaux bitumés", "Couverture en tôle à joint debout"],
        },
      ],
      hgc: [
        {
          group: "Construction bois",
          items: [
            "HGC bois massif reconstitué (KVH)",
            "HGC bois lamellé-collé (BSH)",
            "HGC bois lamellé-croisé (BSP)",
            "HGC liteaux aboutés",
            "HGC panneaux de coffrage",
          ],
        },
        {
          group: "Toiture & enveloppe",
          items: ["HGC écran de sous-toiture", "HGC membrane d'étanchéité EPDM", "HGC lames de terrasse"],
        },
        {
          group: "Cloisons sèches",
          items: ["HGC plaques de plâtre", "HGC panneaux de construction et profilés pour cloisons"],
        },
        { group: "Isolation", items: ["HGC isolation laine minérale"] },
      ],
      gabs: [
        {
          group: "Toit plat",
          items: [
            "GABS membrane de toiture EPDM",
            "GABS caniveau d'évacuation",
            "GABS tube de contrôle",
            "GABS profil garde-gravier",
          ],
        },
        {
          group: "Toit en pente",
          items: ["GABS gouttières", "GABS descentes d'eau", "GABS pare-feuilles", "GABS chapeau de cheminée"],
        },
        { group: "Ferblanterie & paratonnerre", items: ["GABS kit paratonnerre"] },
      ],
      soprema: [
        {
          group: "Primaires",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 primaire métal (110955)",
          ],
        },
        {
          group: "Étanchéité",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Finition & scellement",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Accessoires",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT poudre catalyseur (221170)",
            "Soprema Alsan Promo mastic (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 sable de charge (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Fenêtres de toit",
          items: [
            "Velux GGL fenêtre de toit (bois)",
            "Velux GGU fenêtre de toit (PVC)",
            "Velux GPU fenêtre à rotation/projection",
            "Velux GVT fenêtre d'accès aux combles (toit froid)",
          ],
        },
        {
          group: "Raccords d'étanchéité",
          items: [
            "Velux EDW raccord d'étanchéité (tuiles)",
            "Velux EDL raccord d'étanchéité (matériau toit plat)",
            "Velux EDN raccord d'étanchéité (tuiles plates)",
            "Velux BFX habillage intérieur",
            "Velux BBX collerette pare-vapeur",
            "Velux BDX collerette isolante",
          ],
        },
        {
          group: "Accessoires & protection solaire",
          items: ["Velux SML volet roulant solaire", "Velux MHL store banne pare-chaleur"],
        },
        {
          group: "Fenêtres pour toit plat",
          items: ["Velux CVP fenêtre pour toit plat", "Velux CFP coupole fixe (toit froid)"],
        },
      ],
      glaromat: [
        {
          group: "Vis Karro & recouvrement",
          items: [
            "Glaromat vis Karro K18H20 (6.5×20mm, joint EPDM)",
            "Glaromat vis Karro K18SI20 (inox, joint EPDM)",
            "Glaromat vis de recouvrement UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Vis à bois & construction",
          items: [
            "Glaromat vis de construction hexagonale BAUS12120 (M12×120mm)",
            "Glaromat vis à bois hexagonales",
            "Glaromat vis autoperceuse TS bois",
            "Glaromat vis pour connecteurs bois ATF HSCH5050",
          ],
        },
        {
          group: "Vis spéciales",
          items: [
            "Glaromat vis à tête disque",
            "Glaromat vis de ferblanterie",
            "Glaromat vis de charpente",
            "Glaromat vis pour plaques ondulées",
            "Glaromat vis de façade",
          ],
        },
      ],
      gyso: [
        {
          group: "Membranes & films de toiture",
          items: [
            "Gyso-Top Weld 520 écran de sous-toiture",
            "Gyso-Top Weld Connect (raccords de pénétration)",
            "Gyso-Top Weld Coil (bande d'égout PVC)",
            "Gyso membrane de façade",
            "Gyso pare-vapeur",
          ],
        },
        {
          group: "Collage & étanchéité",
          items: [
            "Gyso Polyflex 444 colle de montage (Art. 70920)",
            "Gyso bande d'étanchéité",
            "Gyso ruban adhésif simple face",
            "Geistlich Ligamenta colle PU",
          ],
        },
        { group: "Accessoires", items: ["Gyso primaire", "Gyso nettoyant & lingettes", "Gyso film de protection"] },
      ],
    },
  },
  it: {
    cats: {
      wood: "Legno",
      membranes: "Membrane",
      metal: "Lattoneria",
      insulation: "Isolamento",
      fasteners: "Fissaggi",
      covering: "Copertura",
      hgc: "HGC (grossista)",
      gabs: "GABS (lattoneria)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (finestre per tetti)",
      glaromat: "Glaromat (viti)",
      gyso: "Gyso (incollaggio/sigillatura)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Listelli", items: ["Controlistelli", "Listelli", "Listelli di colmo", "Listelli di ventilazione"] },
        {
          group: "Legno strutturale",
          items: ["Travetti", "Arcarecci", "Trave di colmo", "Travetti di soffitto", "Capriate"],
        },
        {
          group: "Pannelli e tavolato",
          items: ["Tavolato di copertura", "Tavole di gronda", "Tavole di sottogronda", "Pannelli OSB"],
        },
      ],
      membranes: [
        {
          group: "Membrane sottotegola",
          items: ["Membrana sottotegola", "Membrana traspirante", "Feltro bituminoso", "Membrana ad alta diffusione"],
        },
        { group: "Barriere al vapore", items: ["Barriera al vapore", "Membrana freno al vapore"] },
        {
          group: "Nastri e accessori",
          items: [
            "Nastro di ventilazione del colmo",
            "Nastro sigillante",
            "Nastro autoadesivo per scossaline",
            "Nastro butilico",
          ],
        },
      ],
      metal: [
        { group: "Gronda e colmo", items: ["Scossalina di gronda", "Colmi", "Ventilazione di colmo"] },
        { group: "Sistema di scarico", items: ["Grondaie", "Pluviali", "Staffe per grondaie", "Parafoglie"] },
        {
          group: "Scossaline",
          items: ["Scossalina di compluvio", "Scossalina murale", "Scossalina per camino", "Grembiule di raccordo"],
        },
        { group: "Protezione neve", items: ["Ferma neve", "Barriera paraneve"] },
      ],
      insulation: [
        { group: "Minerale e fibra di legno", items: ["Lana minerale", "Pannello in fibra di legno"] },
        {
          group: "Pannelli rigidi",
          items: ["Pannello isolante EPS", "Pannello isolante XPS", "Pannello isolante PIR"],
        },
        { group: "Tetto e facciata", items: ["Materassini isolanti da tetto", "Pannello isolante di facciata"] },
      ],
      fasteners: [
        {
          group: "Chiodi e viti",
          items: ["Chiodi per coperture", "Viti per legno", "Viti per coperture con guarnizione EPDM"],
        },
        { group: "Graffe e fissaggi", items: ["Ganci antivento", "Graffe antivento", "Rondelle di tenuta"] },
      ],
      covering: [
        { group: "Tegole", items: ["Tegole in cotto", "Tegole in cemento", "Ardesia"] },
        {
          group: "Lamiera e scandole",
          items: ["Tegole metalliche", "Scandole bituminose", "Copertura in lamiera aggraffata"],
        },
      ],
      hgc: [
        {
          group: "Costruzioni in legno",
          items: [
            "HGC legno strutturale massiccio (KVH)",
            "HGC legno lamellare (BSH)",
            "HGC legno lamellare incrociato (BSP)",
            "HGC listelli con giunto a pettine",
            "HGC pannelli da casseforme",
          ],
        },
        {
          group: "Tetto e involucro",
          items: ["HGC membrana sottotegola", "HGC membrana impermeabilizzante EPDM", "HGC tavole per terrazzo"],
        },
        {
          group: "Cartongesso",
          items: ["HGC lastre in cartongesso", "HGC pannelli da costruzione e profili per cartongesso"],
        },
        { group: "Isolamento", items: ["HGC isolamento in lana minerale"] },
      ],
      gabs: [
        {
          group: "Tetto piano",
          items: [
            "GABS membrana per tetto EPDM",
            "GABS canale di drenaggio",
            "GABS tubo di ispezione",
            "GABS profilo paraghiaia",
          ],
        },
        { group: "Tetto a falde", items: ["GABS grondaie", "GABS pluviali", "GABS parafoglie", "GABS comignolo"] },
        { group: "Lattoneria e parafulmine", items: ["GABS kit parafulmine"] },
      ],
      soprema: [
        {
          group: "Primer",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 primer per metallo (110955)",
          ],
        },
        {
          group: "Impermeabilizzazione",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Finitura e sigillatura",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Accessori",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT polvere catalizzatrice (221170)",
            "Soprema Alsan Promo sigillante (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 sabbia di carica (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Finestre per tetti",
          items: [
            "Velux GGL finestra per tetti (legno)",
            "Velux GGU finestra per tetti (PVC)",
            "Velux GPU finestra bilico/a vasistas",
            "Velux GVT finestra di accesso al sottotetto (tetto freddo)",
          ],
        },
        {
          group: "Raccordi e rivestimento",
          items: [
            "Velux EDW raccordo (tegole)",
            "Velux EDL raccordo (materiale tetto piano)",
            "Velux EDN raccordo (tegole piane)",
            "Velux BFX rivestimento interno",
            "Velux BBX collare barriera al vapore",
            "Velux BDX collare isolante",
          ],
        },
        { group: "Accessori e protezione solare", items: ["Velux SML tapparella solare", "Velux MHL tenda parasole"] },
        {
          group: "Finestre per tetto piano",
          items: ["Velux CVP finestra per tetto piano", "Velux CFP cupola fissa (tetto freddo)"],
        },
      ],
      glaromat: [
        {
          group: "Viti Karro e sovrapposizione",
          items: [
            "Glaromat vite Karro K18H20 (6.5×20mm, guarnizione EPDM)",
            "Glaromat vite Karro K18SI20 (acciaio inox, guarnizione EPDM)",
            "Glaromat vite di sovrapposizione UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Viti per legno e costruzione",
          items: [
            "Glaromat vite esagonale da costruzione BAUS12120 (M12×120mm)",
            "Glaromat viti esagonali per legno",
            "Glaromat vite autoforante TS per legno",
            "Glaromat vite per connettori legno ATF HSCH5050",
          ],
        },
        {
          group: "Viti speciali",
          items: [
            "Glaromat vite a testa disco",
            "Glaromat viti da lattoniere",
            "Glaromat viti da carpentiere",
            "Glaromat viti per lastre ondulate",
            "Glaromat viti per facciate",
          ],
        },
      ],
      gyso: [
        {
          group: "Membrane e teli per tetto",
          items: [
            "Gyso-Top Weld 520 membrana sottotegola",
            "Gyso-Top Weld Connect (raccordi di penetrazione)",
            "Gyso-Top Weld Coil (scossalina di gronda in PVC)",
            "Gyso membrana per facciata",
            "Gyso barriera al vapore",
          ],
        },
        {
          group: "Incollaggio e sigillatura",
          items: [
            "Gyso Polyflex 444 adesivo di montaggio (Art. 70920)",
            "Gyso nastro sigillante",
            "Gyso nastro adesivo monofaccia",
            "Geistlich Ligamenta adesivo PU",
          ],
        },
        {
          group: "Accessori",
          items: ["Gyso primer", "Gyso detergente e salviette", "Gyso film protettivo/di copertura"],
        },
      ],
    },
  },
  es: {
    cats: {
      wood: "Madera",
      membranes: "Membranas",
      metal: "Chapistería",
      insulation: "Aislamiento",
      fasteners: "Fijaciones",
      covering: "Cubierta",
      hgc: "HGC (mayorista)",
      gabs: "GABS (chapistería)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (ventanas de tejado)",
      glaromat: "Glaromat (tornillos)",
      gyso: "Gyso (adhesivos/sellado)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Listones", items: ["Contralistones", "Listones", "Listones de cumbrera", "Listones de ventilación"] },
        { group: "Madera estructural", items: ["Cabios", "Correas", "Viga cumbrera", "Vigas de techo", "Cerchas"] },
        {
          group: "Tableros y entablado",
          items: ["Tablero de cubierta", "Tablas de alero", "Tablas de canalón", "Tableros OSB"],
        },
      ],
      membranes: [
        {
          group: "Láminas bajo teja",
          items: [
            "Lámina impermeabilizante bajo teja",
            "Membrana transpirable",
            "Fieltro bituminoso",
            "Membrana de alta difusión",
          ],
        },
        { group: "Barreras de vapor", items: ["Barrera de vapor", "Membrana freno de vapor"] },
        {
          group: "Cintas y accesorios",
          items: [
            "Cinta de ventilación de cumbrera",
            "Cinta selladora",
            "Cinta autoadhesiva de remate",
            "Cinta de butilo",
          ],
        },
      ],
      metal: [
        { group: "Alero y cumbrera", items: ["Chapa de alero", "Caballetes de cumbrera", "Ventilación de cumbrera"] },
        {
          group: "Evacuación de aguas",
          items: ["Canalones", "Bajantes", "Soportes de canalón", "Rejillas guardahojas"],
        },
        {
          group: "Chapas de remate",
          items: ["Chapa de limahoya", "Chapa de remate mural", "Chapa de remate de chimenea", "Babero de remate"],
        },
        { group: "Protección nieve", items: ["Guardanieves", "Barrera quitanieves"] },
      ],
      insulation: [
        { group: "Mineral y fibra de madera", items: ["Lana mineral", "Panel de fibra de madera"] },
        { group: "Paneles rígidos", items: ["Placa aislante EPS", "Placa aislante XPS", "Placa aislante PIR"] },
        { group: "Cubierta y fachada", items: ["Mantas aislantes de cubierta", "Placa aislante de fachada"] },
      ],
      fasteners: [
        {
          group: "Clavos y tornillos",
          items: ["Clavos para tejado", "Tornillos para madera", "Tornillos para tejado con junta EPDM"],
        },
        {
          group: "Grapas y fijaciones",
          items: ["Grapas antitormenta", "Grapas antiviento", "Arandelas de estanqueidad"],
        },
      ],
      covering: [
        { group: "Tejas", items: ["Tejas cerámicas", "Tejas de hormigón", "Pizarra"] },
        {
          group: "Chapa y tejas asfálticas",
          items: ["Tejas metálicas", "Tejas asfálticas", "Cubierta de junta alzada"],
        },
      ],
      hgc: [
        {
          group: "Construcción en madera",
          items: [
            "HGC madera maciza estructural (KVH)",
            "HGC madera laminada encolada (BSH)",
            "HGC madera contralaminada (BSP)",
            "HGC listones dentados",
            "HGC paneles de encofrado",
          ],
        },
        {
          group: "Cubierta y envolvente",
          items: ["HGC lámina bajo teja", "HGC membrana impermeabilizante EPDM", "HGC tablas de terraza"],
        },
        {
          group: "Tabiquería seca",
          items: ["HGC placas de yeso laminado", "HGC paneles de construcción y perfiles para tabiquería"],
        },
        { group: "Aislamiento", items: ["HGC aislamiento de lana mineral"] },
      ],
      gabs: [
        {
          group: "Cubierta plana",
          items: [
            "GABS membrana de cubierta EPDM",
            "GABS canal de drenaje",
            "GABS tubo de inspección",
            "GABS perfil guardagravilla",
          ],
        },
        {
          group: "Cubierta inclinada",
          items: ["GABS canalones", "GABS bajantes", "GABS guardahojas", "GABS sombrerete de chimenea"],
        },
        { group: "Chapistería y pararrayos", items: ["GABS kit pararrayos"] },
      ],
      soprema: [
        {
          group: "Imprimaciones",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 imprimación metálica (110955)",
          ],
        },
        {
          group: "Impermeabilización",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Acabado y sellado",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Accesorios",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT polvo catalizador (221170)",
            "Soprema Alsan Promo sellador (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 arena de carga (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Ventanas de tejado",
          items: [
            "Velux GGL ventana de tejado (madera)",
            "Velux GGU ventana de tejado (PVC)",
            "Velux GPU ventana oscilobatiente",
            "Velux GVT ventana de acceso a buhardilla (tejado frío)",
          ],
        },
        {
          group: "Kits de estanqueidad",
          items: [
            "Velux EDW kit de estanqueidad (tejas)",
            "Velux EDL kit de estanqueidad (material de cubierta plana)",
            "Velux EDN kit de estanqueidad (tejas planas)",
            "Velux BFX forro interior",
            "Velux BBX collarín cortavapor",
            "Velux BDX collarín aislante",
          ],
        },
        { group: "Accesorios y protección solar", items: ["Velux SML persiana solar", "Velux MHL toldo cortacalor"] },
        {
          group: "Ventanas para cubierta plana",
          items: ["Velux CVP ventana para cubierta plana", "Velux CFP cúpula fija (tejado frío)"],
        },
      ],
      glaromat: [
        {
          group: "Tornillos Karro y solape",
          items: [
            "Glaromat tornillo Karro K18H20 (6.5×20mm, junta EPDM)",
            "Glaromat tornillo Karro K18SI20 (inoxidable, junta EPDM)",
            "Glaromat tornillo de solape UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Tornillos para madera y construcción",
          items: [
            "Glaromat tornillo hexagonal de construcción BAUS12120 (M12×120mm)",
            "Glaromat tornillos hexagonales para madera",
            "Glaromat tornillo autotaladrante TS para madera",
            "Glaromat tornillo para conectores de madera ATF HSCH5050",
          ],
        },
        {
          group: "Tornillos especiales",
          items: [
            "Glaromat tornillo de cabeza disco",
            "Glaromat tornillos de chapista",
            "Glaromat tornillos de carpintero",
            "Glaromat tornillos para placas onduladas",
            "Glaromat tornillos de fachada",
          ],
        },
      ],
      gyso: [
        {
          group: "Membranas y láminas de cubierta",
          items: [
            "Gyso-Top Weld 520 lámina bajo teja",
            "Gyso-Top Weld Connect (collarines de penetración)",
            "Gyso-Top Weld Coil (chapa de alero revestida de PVC)",
            "Gyso membrana de fachada",
            "Gyso barrera de vapor",
          ],
        },
        {
          group: "Encolado y sellado",
          items: [
            "Gyso Polyflex 444 adhesivo de montaje (Art. 70920)",
            "Gyso cinta selladora",
            "Gyso cinta adhesiva de una cara",
            "Geistlich Ligamenta adhesivo PU",
          ],
        },
        {
          group: "Accesorios",
          items: ["Gyso imprimación", "Gyso limpiador y toallitas", "Gyso film protector/de cobertura"],
        },
      ],
    },
  },
  pt: {
    cats: {
      wood: "Madeira",
      membranes: "Membranas",
      metal: "Serralharia/Latoaria",
      insulation: "Isolamento",
      fasteners: "Fixações",
      covering: "Cobertura",
      hgc: "HGC (grossista)",
      gabs: "GABS (latoaria)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (janelas de telhado)",
      glaromat: "Glaromat (parafusos)",
      gyso: "Gyso (colagem/vedação)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Ripas", items: ["Contra-ripas", "Ripas", "Ripas de cumeeira", "Ripas de ventilação"] },
        {
          group: "Madeira estrutural",
          items: ["Varas/caibros", "Madres", "Viga de cumeeira", "Vigas de teto", "Asnas de telhado"],
        },
        {
          group: "Painéis e forro",
          items: ["Forro de telhado", "Táboas de beiral", "Táboas de caleira", "Painéis OSB"],
        },
      ],
      membranes: [
        {
          group: "Mantas sub-telha",
          items: ["Manta sub-telha", "Membrana respirável", "Feltro betuminoso", "Membrana de alta difusão"],
        },
        { group: "Barreiras de vapor", items: ["Barreira de vapor", "Membrana corta-vapor"] },
        {
          group: "Fitas e acessórios",
          items: ["Fita de ventilação de cumeeira", "Fita vedante", "Fita autoadesiva de remate", "Fita de butilo"],
        },
      ],
      metal: [
        { group: "Beiral e cumeeira", items: ["Chapa de beiral", "Cumeeiras", "Ventilação de cumeeira"] },
        {
          group: "Drenagem de águas",
          items: ["Caleiras", "Tubos de queda", "Suportes de caleira", "Grelhas guarda-folhas"],
        },
        {
          group: "Remates metálicos",
          items: ["Chapa de rincão", "Chapa de remate de parede", "Chapa de remate de chaminé", "Avental de remate"],
        },
        { group: "Proteção contra neve", items: ["Guarda-neve", "Barreira quebra-neve"] },
      ],
      insulation: [
        { group: "Mineral e fibra de madeira", items: ["Lã mineral", "Painel de fibra de madeira"] },
        { group: "Painéis rígidos", items: ["Placa isolante EPS", "Placa isolante XPS", "Placa isolante PIR"] },
        { group: "Cobertura e fachada", items: ["Mantas isolantes de cobertura", "Placa isolante de fachada"] },
      ],
      fasteners: [
        {
          group: "Pregos e parafusos",
          items: ["Pregos para cobertura", "Parafusos para madeira", "Parafusos de cobertura com junta EPDM"],
        },
        { group: "Grampos e fixações", items: ["Grampos anti-tempestade", "Grampos anti-vento", "Anilhas de vedação"] },
      ],
      covering: [
        { group: "Telhas", items: ["Telhas cerâmicas", "Telhas de betão", "Ardósia"] },
        {
          group: "Chapa e telhas asfálticas",
          items: ["Telhas metálicas", "Telhas asfálticas", "Cobertura em junta agrafada"],
        },
      ],
      hgc: [
        {
          group: "Construção em madeira",
          items: [
            "HGC madeira maciça estrutural (KVH)",
            "HGC madeira lamelada colada (BSH)",
            "HGC madeira lamelada cruzada (BSP)",
            "HGC ripas com junta dentada",
            "HGC painéis de cofragem",
          ],
        },
        {
          group: "Cobertura e envolvente",
          items: ["HGC manta sub-telha", "HGC membrana impermeabilizante EPDM", "HGC tábuas de terraço"],
        },
        {
          group: "Gesso cartonado",
          items: ["HGC placas de gesso cartonado", "HGC painéis de construção e perfis para tabique"],
        },
        { group: "Isolamento", items: ["HGC isolamento de lã mineral"] },
      ],
      gabs: [
        {
          group: "Telhado plano",
          items: [
            "GABS membrana de cobertura EPDM",
            "GABS caleira de drenagem",
            "GABS tubo de inspeção",
            "GABS perfil guarda-gravilha",
          ],
        },
        {
          group: "Telhado inclinado",
          items: ["GABS caleiras", "GABS tubos de queda", "GABS guarda-folhas", "GABS remate de chaminé"],
        },
        { group: "Latoaria e para-raios", items: ["GABS kit para-raios"] },
      ],
      soprema: [
        {
          group: "Primários",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 primário metálico (110955)",
          ],
        },
        {
          group: "Impermeabilização",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Acabamento e selagem",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Acessórios",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT pó catalisador (221170)",
            "Soprema Alsan Promo vedante (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 areia de carga (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Janelas de telhado",
          items: [
            "Velux GGL janela de telhado (madeira)",
            "Velux GGU janela de telhado (PVC)",
            "Velux GPU janela basculante/pivotante",
            "Velux GVT janela de acesso ao sótão (telhado frio)",
          ],
        },
        {
          group: "Kits de vedação",
          items: [
            "Velux EDW kit de vedação (telhas)",
            "Velux EDL kit de vedação (material de telhado plano)",
            "Velux EDN kit de vedação (telhas planas)",
            "Velux BFX forro interior",
            "Velux BBX gola corta-vapor",
            "Velux BDX gola isolante",
          ],
        },
        { group: "Acessórios e proteção solar", items: ["Velux SML estore solar", "Velux MHL toldo corta-calor"] },
        {
          group: "Janelas para telhado plano",
          items: ["Velux CVP janela para telhado plano", "Velux CFP cúpula fixa (telhado frio)"],
        },
      ],
      glaromat: [
        {
          group: "Parafusos Karro e sobreposição",
          items: [
            "Glaromat parafuso Karro K18H20 (6.5×20mm, junta EPDM)",
            "Glaromat parafuso Karro K18SI20 (inox, junta EPDM)",
            "Glaromat parafuso de sobreposição UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Parafusos para madeira e construção",
          items: [
            "Glaromat parafuso sextavado de construção BAUS12120 (M12×120mm)",
            "Glaromat parafusos sextavados para madeira",
            "Glaromat parafuso autoperfurante TS para madeira",
            "Glaromat parafuso para conectores de madeira ATF HSCH5050",
          ],
        },
        {
          group: "Parafusos especiais",
          items: [
            "Glaromat parafuso de cabeça disco",
            "Glaromat parafusos de latoeiro",
            "Glaromat parafusos de carpinteiro",
            "Glaromat parafusos para chapas onduladas",
            "Glaromat parafusos de fachada",
          ],
        },
      ],
      gyso: [
        {
          group: "Membranas e películas de cobertura",
          items: [
            "Gyso-Top Weld 520 manta sub-telha",
            "Gyso-Top Weld Connect (golas de penetração)",
            "Gyso-Top Weld Coil (chapa de beiral revestida a PVC)",
            "Gyso membrana de fachada",
            "Gyso barreira de vapor",
          ],
        },
        {
          group: "Colagem e vedação",
          items: [
            "Gyso Polyflex 444 adesivo de montagem (Art. 70920)",
            "Gyso fita vedante",
            "Gyso fita adesiva de face única",
            "Geistlich Ligamenta adesivo PU",
          ],
        },
        {
          group: "Acessórios",
          items: ["Gyso primário", "Gyso limpador e toalhetes", "Gyso película protetora/de cobertura"],
        },
      ],
    },
  },
  pl: {
    cats: {
      wood: "Drewno",
      membranes: "Membrany",
      metal: "Obróbki blacharskie",
      insulation: "Izolacja",
      fasteners: "Łączniki",
      covering: "Pokrycie dachowe",
      hgc: "HGC (hurtownia)",
      gabs: "GABS (blacharstwo)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (okna dachowe)",
      glaromat: "Glaromat (śruby)",
      gyso: "Gyso (klejenie/uszczelnianie)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Łaty", items: ["Kontrłaty", "Łaty", "Łaty kalenicowe", "Łaty wentylacyjne"] },
        {
          group: "Drewno konstrukcyjne",
          items: ["Krokwie", "Płatwie", "Belka kalenicowa", "Belki stropowe", "Wiązary dachowe"],
        },
        { group: "Płyty i deskowanie", items: ["Deskowanie połaci", "Deski czołowe", "Deski okapowe", "Płyty OSB"] },
      ],
      membranes: [
        {
          group: "Membrany podkładowe",
          items: [
            "Membrana dachowa",
            "Membrana wstępnego krycia",
            "Papa podkładowa",
            "Membrana wysokoparoprzepuszczalna",
          ],
        },
        { group: "Folie paroizolacyjne", items: ["Folia paroizolacyjna", "Membrana hamująca parę"] },
        {
          group: "Taśmy i akcesoria",
          items: [
            "Taśma kalenicowa wentylacyjna",
            "Taśma uszczelniająca",
            "Samoprzylepna taśma obróbkowa",
            "Taśma butylowa",
          ],
        },
      ],
      metal: [
        { group: "Okap i kalenica", items: ["Blacha okapowa", "Gąsiory", "Wentylacja kalenicy"] },
        { group: "Odwodnienie", items: ["Rynny", "Rury spustowe", "Uchwyty rynnowe", "Kratki przeciwliściowe"] },
        {
          group: "Obróbki blacharskie",
          items: ["Obróbka koszowa", "Obróbka przyścienna", "Obróbka kominowa", "Fartuch obróbkowy"],
        },
        { group: "Ochrona przeciwśniegowa", items: ["Płotki przeciwśniegowe", "Bariera śniegowa"] },
      ],
      insulation: [
        { group: "Mineralna i włóknista", items: ["Wełna mineralna", "Płyta z włókna drzewnego"] },
        { group: "Płyty sztywne", items: ["Płyta styropianowa EPS", "Płyta izolacyjna XPS", "Płyta izolacyjna PIR"] },
        { group: "Dach i fasada", items: ["Maty izolacyjne dachowe", "Płyta izolacyjna elewacyjna"] },
      ],
      fasteners: [
        {
          group: "Gwoździe i wkręty",
          items: ["Gwoździe dekarskie", "Wkręty do drewna", "Wkręty dekarskie z podkładką EPDM"],
        },
        { group: "Klamry i mocowania", items: ["Klamry sztormowe", "Klamry wiatrowe", "Podkładki uszczelniające"] },
      ],
      covering: [
        { group: "Dachówki", items: ["Dachówka ceramiczna", "Dachówka betonowa", "Łupek dachowy"] },
        { group: "Blacha i gont", items: ["Blachodachówka", "Gont bitumiczny", "Pokrycie na rąbek stojący"] },
      ],
      hgc: [
        {
          group: "Budownictwo drewniane",
          items: [
            "HGC drewno konstrukcyjne lite (KVH)",
            "HGC drewno klejone warstwowo (BSH)",
            "HGC drewno klejone krzyżowo (BSP)",
            "HGC łaty łączone na mikrowczep",
            "HGC płyty szalunkowe",
          ],
        },
        {
          group: "Dach i powłoka budynku",
          items: ["HGC membrana dachowa podkładowa", "HGC membrana uszczelniająca EPDM", "HGC deski tarasowe"],
        },
        {
          group: "Zabudowa gipsowo-kartonowa",
          items: ["HGC płyty gipsowo-kartonowe", "HGC płyty budowlane i profile do zabudowy"],
        },
        { group: "Izolacja", items: ["HGC izolacja z wełny mineralnej"] },
      ],
      gabs: [
        {
          group: "Dach płaski",
          items: [
            "GABS membrana dachowa EPDM",
            "GABS rynna odwadniająca",
            "GABS rura kontrolna",
            "GABS profil obrzeżowy na żwir",
          ],
        },
        {
          group: "Dach skośny",
          items: ["GABS rynny", "GABS rury spustowe", "GABS łapacz liści", "GABS czapa kominowa"],
        },
        { group: "Blacharstwo i odgromówka", items: ["GABS zestaw odgromowy"] },
      ],
      soprema: [
        {
          group: "Grunty",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 grunt do metalu (110955)",
          ],
        },
        {
          group: "Hydroizolacja",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Wykończenie i uszczelnienie",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Akcesoria",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT proszek katalizujący (221170)",
            "Soprema Alsan Promo masa uszczelniająca (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 piasek wypełniający (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Okna dachowe",
          items: [
            "Velux GGL okno dachowe (drewno)",
            "Velux GGU okno dachowe (PVC)",
            "Velux GPU okno obrotowo-uchylne",
            "Velux GVT okno wyłazowe (zimny dach)",
          ],
        },
        {
          group: "Kołnierze i ościeżnice",
          items: [
            "Velux EDW kołnierz uszczelniający (dachówka)",
            "Velux EDL kołnierz uszczelniający (materiał płaski)",
            "Velux EDN kołnierz uszczelniający (dachówka płaska)",
            "Velux BFX ościeżnica wewnętrzna",
            "Velux BBX kołnierz paroizolacyjny",
            "Velux BDX rama izolacyjna",
          ],
        },
        {
          group: "Akcesoria i osłony przeciwsłoneczne",
          items: ["Velux SML roleta solarna", "Velux MHL markiza przeciwsłoneczna"],
        },
        {
          group: "Okna do dachu płaskiego",
          items: ["Velux CVP okno do dachu płaskiego", "Velux CFP świetlik stały (zimny dach)"],
        },
      ],
      glaromat: [
        {
          group: "Śruby Karro i zakładkowe",
          items: [
            "Glaromat śruba Karro K18H20 (6.5×20mm, uszczelka EPDM)",
            "Glaromat śruba Karro K18SI20 (stal nierdzewna, uszczelka EPDM)",
            "Glaromat śruba zakładkowa UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Wkręty do drewna i budowlane",
          items: [
            "Glaromat śruba budowlana sześciokątna BAUS12120 (M12×120mm)",
            "Glaromat wkręty sześciokątne do drewna",
            "Glaromat wkręt samowiercący TS do drewna",
            "Glaromat wkręt do łączników ciesielskich ATF HSCH5050",
          ],
        },
        {
          group: "Śruby specjalne",
          items: [
            "Glaromat śruba talerzykowa",
            "Glaromat wkręty blacharskie",
            "Glaromat wkręty ciesielskie",
            "Glaromat wkręty do płyt falistych",
            "Glaromat wkręty fasadowe",
          ],
        },
      ],
      gyso: [
        {
          group: "Membrany i folie dachowe",
          items: [
            "Gyso-Top Weld 520 membrana podkładowa",
            "Gyso-Top Weld Connect (kształtki do przejść)",
            "Gyso-Top Weld Coil (blacha okapowa powlekana PVC)",
            "Gyso folia fasadowa",
            "Gyso folia paroizolacyjna",
          ],
        },
        {
          group: "Klejenie i uszczelnianie",
          items: [
            "Gyso Polyflex 444 klej montażowy (nr art. 70920)",
            "Gyso taśma uszczelniająca",
            "Gyso taśma klejąca jednostronna",
            "Geistlich Ligamenta klej PU",
          ],
        },
        { group: "Akcesoria", items: ["Gyso grunt", "Gyso środki czyszczące i chusteczki", "Gyso folia ochronna"] },
      ],
    },
  },
  sk: {
    cats: {
      wood: "Drevo",
      membranes: "Membrány",
      metal: "Klampiarske práce",
      insulation: "Izolácia",
      fasteners: "Spojovací materiál",
      covering: "Strešná krytina",
      hgc: "HGC (veľkoobchod)",
      gabs: "GABS (klampiarstvo)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (strešné okná)",
      glaromat: "Glaromat (skrutky)",
      gyso: "Gyso (lepenie/tesnenie)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Laty", items: ["Kontralaty", "Laty", "Hrebeňové laty", "Vetracie laty"] },
        { group: "Konštrukčné drevo", items: ["Krokvy", "Väznice", "Hrebeňový trám", "Stropné trámy", "Väzníky"] },
        { group: "Dosky a debnenie", items: ["Debnenie strechy", "Čelné dosky", "Odkvapové dosky", "OSB dosky"] },
      ],
      membranes: [
        {
          group: "Podstrešné fólie",
          items: ["Strešná fólia", "Difúzna fólia", "Asfaltovaný podkladový pás", "Vysoko difúzna membrána"],
        },
        { group: "Parozábrany", items: ["Parozábrana", "Parobrzdná fólia"] },
        {
          group: "Pásky a príslušenstvo",
          items: ["Vetracia páska hrebeňa", "Tesniaca páska", "Samolepiaca lemovacia páska", "Butylová páska"],
        },
      ],
      metal: [
        { group: "Odkvap a hrebeň", items: ["Odkvapový plech", "Hrebenáče", "Vetranie hrebeňa"] },
        { group: "Odvodnenie", items: ["Odkvapy", "Zvody", "Držiaky odkvapov", "Lapače lístia"] },
        {
          group: "Oplechovanie",
          items: ["Úžľabinový plech", "Nástenný lem", "Komínové oplechovanie", "Lemovacia zástera"],
        },
        { group: "Ochrana proti snehu", items: ["Snehové zachytávače", "Snehová zábrana"] },
      ],
      insulation: [
        { group: "Minerálna a drevovláknitá", items: ["Minerálna vlna", "Drevovláknitá izolačná doska"] },
        { group: "Tvrdé dosky", items: ["EPS izolačná doska", "XPS izolačná doska", "PIR izolačná doska"] },
        { group: "Strecha a fasáda", items: ["Strešné izolačné rohože", "Fasádna izolačná doska"] },
      ],
      fasteners: [
        {
          group: "Klince a skrutky",
          items: ["Strešné klince", "Skrutky do dreva", "Strešné skrutky s EPDM podložkou"],
        },
        { group: "Spony a upevnenie", items: ["Búrkové spony", "Veterné spony", "Tesniace podložky"] },
      ],
      covering: [
        { group: "Škridly", items: ["Keramické škridly", "Betónové škridly", "Bridlica"] },
        { group: "Plech a šindle", items: ["Plechová krytina", "Asfaltové šindle", "Krytina na stojatú drážku"] },
      ],
      hgc: [
        {
          group: "Drevostavby",
          items: [
            "HGC konštrukčné rezivo (KVH)",
            "HGC lepené lamelové drevo (BSH)",
            "HGC krížom lepené drevo (BSP)",
            "HGC laty s ozubeným spojom",
            "HGC debniace dosky",
          ],
        },
        {
          group: "Strecha a obálka budovy",
          items: ["HGC podstrešná fólia", "HGC hydroizolačná membrána EPDM", "HGC terasové dosky"],
        },
        { group: "Sadrokartón", items: ["HGC sadrokartónové dosky", "HGC stavebné dosky a profily na sadrokartón"] },
        { group: "Izolácia", items: ["HGC izolácia z minerálnej vlny"] },
      ],
      gabs: [
        {
          group: "Plochá strecha",
          items: [
            "GABS strešná membrána EPDM",
            "GABS odvodňovací žľab",
            "GABS kontrolná rúra",
            "GABS okrajový profil na štrk",
          ],
        },
        {
          group: "Šikmá strecha",
          items: ["GABS odkvapy", "GABS zvody", "GABS lapač lístia", "GABS komínová strieška"],
        },
        { group: "Klampiarstvo a bleskozvod", items: ["GABS bleskozvodná sada"] },
      ],
      soprema: [
        {
          group: "Základné nátery",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 náter na kov (110955)",
          ],
        },
        {
          group: "Hydroizolácia",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Povrchová úprava a tesnenie",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Príslušenstvo",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT katalyzátorový prášok (221170)",
            "Soprema Alsan Promo tesniaca hmota (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 plniaci piesok (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Strešné okná",
          items: [
            "Velux GGL strešné okno (drevo)",
            "Velux GGU strešné okno (PVC)",
            "Velux GPU kyvné/výklopné okno",
            "Velux GVT vstupné okno (studená strecha)",
          ],
        },
        {
          group: "Lemovacie súpravy",
          items: [
            "Velux EDW lemovacia súprava (škridla)",
            "Velux EDL lemovacia súprava (plochý strešný materiál)",
            "Velux EDN lemovacia súprava (plochá škridla)",
            "Velux BFX vnútorné ostenie",
            "Velux BBX parotesná manžeta",
            "Velux BDX izolačný rámik",
          ],
        },
        { group: "Príslušenstvo a tienenie", items: ["Velux SML solárna roleta", "Velux MHL tepelnoizolačná markíza"] },
        {
          group: "Okná pre plochú strechu",
          items: ["Velux CVP okno pre plochú strechu", "Velux CFP pevný svetlík (studená strecha)"],
        },
      ],
      glaromat: [
        {
          group: "Skrutky Karro a prekladové",
          items: [
            "Glaromat skrutka Karro K18H20 (6.5×20mm, EPDM podložka)",
            "Glaromat skrutka Karro K18SI20 (nerez, EPDM podložka)",
            "Glaromat prekladová skrutka UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Skrutky do dreva a stavebné",
          items: [
            "Glaromat šesťhranná stavebná skrutka BAUS12120 (M12×120mm)",
            "Glaromat šesťhranné skrutky do dreva",
            "Glaromat TS samovrtná skrutka do dreva",
            "Glaromat skrutka pre drevené spojky ATF HSCH5050",
          ],
        },
        {
          group: "Špeciálne skrutky",
          items: [
            "Glaromat tanierová skrutka Disc",
            "Glaromat klampiarske skrutky",
            "Glaromat tesárske skrutky",
            "Glaromat skrutky do vlnitých platní",
            "Glaromat fasádne skrutky",
          ],
        },
      ],
      gyso: [
        {
          group: "Strešné membrány a fólie",
          items: [
            "Gyso-Top Weld 520 podstrešná fólia",
            "Gyso-Top Weld Connect (manžety pre prestupy)",
            "Gyso-Top Weld Coil (odkvapový plech s PVC povrstvením)",
            "Gyso fasádna fólia",
            "Gyso parozábrana",
          ],
        },
        {
          group: "Lepenie a tesnenie",
          items: [
            "Gyso Polyflex 444 montážne lepidlo (Art. 70920)",
            "Gyso tesniaca páska",
            "Gyso jednostranná lepiaca páska",
            "Geistlich Ligamenta PU lepidlo",
          ],
        },
        {
          group: "Príslušenstvo",
          items: ["Gyso základný náter", "Gyso čistiace prostriedky a utierky", "Gyso ochranná/krycia fólia"],
        },
      ],
    },
  },
  cs: {
    cats: {
      wood: "Dřevo",
      membranes: "Membrány",
      metal: "Klempířské práce",
      insulation: "Izolace",
      fasteners: "Spojovací materiál",
      covering: "Střešní krytina",
      hgc: "HGC (velkoobchod)",
      gabs: "GABS (klempířství)",
      soprema: "Soprema (Liquids)",
      velux: "Velux (střešní okna)",
      glaromat: "Glaromat (šrouby)",
      gyso: "Gyso (lepení/těsnění)",
    },
    links: {
      hgc: "https://www.hgc.ch",
      gabs: "https://www.gabs.ch",
      soprema: "https://www.soprema.ch",
      velux: "https://www.velux.ch",
      glaromat: "https://www.glaromat.ch",
      gyso: "https://www.gyso.ch",
    },
    items: {
      wood: [
        { group: "Latě", items: ["Kontralatě", "Latě", "Hřebenové latě", "Větrací latě"] },
        { group: "Konstrukční dřevo", items: ["Krokve", "Vaznice", "Hřebenový trám", "Stropní trámy", "Vazníky"] },
        { group: "Desky a bednění", items: ["Bednění střechy", "Čelní prkna", "Okapová prkna", "OSB desky"] },
      ],
      membranes: [
        {
          group: "Podstřešní fólie",
          items: ["Střešní fólie", "Difúzní fólie", "Asfaltový podkladní pás", "Vysoce difúzní membrána"],
        },
        { group: "Parozábrany", items: ["Parozábrana", "Parobrzdná fólie"] },
        {
          group: "Pásky a příslušenství",
          items: ["Větrací páska hřebene", "Těsnicí páska", "Samolepicí lemovací páska", "Butylová páska"],
        },
      ],
      metal: [
        { group: "Okap a hřeben", items: ["Okapový plech", "Hřebenáče", "Větrání hřebene"] },
        { group: "Odvodnění", items: ["Okapy", "Svody", "Držáky okapů", "Lapače listí"] },
        { group: "Oplechování", items: ["Úžlabí", "Nástěnný lem", "Komínové oplechování", "Lemovací zástěra"] },
        { group: "Ochrana proti sněhu", items: ["Sněhové zábrany", "Sněhová bariéra"] },
      ],
      insulation: [
        { group: "Minerální a dřevovláknitá", items: ["Minerální vlna", "Dřevovláknitá izolační deska"] },
        { group: "Tvrdé desky", items: ["EPS izolační deska", "XPS izolační deska", "PIR izolační deska"] },
        { group: "Střecha a fasáda", items: ["Střešní izolační rohože", "Fasádní izolační deska"] },
      ],
      fasteners: [
        { group: "Hřebíky a vruty", items: ["Střešní hřebíky", "Vruty do dřeva", "Střešní vruty s EPDM podložkou"] },
        { group: "Spony a upevnění", items: ["Bouřkové spony", "Větrné spony", "Těsnicí podložky"] },
      ],
      covering: [
        { group: "Tašky", items: ["Keramické tašky", "Betonové tašky", "Břidlice"] },
        { group: "Plech a šindele", items: ["Plechová krytina", "Asfaltové šindele", "Krytina na stojatou drážku"] },
      ],
      hgc: [
        {
          group: "Dřevostavby",
          items: [
            "HGC konstrukční řezivo (KVH)",
            "HGC lepené lamelové dřevo (BSH)",
            "HGC křížem lepené dřevo (BSP)",
            "HGC latě s ozubeným spojem",
            "HGC bednicí desky",
          ],
        },
        {
          group: "Střecha a obálka budovy",
          items: ["HGC podstřešní fólie", "HGC hydroizolační membrána EPDM", "HGC terasová prkna"],
        },
        { group: "Sádrokarton", items: ["HGC sádrokartonové desky", "HGC stavební desky a profily na sádrokarton"] },
        { group: "Izolace", items: ["HGC izolace z minerální vlny"] },
      ],
      gabs: [
        {
          group: "Plochá střecha",
          items: [
            "GABS střešní membrána EPDM",
            "GABS odvodňovací žlab",
            "GABS kontrolní trubka",
            "GABS okrajový profil na štěrk",
          ],
        },
        { group: "Šikmá střecha", items: ["GABS okapy", "GABS svody", "GABS lapač listí", "GABS komínová stříška"] },
        { group: "Klempířství a hromosvod", items: ["GABS sada hromosvodu"] },
      ],
      soprema: [
        {
          group: "Základní nátěry",
          items: [
            "Soprema Alsan Epox 133 Zero (154850)",
            "Soprema Alsan Epox 136 Zero (154811)",
            "Soprema Alsan PMMA 170 (99153)",
            "Soprema Alsan PMMA 176 (99155)",
            "Soprema Alsan Reku 04 (153643)",
            "Soprema Alsan Reku P70 (104722)",
            "Soprema Alsan Reku P31 (152784)",
            "Soprema Alsan 104 nátěr na kov (110955)",
          ],
        },
        {
          group: "Hydroizolace",
          items: [
            "Soprema Alsan PMMA 573 Handapplication (267942)",
            "Soprema Alsan PMMA 770 (99162)",
            "Soprema Alsan PMMA 770 TX (99163)",
            "Soprema Alsan Flashing Neo (221714)",
            "Soprema Alsan Flashing Quadro (154244)",
            "Soprema Alsan PUR 450 (104616)",
            "Soprema Alsan Decotop 113 ESL (120272)",
            "Soprema Alsan Acoustifloor (156422)",
          ],
        },
        {
          group: "Povrchová úprava a těsnění",
          items: [
            "Soprema Alsan PUR 500 FT (31548)",
            "Soprema Alsan PUR 940 F Zero (154879)",
            "Soprema Alsan Epox 930 F Zero (154849)",
            "Soprema Alsan PMMA 970 F (158991)",
            "Soprema Alsan MMA 974 FT (155664)",
          ],
        },
        {
          group: "Příslušenství",
          items: [
            "Soprema Alsan Fleece 110 P (41556)",
            "Soprema Alsan CAT katalyzátorový prášek (221170)",
            "Soprema Alsan Promo těsnicí hmota (300154)",
            "Soprema Joint Tape 1 mm (156712)",
            "Soprema Alsan Surface Cleaner (267611)",
            "Soprema Alsan Talofix 112 (120467)",
            "Soprema Alsan GC Typ 1 plnicí písek (259793)",
          ],
        },
      ],
      velux: [
        {
          group: "Střešní okna",
          items: [
            "Velux GGL střešní okno (dřevo)",
            "Velux GGU střešní okno (PVC)",
            "Velux GPU kyvné/výklopné okno",
            "Velux GVT vstupní okno (studená střecha)",
          ],
        },
        {
          group: "Lemovací sady",
          items: [
            "Velux EDW lemovací sada (taška)",
            "Velux EDL lemovací sada (plochý střešní materiál)",
            "Velux EDN lemovací sada (plochá taška)",
            "Velux BFX vnitřní ostění",
            "Velux BBX parotěsná manžeta",
            "Velux BDX izolační rámeček",
          ],
        },
        { group: "Příslušenství a stínění", items: ["Velux SML solární roleta", "Velux MHL tepelně izolační markýza"] },
        {
          group: "Okna pro plochou střechu",
          items: ["Velux CVP okno pro plochou střechu", "Velux CFP pevný světlík (studená střecha)"],
        },
      ],
      glaromat: [
        {
          group: "Šrouby Karro a přeplátované",
          items: [
            "Glaromat šroub Karro K18H20 (6.5×20mm, EPDM podložka)",
            "Glaromat šroub Karro K18SI20 (nerez, EPDM podložka)",
            "Glaromat přeplátovaný šroub UBER4820 (4.8×20mm)",
          ],
        },
        {
          group: "Vruty do dřeva a stavební",
          items: [
            "Glaromat šestihranný stavební šroub BAUS12120 (M12×120mm)",
            "Glaromat šestihranné vruty do dřeva",
            "Glaromat TS samovrtný vrut do dřeva",
            "Glaromat šroub pro dřevěné spojky ATF HSCH5050",
          ],
        },
        {
          group: "Speciální šrouby",
          items: [
            "Glaromat talířový šroub Disc",
            "Glaromat klempířské šrouby",
            "Glaromat tesařské šrouby",
            "Glaromat šrouby do vlnitých desek",
            "Glaromat fasádní šrouby",
          ],
        },
      ],
      gyso: [
        {
          group: "Střešní membrány a fólie",
          items: [
            "Gyso-Top Weld 520 podstřešní fólie",
            "Gyso-Top Weld Connect (manžety pro prostupy)",
            "Gyso-Top Weld Coil (okapový plech s PVC povrstvením)",
            "Gyso fasádní fólie",
            "Gyso parozábrana",
          ],
        },
        {
          group: "Lepení a těsnění",
          items: [
            "Gyso Polyflex 444 montážní lepidlo (Art. 70920)",
            "Gyso těsnicí páska",
            "Gyso jednostranná lepicí páska",
            "Geistlich Ligamenta PU lepidlo",
          ],
        },
        {
          group: "Příslušenství",
          items: ["Gyso základní nátěr", "Gyso čisticí prostředky a ubrousky", "Gyso ochranná/krycí fólie"],
        },
      ],
    },
  },
};

export const TOOLS_CATALOG = {
  en: {
    cats: { hgc: "HGC (tools)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        { group: "Machines", type: "power", items: ["HGC cordless drill", "HGC rotary hammer", "HGC angle grinder"] },
        { group: "Hand tools", type: "hand", items: ["HGC tool box set", "HGC measuring tools"] },
      ],
      sfs: [
        {
          group: "Power tools",
          type: "power",
          items: [
            "SFS Bosch rotary hammer",
            "SFS Festool circular saw",
            "SFS Milwaukee cordless driver",
            "SFS Fein Multimaster",
          ],
        },
        { group: "Hand tools", type: "hand", items: ["SFS Knipex pliers set", "SFS PB Swiss Tools screwdriver set"] },
        { group: "Protective equipment", type: "safety", items: ["SFS Zarges aluminium ladder", "SFS PSA safety kit"] },
      ],
      hasler: [
        {
          group: "Rental equipment",
          type: "rental",
          items: ["Hasler rental drill", "Hasler rental pressure washer", "Hasler rental scarifier"],
        },
        { group: "Tools & PPE", type: "safety", items: ["Hasler tool set", "Hasler personal protective equipment"] },
      ],
    },
  },
  de: {
    cats: { hgc: "HGC (Werkzeuge)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Maschinen",
          type: "power",
          items: ["HGC Akkubohrschrauber", "HGC Bohrhammer", "HGC Winkelschleifer"],
        },
        { group: "Handwerkzeug", type: "hand", items: ["HGC Werkzeugkoffer-Set", "HGC Messwerkzeuge"] },
      ],
      sfs: [
        {
          group: "Elektrowerkzeuge",
          type: "power",
          items: [
            "SFS Bosch Bohrhammer",
            "SFS Festool Handkreissäge",
            "SFS Milwaukee Akkuschrauber",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Handwerkzeug",
          type: "hand",
          items: ["SFS Knipex Zangenset", "SFS PB Swiss Tools Schraubenzieher-Set"],
        },
        { group: "Schutzausrüstung", type: "safety", items: ["SFS Zarges Alu-Leiter", "SFS PSA-Sicherheitsset"] },
      ],
      hasler: [
        {
          group: "Mietgeräte",
          type: "rental",
          items: ["Hasler Mietbohrmaschine", "Hasler Miet-Hochdruckreiniger", "Hasler Miet-Vertikutierer"],
        },
        {
          group: "Werkzeug & PSA",
          type: "safety",
          items: ["Hasler Werkzeugset", "Hasler persönliche Schutzausrüstung"],
        },
      ],
    },
  },
  fr: {
    cats: { hgc: "HGC (outils)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Machines",
          type: "power",
          items: ["HGC perceuse-visseuse sans fil", "HGC marteau-perforateur", "HGC meuleuse d'angle"],
        },
        { group: "Outils à main", type: "hand", items: ["HGC coffret d'outils", "HGC outils de mesure"] },
      ],
      sfs: [
        {
          group: "Outils électriques",
          type: "power",
          items: [
            "SFS Bosch marteau-perforateur",
            "SFS Festool scie circulaire",
            "SFS Milwaukee visseuse sans fil",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Outils à main",
          type: "hand",
          items: ["SFS Knipex jeu de pinces", "SFS PB Swiss Tools jeu de tournevis"],
        },
        {
          group: "Équipement de protection",
          type: "safety",
          items: ["SFS Zarges échelle aluminium", "SFS kit de sécurité EPI"],
        },
      ],
      hasler: [
        {
          group: "Location de matériel",
          type: "rental",
          items: [
            "Hasler perceuse de location",
            "Hasler nettoyeur haute pression de location",
            "Hasler scarificateur de location",
          ],
        },
        {
          group: "Outils & EPI",
          type: "safety",
          items: ["Hasler set d'outils", "Hasler équipement de protection individuelle"],
        },
      ],
    },
  },
  it: {
    cats: { hgc: "HGC (attrezzi)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Macchine",
          type: "power",
          items: ["HGC trapano avvitatore a batteria", "HGC martello perforatore", "HGC smerigliatrice angolare"],
        },
        { group: "Utensili manuali", type: "hand", items: ["HGC set cassetta attrezzi", "HGC strumenti di misura"] },
      ],
      sfs: [
        {
          group: "Utensili elettrici",
          type: "power",
          items: [
            "SFS Bosch martello perforatore",
            "SFS Festool sega circolare",
            "SFS Milwaukee avvitatore a batteria",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Utensili manuali",
          type: "hand",
          items: ["SFS Knipex set pinze", "SFS PB Swiss Tools set cacciaviti"],
        },
        {
          group: "Dispositivi di protezione",
          type: "safety",
          items: ["SFS Zarges scala in alluminio", "SFS kit sicurezza DPI"],
        },
      ],
      hasler: [
        {
          group: "Noleggio attrezzature",
          type: "rental",
          items: ["Hasler trapano a noleggio", "Hasler idropulitrice a noleggio", "Hasler scarificatore a noleggio"],
        },
        {
          group: "Utensili e DPI",
          type: "safety",
          items: ["Hasler set utensili", "Hasler dispositivi di protezione individuale"],
        },
      ],
    },
  },
  es: {
    cats: { hgc: "HGC (herramientas)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Máquinas",
          type: "power",
          items: ["HGC taladro atornillador a batería", "HGC martillo perforador", "HGC amoladora angular"],
        },
        {
          group: "Herramientas manuales",
          type: "hand",
          items: ["HGC set de caja de herramientas", "HGC instrumentos de medición"],
        },
      ],
      sfs: [
        {
          group: "Herramientas eléctricas",
          type: "power",
          items: [
            "SFS Bosch martillo perforador",
            "SFS Festool sierra circular",
            "SFS Milwaukee atornillador a batería",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Herramientas manuales",
          type: "hand",
          items: ["SFS Knipex juego de alicates", "SFS PB Swiss Tools juego de destornilladores"],
        },
        {
          group: "Equipo de protección",
          type: "safety",
          items: ["SFS Zarges escalera de aluminio", "SFS kit de seguridad EPI"],
        },
      ],
      hasler: [
        {
          group: "Equipos de alquiler",
          type: "rental",
          items: [
            "Hasler taladro de alquiler",
            "Hasler hidrolimpiadora de alquiler",
            "Hasler escarificador de alquiler",
          ],
        },
        {
          group: "Herramientas y EPI",
          type: "safety",
          items: ["Hasler set de herramientas", "Hasler equipo de protección individual"],
        },
      ],
    },
  },
  pt: {
    cats: { hgc: "HGC (ferramentas)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Máquinas",
          type: "power",
          items: ["HGC berbequim aparafusadora a bateria", "HGC martelo perfurador", "HGC rebarbadora angular"],
        },
        {
          group: "Ferramentas manuais",
          type: "hand",
          items: ["HGC conjunto de caixa de ferramentas", "HGC instrumentos de medição"],
        },
      ],
      sfs: [
        {
          group: "Ferramentas elétricas",
          type: "power",
          items: [
            "SFS Bosch martelo perfurador",
            "SFS Festool serra circular",
            "SFS Milwaukee aparafusadora a bateria",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Ferramentas manuais",
          type: "hand",
          items: ["SFS Knipex conjunto de alicates", "SFS PB Swiss Tools conjunto de chaves de fendas"],
        },
        {
          group: "Equipamento de proteção",
          type: "safety",
          items: ["SFS Zarges escada de alumínio", "SFS kit de segurança EPI"],
        },
      ],
      hasler: [
        {
          group: "Equipamento de aluguer",
          type: "rental",
          items: [
            "Hasler berbequim de aluguer",
            "Hasler lavadora de alta pressão de aluguer",
            "Hasler escarificador de aluguer",
          ],
        },
        {
          group: "Ferramentas e EPI",
          type: "safety",
          items: ["Hasler conjunto de ferramentas", "Hasler equipamento de proteção individual"],
        },
      ],
    },
  },
  pl: {
    cats: { hgc: "HGC (narzędzia)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Maszyny",
          type: "power",
          items: ["HGC wkrętarko-wiertarka akumulatorowa", "HGC młot udarowy", "HGC szlifierka kątowa"],
        },
        {
          group: "Narzędzia ręczne",
          type: "hand",
          items: ["HGC zestaw skrzynki narzędziowej", "HGC przyrządy pomiarowe"],
        },
      ],
      sfs: [
        {
          group: "Elektronarzędzia",
          type: "power",
          items: [
            "SFS Bosch młot udarowy",
            "SFS Festool pilarka tarczowa",
            "SFS Milwaukee wkrętarka akumulatorowa",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Narzędzia ręczne",
          type: "hand",
          items: ["SFS Knipex zestaw szczypiec", "SFS PB Swiss Tools zestaw śrubokrętów"],
        },
        {
          group: "Sprzęt ochronny",
          type: "safety",
          items: ["SFS Zarges drabina aluminiowa", "SFS zestaw bezpieczeństwa PSA"],
        },
      ],
      hasler: [
        {
          group: "Sprzęt wynajmowany",
          type: "rental",
          items: [
            "Hasler wiertarka do wynajęcia",
            "Hasler myjka ciśnieniowa do wynajęcia",
            "Hasler wertykulator do wynajęcia",
          ],
        },
        {
          group: "Narzędzia i PSA",
          type: "safety",
          items: ["Hasler zestaw narzędzi", "Hasler środki ochrony indywidualnej"],
        },
      ],
    },
  },
  sk: {
    cats: { hgc: "HGC (náradie)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Stroje",
          type: "power",
          items: ["HGC akumulátorová vŕtačka", "HGC vŕtacie kladivo", "HGC uhlová brúska"],
        },
        { group: "Ručné náradie", type: "hand", items: ["HGC sada kufra na náradie", "HGC meracie nástroje"] },
      ],
      sfs: [
        {
          group: "Elektrické náradie",
          type: "power",
          items: [
            "SFS Bosch vŕtacie kladivo",
            "SFS Festool okružná píla",
            "SFS Milwaukee akumulátorová vŕtačka",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Ručné náradie",
          type: "hand",
          items: ["SFS Knipex sada klieští", "SFS PB Swiss Tools sada skrutkovačov"],
        },
        {
          group: "Ochranné vybavenie",
          type: "safety",
          items: ["SFS Zarges hliníkový rebrík", "SFS bezpečnostná súprava OOPP"],
        },
      ],
      hasler: [
        {
          group: "Prenajímané zariadenia",
          type: "rental",
          items: [
            "Hasler prenájom vŕtačky",
            "Hasler prenájom vysokotlakového čističa",
            "Hasler prenájom vertikutátora",
          ],
        },
        {
          group: "Náradie a OOPP",
          type: "safety",
          items: ["Hasler sada náradia", "Hasler osobné ochranné prostriedky"],
        },
      ],
    },
  },
  cs: {
    cats: { hgc: "HGC (nářadí)", sfs: "SFS", hasler: "Hasler (Proficenter)" },
    links: { hgc: "https://www.hgc.ch", sfs: "https://www.construction-sfs.ch", hasler: "https://www.hasler.ch" },
    items: {
      hgc: [
        {
          group: "Stroje",
          type: "power",
          items: ["HGC akumulátorová vrtačka", "HGC vrtací kladivo", "HGC úhlová bruska"],
        },
        { group: "Ruční nářadí", type: "hand", items: ["HGC sada kufru na nářadí", "HGC měřicí nástroje"] },
      ],
      sfs: [
        {
          group: "Elektrické nářadí",
          type: "power",
          items: [
            "SFS Bosch vrtací kladivo",
            "SFS Festool okružní pila",
            "SFS Milwaukee akumulátorová vrtačka",
            "SFS Fein Multimaster",
          ],
        },
        {
          group: "Ruční nářadí",
          type: "hand",
          items: ["SFS Knipex sada kleští", "SFS PB Swiss Tools sada šroubováků"],
        },
        {
          group: "Ochranné vybavení",
          type: "safety",
          items: ["SFS Zarges hliníkový žebřík", "SFS bezpečnostní sada OOPP"],
        },
      ],
      hasler: [
        {
          group: "Pronajímaná technika",
          type: "rental",
          items: ["Hasler pronájem vrtačky", "Hasler pronájem vysokotlakého čističe", "Hasler pronájem vertikutátoru"],
        },
        { group: "Nářadí a OOPP", type: "safety", items: ["Hasler sada nářadí", "Hasler osobní ochranné prostředky"] },
      ],
    },
  },
};
