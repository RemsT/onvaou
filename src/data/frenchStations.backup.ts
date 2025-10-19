import { Station } from '../types';

/**
 * Base de données des gares françaises avec horaires GTFS
 * Source: SNCF Open Data - Référentiel des gares voyageurs + données GTFS
 * Total: 500 gares avec horaires de trains
 *
 * Filtrée automatiquement le 2025-10-16
 * Seules les gares présentes dans les données GTFS SNCF sont incluses
 */
export const frenchStations: Station[] = [
  {
    "id": 1,
    "name": "La Pauline-Hyères",
    "sncf_id": "87755314",
    "lat": 43.13715,
    "lon": 6.035836
  },
  {
    "id": 2,
    "name": "Le Tréport-Mers",
    "sncf_id": "87317529",
    "lat": 50.063136,
    "lon": 1.377592
  },
  {
    "id": 3,
    "name": "Le Méridien",
    "sncf_id": "87721522",
    "lat": 45.768913,
    "lon": 4.748268
  },
  {
    "id": 4,
    "name": "Muret",
    "sncf_id": "87611038",
    "lat": 43.46328,
    "lon": 1.323204
  },
  {
    "id": 5,
    "name": "Chantenay-St-Imbert",
    "sncf_id": "87696302",
    "lat": 46.729691,
    "lon": 3.170068
  },
  {
    "id": 6,
    "name": "St-Clair-les-Roches",
    "sncf_id": "87722652",
    "lat": 45.449297,
    "lon": 4.768972
  },
  {
    "id": 7,
    "name": "Paris-Bercy",
    "sncf_id": "87686667",
    "lat": 48.840057,
    "lon": 2.385021
  },
  {
    "id": 8,
    "name": "Breteuil-Embranchement",
    "sncf_id": "87313247",
    "lat": 49.626296,
    "lon": 2.384546
  },
  {
    "id": 9,
    "name": "St-Brice-sur-Vienne",
    "sncf_id": "87592691",
    "lat": 45.878117,
    "lon": 0.952253
  },
  {
    "id": 10,
    "name": "Vrigne-Meuse",
    "sncf_id": "87172221",
    "lat": 49.700888,
    "lon": 4.843348
  },
  {
    "id": 11,
    "name": "Verneuil-sur-Serre",
    "sncf_id": "87297119",
    "lat": 49.647057,
    "lon": 3.666279
  },
  {
    "id": 12,
    "name": "Munster-Badischhof",
    "sncf_id": "87386540",
    "lat": 48.039082,
    "lon": 7.152972
  },
  {
    "id": 13,
    "name": "St-Léon-sur-l'Isle",
    "sncf_id": "87595264",
    "lat": 45.123255,
    "lon": 0.492394
  },
  {
    "id": 14,
    "name": "Marcelcave",
    "sncf_id": "87313445",
    "lat": 49.85317,
    "lon": 2.582101
  },
  {
    "id": 15,
    "name": "Neufchâteau",
    "sncf_id": "87141291",
    "lat": 48.358234,
    "lon": 5.690054
  },
  {
    "id": 16,
    "name": "Mulhouse-Ville",
    "sncf_id": "87182063",
    "lat": 47.742547,
    "lon": 7.344456
  },
  {
    "id": 17,
    "name": "Joncherey",
    "sncf_id": "87700153",
    "lat": 47.524814,
    "lon": 6.99979
  },
  {
    "id": 18,
    "name": "Rosières",
    "sncf_id": "87313460",
    "lat": 49.822757,
    "lon": 2.711239
  },
  {
    "id": 19,
    "name": "Aubigny-au-Bac",
    "sncf_id": "87345447",
    "lat": 50.268483,
    "lon": 3.158288
  },
  {
    "id": 20,
    "name": "Luc",
    "sncf_id": "87734368",
    "lat": 44.654034,
    "lon": 3.891547
  },
  {
    "id": 21,
    "name": "Saverne",
    "sncf_id": "87212225",
    "lat": 48.744473,
    "lon": 7.360884
  },
  {
    "id": 22,
    "name": "Nogent-le-Rotrou",
    "sncf_id": "87394296",
    "lat": 48.32646,
    "lon": 0.810784
  },
  {
    "id": 23,
    "name": "Sathonay-Rillieux",
    "sncf_id": "87723700",
    "lat": 45.819697,
    "lon": 4.875347
  },
  {
    "id": 24,
    "name": "La Crau",
    "sncf_id": "87755611",
    "lat": 43.144872,
    "lon": 6.068743
  },
  {
    "id": 25,
    "name": "St-Flour-Chaudes-Aigues",
    "sncf_id": "87783175",
    "lat": 45.034306,
    "lon": 3.123274
  },
  {
    "id": 26,
    "name": "Bretigny-Norges",
    "sncf_id": "87712265",
    "lat": 47.389856,
    "lon": 5.110284
  },
  {
    "id": 27,
    "name": "St-Laurent-du-Var",
    "sncf_id": "87756346",
    "lat": 43.662414,
    "lon": 7.194782
  },
  {
    "id": 28,
    "name": "Villefranche-sur-Saône",
    "sncf_id": "87721332",
    "lat": 45.983595,
    "lon": 4.720842
  },
  {
    "id": 29,
    "name": "Vias",
    "sncf_id": "87781260",
    "lat": 43.316073,
    "lon": 3.425535
  },
  {
    "id": 30,
    "name": "Novéant",
    "sncf_id": "87192427",
    "lat": 49.028166,
    "lon": 6.052355
  },
  {
    "id": 31,
    "name": "Loos-lez-Lille",
    "sncf_id": "87286112",
    "lat": 50.612827,
    "lon": 3.017414
  },
  {
    "id": 32,
    "name": "Ailly-sur-Noye",
    "sncf_id": "87313221",
    "lat": 49.7545,
    "lon": 2.36399
  },
  {
    "id": 33,
    "name": "Cier-de-Luchon",
    "sncf_id": "87611228",
    "lat": 42.853037,
    "lon": 0.602109
  },
  {
    "id": 34,
    "name": "Sauto",
    "sncf_id": "87784777",
    "lat": 42.506179,
    "lon": 2.159738
  },
  {
    "id": 35,
    "name": "Maurs",
    "sncf_id": "87645168",
    "lat": 44.706026,
    "lon": 2.19983
  },
  {
    "id": 36,
    "name": "St-Julien-en-Genevois",
    "sncf_id": "87745430",
    "lat": 46.141913,
    "lon": 6.085474
  },
  {
    "id": 37,
    "name": "Contrexéville",
    "sncf_id": "87144287",
    "lat": 48.179604,
    "lon": 5.8906
  },
  {
    "id": 38,
    "name": "Hachette",
    "sncf_id": "87297523",
    "lat": 50.158018,
    "lon": 3.742174
  },
  {
    "id": 39,
    "name": "Embrun",
    "sncf_id": "87763466",
    "lat": 44.566748,
    "lon": 6.496153
  },
  {
    "id": 40,
    "name": "Hombourg-Haut",
    "sncf_id": "87193276",
    "lat": 49.126157,
    "lon": 6.774298
  },
  {
    "id": 41,
    "name": "Abbeville",
    "sncf_id": "87317362",
    "lat": 50.100849,
    "lon": 1.825534
  },
  {
    "id": 42,
    "name": "Auchy-lès-Hesdin",
    "sncf_id": "87317230",
    "lat": 50.39642,
    "lon": 2.102363
  },
  {
    "id": 43,
    "name": "Farschviller",
    "sncf_id": "87193524",
    "lat": 49.087988,
    "lon": 6.908157
  },
  {
    "id": 44,
    "name": "La Membrolle-sur-Choisille",
    "sncf_id": "87571513",
    "lat": 47.431728,
    "lon": 0.641454
  },
  {
    "id": 45,
    "name": "Cap-d'Ail",
    "sncf_id": "87756395",
    "lat": 43.720535,
    "lon": 7.394455
  },
  {
    "id": 46,
    "name": "St-Jory",
    "sncf_id": "87611657",
    "lat": 43.741231,
    "lon": 1.368648
  },
  {
    "id": 47,
    "name": "Martigues",
    "sncf_id": "87753509",
    "lat": 43.38758,
    "lon": 5.025059
  },
  {
    "id": 48,
    "name": "St-Sébastien",
    "sncf_id": "87592493",
    "lat": 46.386787,
    "lon": 1.547416
  },
  {
    "id": 49,
    "name": "Beuvrages",
    "sncf_id": "87343160",
    "lat": 50.391128,
    "lon": 3.505293
  },
  {
    "id": 50,
    "name": "Fontainebleau-Avon",
    "sncf_id": "87682211",
    "lat": 48.417524,
    "lon": 2.727228
  },
  {
    "id": 51,
    "name": "Lège",
    "sncf_id": "87611210",
    "lat": 42.876238,
    "lon": 0.613163
  },
  {
    "id": 52,
    "name": "Angerville",
    "sncf_id": "87543090",
    "lat": 48.310411,
    "lon": 2.003015
  },
  {
    "id": 53,
    "name": "Champigneulles",
    "sncf_id": "87141085",
    "lat": 48.735937,
    "lon": 6.168327
  },
  {
    "id": 54,
    "name": "Le Burg",
    "sncf_id": "87594614",
    "lat": 45.216284,
    "lon": 1.429695
  },
  {
    "id": 55,
    "name": "Bénestroff",
    "sncf_id": "87192302",
    "lat": 48.906756,
    "lon": 6.752319
  },
  {
    "id": 56,
    "name": "La Ciotat",
    "sncf_id": "87751784",
    "lat": 43.199303,
    "lon": 5.632937
  },
  {
    "id": 57,
    "name": "Pont-Maugis",
    "sncf_id": "87172304",
    "lat": 49.670009,
    "lon": 4.955146
  },
  {
    "id": 58,
    "name": "Aubin-St-Vaast",
    "sncf_id": "87316604",
    "lat": 50.394541,
    "lon": 1.970644
  },
  {
    "id": 59,
    "name": "Paray-le-Monial",
    "sncf_id": "87694687",
    "lat": 46.44698,
    "lon": 4.113797
  },
  {
    "id": 60,
    "name": "Tieffenbach-Struth",
    "sncf_id": "87215699",
    "lat": 48.906312,
    "lon": 7.255222
  },
  {
    "id": 61,
    "name": "Cambrai",
    "sncf_id": "87345520",
    "lat": 50.175742,
    "lon": 3.243769
  },
  {
    "id": 62,
    "name": "St-Joseph-Le Castellas",
    "sncf_id": "87759316",
    "lat": 43.351959,
    "lon": 5.37737
  },
  {
    "id": 63,
    "name": "Mesves-Bulcy",
    "sncf_id": "87696187",
    "lat": 47.242134,
    "lon": 3.006509
  },
  {
    "id": 64,
    "name": "Rochy-Condé",
    "sncf_id": "87313601",
    "lat": 49.398364,
    "lon": 2.172724
  },
  {
    "id": 65,
    "name": "Picquigny",
    "sncf_id": "87313106",
    "lat": 49.945772,
    "lon": 2.144291
  },
  {
    "id": 66,
    "name": "Cuinchy",
    "sncf_id": "87342410",
    "lat": 50.522102,
    "lon": 2.744916
  },
  {
    "id": 67,
    "name": "Ars-sur-Moselle",
    "sncf_id": "87192401",
    "lat": 49.074238,
    "lon": 6.077933
  },
  {
    "id": 68,
    "name": "Brionne",
    "sncf_id": "87415364",
    "lat": 49.196434,
    "lon": 0.711469
  },
  {
    "id": 69,
    "name": "Ste-Musse",
    "sncf_id": "87742262",
    "lat": 43.124357,
    "lon": 5.973095
  },
  {
    "id": 70,
    "name": "Err",
    "sncf_id": "87784843",
    "lat": 42.442767,
    "lon": 2.028889
  },
  {
    "id": 71,
    "name": "Vallorcine",
    "sncf_id": "87746875",
    "lat": 46.032372,
    "lon": 6.932852
  },
  {
    "id": 72,
    "name": "St-Laurent-d'Aigouze",
    "sncf_id": "87775841",
    "lat": 43.639145,
    "lon": 4.19301
  },
  {
    "id": 73,
    "name": "Chessy",
    "sncf_id": "87721761",
    "lat": 45.885436,
    "lon": 4.622492
  },
  {
    "id": 74,
    "name": "Hargicourt-Pierrepont",
    "sncf_id": "87313338",
    "lat": 49.713654,
    "lon": 2.531831
  },
  {
    "id": 75,
    "name": "Sermizelles-Vézelay",
    "sncf_id": "87683722",
    "lat": 47.528867,
    "lon": 3.792895
  },
  {
    "id": 76,
    "name": "Pontcharra-sur-Breda-Allevard",
    "sncf_id": "87747493",
    "lat": 45.433939,
    "lon": 6.007681
  },
  {
    "id": 77,
    "name": "Bénestroff",
    "sncf_id": "87192302",
    "lat": 48.906192,
    "lon": 6.750621
  },
  {
    "id": 78,
    "name": "Agen",
    "sncf_id": "87586008",
    "lat": 44.208341,
    "lon": 0.621048
  },
  {
    "id": 79,
    "name": "Montdidier",
    "sncf_id": "87313346",
    "lat": 49.6412,
    "lon": 2.561748
  },
  {
    "id": 80,
    "name": "Montrond-les-Bains",
    "sncf_id": "87726885",
    "lat": 45.64418,
    "lon": 4.246781
  },
  {
    "id": 81,
    "name": "Paray-le-Monial",
    "sncf_id": "87694687",
    "lat": 46.446173,
    "lon": 4.11579
  },
  {
    "id": 82,
    "name": "Bitche-Camp",
    "sncf_id": "87193839",
    "lat": 49.0489,
    "lon": 7.476102
  },
  {
    "id": 83,
    "name": "Marseille-St-Charles",
    "sncf_id": "87751008",
    "lat": 43.30301,
    "lon": 5.381134
  },
  {
    "id": 84,
    "name": "Castelnau-d'Estrétefonds",
    "sncf_id": "87611665",
    "lat": 43.789222,
    "lon": 1.338638
  },
  {
    "id": 85,
    "name": "Colmar",
    "sncf_id": "87182014",
    "lat": 48.073172,
    "lon": 7.346943
  },
  {
    "id": 86,
    "name": "Beauvais",
    "sncf_id": "87313510",
    "lat": 49.426292,
    "lon": 2.090001
  },
  {
    "id": 87,
    "name": "Septèmes",
    "sncf_id": "87751800",
    "lat": 43.403147,
    "lon": 5.370042
  },
  {
    "id": 88,
    "name": "Nîmes",
    "sncf_id": "87775007",
    "lat": 43.832529,
    "lon": 4.366218
  },
  {
    "id": 89,
    "name": "Gravelines",
    "sncf_id": "87281246",
    "lat": 50.978676,
    "lon": 2.124353
  },
  {
    "id": 90,
    "name": "Matzenheim",
    "sncf_id": "87214130",
    "lat": 48.398834,
    "lon": 7.619475
  },
  {
    "id": 91,
    "name": "Sathonay-Rillieux",
    "sncf_id": "87723700",
    "lat": 45.819823,
    "lon": 4.875371
  },
  {
    "id": 92,
    "name": "Montbrison",
    "sncf_id": "87726448",
    "lat": 45.604533,
    "lon": 4.078543
  },
  {
    "id": 93,
    "name": "Culoz",
    "sncf_id": "87741074",
    "lat": 45.843225,
    "lon": 5.779101
  },
  {
    "id": 94,
    "name": "Chocques",
    "sncf_id": "87342220",
    "lat": 50.537884,
    "lon": 2.56695
  },
  {
    "id": 95,
    "name": "Creil",
    "sncf_id": "87276006",
    "lat": 49.263943,
    "lon": 2.468915
  },
  {
    "id": 96,
    "name": "Vendenheim",
    "sncf_id": "87212118",
    "lat": 48.67859,
    "lon": 7.715134
  },
  {
    "id": 97,
    "name": "Marseille-St-Charles",
    "sncf_id": "87751008",
    "lat": 43.305171,
    "lon": 5.384844
  },
  {
    "id": 98,
    "name": "Lalinde",
    "sncf_id": "87584441",
    "lat": 44.839505,
    "lon": 0.742925
  },
  {
    "id": 99,
    "name": "Bourg-Madame",
    "sncf_id": "87784876",
    "lat": 42.432413,
    "lon": 1.948684
  },
  {
    "id": 100,
    "name": "Angoulême",
    "sncf_id": "87583005",
    "lat": 45.653643,
    "lon": 0.164145
  },
  {
    "id": 101,
    "name": "Fontaines-Mercurey",
    "sncf_id": "87713586",
    "lat": 46.851149,
    "lon": 4.775282
  },
  {
    "id": 102,
    "name": "Meymac",
    "sncf_id": "87594275",
    "lat": 45.530066,
    "lon": 2.163792
  },
  {
    "id": 103,
    "name": "Cahors",
    "sncf_id": "87613000",
    "lat": 44.447902,
    "lon": 1.433017
  },
  {
    "id": 104,
    "name": "Ceilhes-Roqueredonde",
    "sncf_id": "87781542",
    "lat": 43.80532,
    "lon": 3.169335
  },
  {
    "id": 105,
    "name": "Lézignan (Aude)",
    "sncf_id": "87615112",
    "lat": 43.199006,
    "lon": 2.765297
  },
  {
    "id": 106,
    "name": "Fontaine-sur-Somme",
    "sncf_id": "87316091",
    "lat": 50.029411,
    "lon": 1.941548
  },
  {
    "id": 107,
    "name": "Nébing",
    "sncf_id": "87215301",
    "lat": 48.900057,
    "lon": 6.803662
  },
  {
    "id": 108,
    "name": "Bernay",
    "sncf_id": "87444299",
    "lat": 49.087212,
    "lon": 0.598934
  },
  {
    "id": 109,
    "name": "Avignonet",
    "sncf_id": "87616011",
    "lat": 43.364722,
    "lon": 1.783815
  },
  {
    "id": 110,
    "name": "Bas-Monistrol",
    "sncf_id": "87726778",
    "lat": 45.297211,
    "lon": 4.139526
  },
  {
    "id": 111,
    "name": "École-Valentin",
    "sncf_id": "87710731",
    "lat": 47.274879,
    "lon": 5.994104
  },
  {
    "id": 112,
    "name": "Port-Ste-Marie",
    "sncf_id": "87586107",
    "lat": 44.250465,
    "lon": 0.388546
  },
  {
    "id": 113,
    "name": "TGV Haute-Picardie",
    "sncf_id": "87313882",
    "lat": 49.858641,
    "lon": 2.832196
  },
  {
    "id": 114,
    "name": "Reuilly",
    "sncf_id": "87597039",
    "lat": 47.087859,
    "lon": 2.047161
  },
  {
    "id": 115,
    "name": "Portet-St-Simon",
    "sncf_id": "87611400",
    "lat": 43.526391,
    "lon": 1.387768
  },
  {
    "id": 116,
    "name": "Le Mans Hôpital Université",
    "sncf_id": "87743872",
    "lat": 48.013199,
    "lon": 0.174886
  },
  {
    "id": 117,
    "name": "Ingersheim-Cité-Scolaire",
    "sncf_id": "87303875",
    "lat": 48.088861,
    "lon": 7.298141
  },
  {
    "id": 118,
    "name": "Feurs",
    "sncf_id": "87726877",
    "lat": 45.746089,
    "lon": 4.230745
  },
  {
    "id": 119,
    "name": "Diebling",
    "sncf_id": "87193532",
    "lat": 49.102432,
    "lon": 6.946336
  },
  {
    "id": 120,
    "name": "Miramas",
    "sncf_id": "87753004",
    "lat": 43.580837,
    "lon": 5.002653
  },
  {
    "id": 121,
    "name": "Blangy-sur-Ternoise",
    "sncf_id": "87317248",
    "lat": 50.42474,
    "lon": 2.172229
  },
  {
    "id": 122,
    "name": "Peyrilhac-St-Jouvent",
    "sncf_id": "87592428",
    "lat": 45.959766,
    "lon": 1.170073
  },
  {
    "id": 123,
    "name": "Villeneuve-lès-Maguelone",
    "sncf_id": "87773515",
    "lat": 43.543755,
    "lon": 3.849918
  },
  {
    "id": 124,
    "name": "Caffiers",
    "sncf_id": "87317321",
    "lat": 50.850418,
    "lon": 1.811656
  },
  {
    "id": 125,
    "name": "Massy-TGV",
    "sncf_id": "87393702",
    "lat": 48.717885,
    "lon": 2.25485
  },
  {
    "id": 126,
    "name": "Dunkerque",
    "sncf_id": "87281006",
    "lat": 51.034645,
    "lon": 2.364679
  },
  {
    "id": 127,
    "name": "Magny-Blandainville",
    "sncf_id": "87394429",
    "lat": 48.334279,
    "lon": 1.28108
  },
  {
    "id": 128,
    "name": "Guignicourt",
    "sncf_id": "87171736",
    "lat": 49.434403,
    "lon": 3.961336
  },
  {
    "id": 129,
    "name": "Penne",
    "sncf_id": "87586438",
    "lat": 44.376744,
    "lon": 0.799117
  },
  {
    "id": 130,
    "name": "Dommartin-Remiencourt",
    "sncf_id": "87316109",
    "lat": 49.799669,
    "lon": 2.392672
  },
  {
    "id": 131,
    "name": "Ranspach",
    "sncf_id": "87182402",
    "lat": 47.881625,
    "lon": 7.012647
  },
  {
    "id": 132,
    "name": "Clamecy",
    "sncf_id": "87696807",
    "lat": 47.46674,
    "lon": 3.520597
  },
  {
    "id": 133,
    "name": "Tracy-Sancerre",
    "sncf_id": "87696161",
    "lat": 47.337551,
    "lon": 2.880651
  },
  {
    "id": 134,
    "name": "Aigues-Mortes",
    "sncf_id": "87775858",
    "lat": 43.57088,
    "lon": 4.191092
  },
  {
    "id": 135,
    "name": "Pompey",
    "sncf_id": "87141788",
    "lat": 48.773207,
    "lon": 6.130838
  },
  {
    "id": 136,
    "name": "Vitry-en-Artois",
    "sncf_id": "87342113",
    "lat": 50.327283,
    "lon": 2.980869
  },
  {
    "id": 137,
    "name": "Martigues",
    "sncf_id": "87753509",
    "lat": 43.390182,
    "lon": 5.025225
  },
  {
    "id": 138,
    "name": "Masseret",
    "sncf_id": "87594820",
    "lat": 45.536092,
    "lon": 1.54164
  },
  {
    "id": 139,
    "name": "Escalquens",
    "sncf_id": "87611707",
    "lat": 43.520615,
    "lon": 1.540028
  },
  {
    "id": 140,
    "name": "Tournemire-Roquefort",
    "sncf_id": "87783456",
    "lat": 43.969982,
    "lon": 3.016591
  },
  {
    "id": 141,
    "name": "Rivarennes",
    "sncf_id": "87571653",
    "lat": 47.267793,
    "lon": 0.362495
  },
  {
    "id": 142,
    "name": "Port-Ste-Marie",
    "sncf_id": "87586107",
    "lat": 44.250457,
    "lon": 0.389298
  },
  {
    "id": 143,
    "name": "Landry",
    "sncf_id": "87741777",
    "lat": 45.573897,
    "lon": 6.733284
  },
  {
    "id": 144,
    "name": "Colmar",
    "sncf_id": "87182014",
    "lat": 48.072706,
    "lon": 7.346746
  },
  {
    "id": 145,
    "name": "Gazeran",
    "sncf_id": "87393348",
    "lat": 48.625964,
    "lon": 1.771722
  },
  {
    "id": 146,
    "name": "Étaples-Le Touquet",
    "sncf_id": "87317065",
    "lat": 50.516801,
    "lon": 1.643222
  },
  {
    "id": 147,
    "name": "Wavrin",
    "sncf_id": "87286419",
    "lat": 50.574486,
    "lon": 2.936376
  },
  {
    "id": 148,
    "name": "Lentilly-Charpenay",
    "sncf_id": "87566919",
    "lat": 45.816528,
    "lon": 4.682268
  },
  {
    "id": 149,
    "name": "Montbard",
    "sncf_id": "87713131",
    "lat": 47.618617,
    "lon": 4.33551
  },
  {
    "id": 150,
    "name": "Voreppe",
    "sncf_id": "87747337",
    "lat": 45.290196,
    "lon": 5.63214
  },
  {
    "id": 151,
    "name": "Fons-St-Mamert",
    "sncf_id": "87775379",
    "lat": 43.907261,
    "lon": 4.206741
  },
  {
    "id": 152,
    "name": "Bléré-la-Croix",
    "sncf_id": "87574475",
    "lat": 47.337562,
    "lon": 0.989009
  },
  {
    "id": 153,
    "name": "Héming",
    "sncf_id": "87215145",
    "lat": 48.691624,
    "lon": 6.970307
  },
  {
    "id": 154,
    "name": "Tournemire-Roquefort",
    "sncf_id": "87783456",
    "lat": 43.958497,
    "lon": 3.026385
  },
  {
    "id": 155,
    "name": "Monthermé",
    "sncf_id": "87172056",
    "lat": 49.866117,
    "lon": 4.740087
  },
  {
    "id": 156,
    "name": "Teillé",
    "sncf_id": "87396051",
    "lat": 48.181389,
    "lon": 0.191517
  },
  {
    "id": 157,
    "name": "Ambazac",
    "sncf_id": "87592311",
    "lat": 45.952963,
    "lon": 1.406938
  },
  {
    "id": 158,
    "name": "Banyuls-sur-Mer",
    "sncf_id": "87784298",
    "lat": 42.482891,
    "lon": 3.124866
  },
  {
    "id": 159,
    "name": "Sallanches-Combloux-Megève",
    "sncf_id": "87746438",
    "lat": 45.935778,
    "lon": 6.636499
  },
  {
    "id": 160,
    "name": "Hochfelden",
    "sncf_id": "87212167",
    "lat": 48.755175,
    "lon": 7.570961
  },
  {
    "id": 161,
    "name": "Régny",
    "sncf_id": "87721050",
    "lat": 45.987627,
    "lon": 4.215338
  },
  {
    "id": 162,
    "name": "Rosheim",
    "sncf_id": "87214320",
    "lat": 48.50521,
    "lon": 7.491321
  },
  {
    "id": 163,
    "name": "Miramas",
    "sncf_id": "87753004",
    "lat": 43.580925,
    "lon": 4.999683
  },
  {
    "id": 164,
    "name": "Château-l'Évêque",
    "sncf_id": "87595165",
    "lat": 45.245036,
    "lon": 0.688883
  },
  {
    "id": 165,
    "name": "Gien",
    "sncf_id": "87684290",
    "lat": 47.698879,
    "lon": 2.636757
  },
  {
    "id": 166,
    "name": "Antibes",
    "sncf_id": "87757674",
    "lat": 43.586216,
    "lon": 7.119347
  },
  {
    "id": 167,
    "name": "Montbartier",
    "sncf_id": "87611699",
    "lat": 43.925419,
    "lon": 1.265184
  },
  {
    "id": 168,
    "name": "Cintegabelle",
    "sncf_id": "87611376",
    "lat": 43.305245,
    "lon": 1.520565
  },
  {
    "id": 169,
    "name": "Bauvin-Provin",
    "sncf_id": "87345280",
    "lat": 50.511673,
    "lon": 2.905041
  },
  {
    "id": 170,
    "name": "Fontenoy-sur-Moselle",
    "sncf_id": "87141051",
    "lat": 48.711788,
    "lon": 5.9805
  },
  {
    "id": 171,
    "name": "Givors-Canal",
    "sncf_id": "87722439",
    "lat": 45.596071,
    "lon": 4.772601
  },
  {
    "id": 172,
    "name": "Lunel",
    "sncf_id": "87773408",
    "lat": 43.679586,
    "lon": 4.131152
  },
  {
    "id": 173,
    "name": "Strazeele",
    "sncf_id": "87286203",
    "lat": 50.713613,
    "lon": 2.630094
  },
  {
    "id": 174,
    "name": "Neufchâteau",
    "sncf_id": "87141291",
    "lat": 48.358533,
    "lon": 5.690907
  },
  {
    "id": 175,
    "name": "Ranchot",
    "sncf_id": "87718338",
    "lat": 47.152656,
    "lon": 5.724747
  },
  {
    "id": 176,
    "name": "Avrechy",
    "sncf_id": "87313296",
    "lat": 49.444714,
    "lon": 2.417994
  },
  {
    "id": 177,
    "name": "Mende",
    "sncf_id": "87783605",
    "lat": 44.522412,
    "lon": 3.501919
  },
  {
    "id": 178,
    "name": "Iwuy",
    "sncf_id": "87345397",
    "lat": 50.226276,
    "lon": 3.330425
  },
  {
    "id": 179,
    "name": "Puybrun",
    "sncf_id": "87594754",
    "lat": 44.921717,
    "lon": 1.784263
  },
  {
    "id": 180,
    "name": "Les Trillers",
    "sncf_id": "87641373",
    "lat": 46.414553,
    "lon": 2.599907
  },
  {
    "id": 181,
    "name": "Monnerville",
    "sncf_id": "87545111",
    "lat": 48.347296,
    "lon": 2.031068
  },
  {
    "id": 182,
    "name": "Étival-Clairefontaine",
    "sncf_id": "87144642",
    "lat": 48.366636,
    "lon": 6.876939
  },
  {
    "id": 183,
    "name": "Weyersheim",
    "sncf_id": "87213678",
    "lat": 48.717981,
    "lon": 7.797038
  },
  {
    "id": 184,
    "name": "Quincieux",
    "sncf_id": "87721290",
    "lat": 45.90603,
    "lon": 4.779943
  },
  {
    "id": 185,
    "name": "Muizon",
    "sncf_id": "87171298",
    "lat": 49.278214,
    "lon": 3.891856
  },
  {
    "id": 186,
    "name": "Vesoul",
    "sncf_id": "87185009",
    "lat": 47.617367,
    "lon": 6.153017
  },
  {
    "id": 187,
    "name": "Wimille-Wimereux",
    "sncf_id": "87317123",
    "lat": 50.764137,
    "lon": 1.613746
  },
  {
    "id": 188,
    "name": "Santenay-les-Bains",
    "sncf_id": "87713594",
    "lat": 46.910734,
    "lon": 4.70178
  },
  {
    "id": 189,
    "name": "Lavoûte-sur-Loire",
    "sncf_id": "87734707",
    "lat": 45.121562,
    "lon": 3.906754
  },
  {
    "id": 190,
    "name": "Culoz",
    "sncf_id": "87741074",
    "lat": 45.843232,
    "lon": 5.778957
  },
  {
    "id": 191,
    "name": "Les Pélerins",
    "sncf_id": "87746776",
    "lat": 45.912492,
    "lon": 6.847336
  },
  {
    "id": 192,
    "name": "Fondettes-St-Cyr",
    "sncf_id": "87571505",
    "lat": 47.398665,
    "lon": 0.646167
  },
  {
    "id": 193,
    "name": "Martel",
    "sncf_id": "87594713",
    "lat": 44.933358,
    "lon": 1.608343
  },
  {
    "id": 194,
    "name": "Vireux-Molhain",
    "sncf_id": "87172114",
    "lat": 50.083485,
    "lon": 4.723153
  },
  {
    "id": 195,
    "name": "Tournus",
    "sncf_id": "87725622",
    "lat": 46.565758,
    "lon": 4.906558
  },
  {
    "id": 196,
    "name": "Sorgues-Châteauneuf-du-Pape",
    "sncf_id": "87765206",
    "lat": 44.004225,
    "lon": 4.875291
  },
  {
    "id": 197,
    "name": "Dissay",
    "sncf_id": "87575191",
    "lat": 46.704009,
    "lon": 0.421512
  },
  {
    "id": 198,
    "name": "St-Victurnien",
    "sncf_id": "87592683",
    "lat": 45.876681,
    "lon": 1.009793
  },
  {
    "id": 199,
    "name": "Chamousset",
    "sncf_id": "87741231",
    "lat": 45.557699,
    "lon": 6.203035
  },
  {
    "id": 200,
    "name": "Bort-les-Orgues",
    "sncf_id": "87645705",
    "lat": 45.406357,
    "lon": 2.502565
  },
  {
    "id": 201,
    "name": "Benfeld",
    "sncf_id": "87214122",
    "lat": 48.373645,
    "lon": 7.584029
  },
  {
    "id": 202,
    "name": "Cannes-la-Bocca",
    "sncf_id": "87757617",
    "lat": 43.548588,
    "lon": 6.986416
  },
  {
    "id": 203,
    "name": "Vayrac",
    "sncf_id": "87594739",
    "lat": 44.950128,
    "lon": 1.706369
  },
  {
    "id": 204,
    "name": "La Clayette-Baudemont",
    "sncf_id": "87694737",
    "lat": 46.288191,
    "lon": 4.298401
  },
  {
    "id": 205,
    "name": "Pins-Justaret",
    "sncf_id": "87618116",
    "lat": 43.478891,
    "lon": 1.399731
  },
  {
    "id": 206,
    "name": "Épierre-St-Léger",
    "sncf_id": "87741280",
    "lat": 45.458376,
    "lon": 6.292819
  },
  {
    "id": 207,
    "name": "Luçay-le-Mâle",
    "sncf_id": "87576363",
    "lat": 47.133056,
    "lon": 1.43603
  },
  {
    "id": 208,
    "name": "Epernay",
    "sncf_id": "87171553",
    "lat": 49.0464,
    "lon": 3.960135
  },
  {
    "id": 209,
    "name": "La Ferté-Imbault",
    "sncf_id": "87576082",
    "lat": 47.383601,
    "lon": 1.958347
  },
  {
    "id": 210,
    "name": "Troyes",
    "sncf_id": "87118000",
    "lat": 48.295565,
    "lon": 4.065066
  },
  {
    "id": 211,
    "name": "Lus-la-Croix-Haute",
    "sncf_id": "87747667",
    "lat": 44.670888,
    "lon": 5.697202
  },
  {
    "id": 212,
    "name": "St-Gilles",
    "sncf_id": "87181552",
    "lat": 48.075937,
    "lon": 7.261259
  },
  {
    "id": 213,
    "name": "Romanèche-Thorins",
    "sncf_id": "87725739",
    "lat": 46.175326,
    "lon": 4.741848
  },
  {
    "id": 214,
    "name": "Bertry",
    "sncf_id": "87345553",
    "lat": 50.091153,
    "lon": 3.44903
  },
  {
    "id": 215,
    "name": "Gièvres",
    "sncf_id": "87576876",
    "lat": 47.278904,
    "lon": 1.668491
  },
  {
    "id": 216,
    "name": "St-Paul-de-Varax",
    "sncf_id": "87723783",
    "lat": 46.100119,
    "lon": 5.128116
  },
  {
    "id": 217,
    "name": "Clerval",
    "sncf_id": "87184622",
    "lat": 47.396621,
    "lon": 6.492127
  },
  {
    "id": 218,
    "name": "Ervy-le-Châtel",
    "sncf_id": "87118414",
    "lat": 48.044691,
    "lon": 3.921866
  },
  {
    "id": 219,
    "name": "Hermes-Berthecourt",
    "sncf_id": "87313585",
    "lat": 49.354401,
    "lon": 2.241638
  },
  {
    "id": 220,
    "name": "Marmagne-sous-Creusot",
    "sncf_id": "87694182",
    "lat": 46.833551,
    "lon": 4.359599
  },
  {
    "id": 221,
    "name": "Turckheim",
    "sncf_id": "87182352",
    "lat": 48.085603,
    "lon": 7.279459
  },
  {
    "id": 222,
    "name": "Roppenheim",
    "sncf_id": "87212415",
    "lat": 48.849609,
    "lon": 8.059807
  },
  {
    "id": 223,
    "name": "Luc-Primaube",
    "sncf_id": "87615773",
    "lat": 44.29166,
    "lon": 2.554484
  },
  {
    "id": 224,
    "name": "Charleville-Mézières",
    "sncf_id": "87172007",
    "lat": 49.768391,
    "lon": 4.725645
  },
  {
    "id": 225,
    "name": "St-Amand-les-Eaux",
    "sncf_id": "87343103",
    "lat": 50.443655,
    "lon": 3.41812
  },
  {
    "id": 226,
    "name": "Amiens",
    "sncf_id": "87313874",
    "lat": 49.889915,
    "lon": 2.31024
  },
  {
    "id": 227,
    "name": "Saint-Jean-de-Maurienne",
    "sncf_id": "87742320",
    "lat": 45.278833,
    "lon": 6.353398
  },
  {
    "id": 228,
    "name": "Auterive",
    "sncf_id": "87611384",
    "lat": 43.348893,
    "lon": 1.46859
  },
  {
    "id": 229,
    "name": "St-Vit",
    "sncf_id": "87718320",
    "lat": 47.183648,
    "lon": 5.808993
  },
  {
    "id": 230,
    "name": "Château-Arnoux-St-Auban",
    "sncf_id": "87751230",
    "lat": 44.061496,
    "lon": 5.997543
  },
  {
    "id": 231,
    "name": "Sennecey-le-Grand",
    "sncf_id": "87725614",
    "lat": 46.639679,
    "lon": 4.874812
  },
  {
    "id": 232,
    "name": "Briançon",
    "sncf_id": "87763607",
    "lat": 44.889613,
    "lon": 6.63259
  },
  {
    "id": 233,
    "name": "Brulange",
    "sncf_id": "87192260",
    "lat": 48.96523,
    "lon": 6.552453
  },
  {
    "id": 234,
    "name": "Nieppe",
    "sncf_id": "87287151",
    "lat": 50.69714,
    "lon": 2.827815
  },
  {
    "id": 235,
    "name": "Biache-St-Vaast",
    "sncf_id": "87342097",
    "lat": 50.316363,
    "lon": 2.941219
  },
  {
    "id": 236,
    "name": "Vif",
    "sncf_id": "87747576",
    "lat": 45.047598,
    "lon": 5.685185
  },
  {
    "id": 237,
    "name": "Brioude",
    "sncf_id": "87734269",
    "lat": 45.300607,
    "lon": 3.378736
  },
  {
    "id": 238,
    "name": "Fretin",
    "sncf_id": "87286641",
    "lat": 50.560745,
    "lon": 3.148901
  },
  {
    "id": 239,
    "name": "Étaples-Le Touquet",
    "sncf_id": "87317065",
    "lat": 50.51453,
    "lon": 1.644151
  },
  {
    "id": 240,
    "name": "Walygator-Parc",
    "sncf_id": "87191098",
    "lat": 49.224209,
    "lon": 6.159517
  },
  {
    "id": 241,
    "name": "Gerzat",
    "sncf_id": "87734046",
    "lat": 45.833313,
    "lon": 3.143097
  },
  {
    "id": 242,
    "name": "Laissey",
    "sncf_id": "87718437",
    "lat": 47.299142,
    "lon": 6.233694
  },
  {
    "id": 243,
    "name": "Molinges",
    "sncf_id": "87743591",
    "lat": 46.357034,
    "lon": 5.768148
  },
  {
    "id": 244,
    "name": "Artenay",
    "sncf_id": "87543058",
    "lat": 48.080063,
    "lon": 1.883056
  },
  {
    "id": 245,
    "name": "Valleroy-Moineville",
    "sncf_id": "87192732",
    "lat": 49.205088,
    "lon": 5.934437
  },
  {
    "id": 246,
    "name": "Chaulnes",
    "sncf_id": "87313478",
    "lat": 49.807043,
    "lon": 2.802085
  },
  {
    "id": 247,
    "name": "Illiers-Combray",
    "sncf_id": "87394437",
    "lat": 48.304239,
    "lon": 1.244992
  },
  {
    "id": 248,
    "name": "Domblans-Voiteur",
    "sncf_id": "87718213",
    "lat": 46.762083,
    "lon": 5.597598
  },
  {
    "id": 249,
    "name": "Pers",
    "sncf_id": "87645176",
    "lat": 44.886944,
    "lon": 2.240507
  },
  {
    "id": 250,
    "name": "Vendenheim",
    "sncf_id": "87212118",
    "lat": 48.666222,
    "lon": 7.718047
  },
  {
    "id": 251,
    "name": "Carry-le-Rouet",
    "sncf_id": "87753566",
    "lat": 43.336684,
    "lon": 5.153618
  },
  {
    "id": 252,
    "name": "Bédarieux",
    "sncf_id": "87781609",
    "lat": 43.610321,
    "lon": 3.150456
  },
  {
    "id": 253,
    "name": "Martigues",
    "sncf_id": "87753509",
    "lat": 43.392864,
    "lon": 5.025628
  },
  {
    "id": 254,
    "name": "Château-Arnoux-St-Auban",
    "sncf_id": "87751230",
    "lat": 44.061502,
    "lon": 5.997672
  },
  {
    "id": 255,
    "name": "Moosch",
    "sncf_id": "87182592",
    "lat": 47.860831,
    "lon": 7.050765
  },
  {
    "id": 256,
    "name": "Jouy",
    "sncf_id": "87394155",
    "lat": 48.509977,
    "lon": 1.557582
  },
  {
    "id": 257,
    "name": "Auch",
    "sncf_id": "87611749",
    "lat": 43.647617,
    "lon": 0.596901
  },
  {
    "id": 258,
    "name": "Foix",
    "sncf_id": "87611616",
    "lat": 42.969649,
    "lon": 1.606884
  },
  {
    "id": 259,
    "name": "Rochy-Condé",
    "sncf_id": "87313601",
    "lat": 49.398442,
    "lon": 2.172801
  },
  {
    "id": 260,
    "name": "Lunel-Viel",
    "sncf_id": "87773424",
    "lat": 43.681127,
    "lon": 4.093614
  },
  {
    "id": 261,
    "name": "Fouquereuil",
    "sncf_id": "87342204",
    "lat": 50.525381,
    "lon": 2.609396
  },
  {
    "id": 262,
    "name": "Antignac (Haute-Garonne)",
    "sncf_id": "87611715",
    "lat": 42.827737,
    "lon": 0.601006
  },
  {
    "id": 263,
    "name": "Villers-St-Sépulcre",
    "sncf_id": "87313593",
    "lat": 49.367247,
    "lon": 2.221714
  },
  {
    "id": 264,
    "name": "Bailleau-le-Pin",
    "sncf_id": "87394411",
    "lat": 48.36687,
    "lon": 1.324844
  },
  {
    "id": 265,
    "name": "St-Hilaire",
    "sncf_id": "87297531",
    "lat": 50.132232,
    "lon": 3.913123
  },
  {
    "id": 266,
    "name": "Bertholène",
    "sncf_id": "87783753",
    "lat": 44.397174,
    "lon": 2.768211
  },
  {
    "id": 267,
    "name": "Achiet",
    "sncf_id": "87342048",
    "lat": 50.131968,
    "lon": 2.780612
  },
  {
    "id": 268,
    "name": "Cassis",
    "sncf_id": "87751776",
    "lat": 43.233881,
    "lon": 5.553478
  },
  {
    "id": 269,
    "name": "Marmagne",
    "sncf_id": "87576132",
    "lat": 47.099903,
    "lon": 2.282795
  },
  {
    "id": 270,
    "name": "Le Bruel",
    "sncf_id": "87783548",
    "lat": 44.48121,
    "lon": 3.358285
  },
  {
    "id": 271,
    "name": "Landrecies",
    "sncf_id": "87295642",
    "lat": 50.127782,
    "lon": 3.681
  },
  {
    "id": 272,
    "name": "Nogent-sur-Seine",
    "sncf_id": "87118190",
    "lat": 48.498228,
    "lon": 3.494155
  },
  {
    "id": 273,
    "name": "Culoz",
    "sncf_id": "87741074",
    "lat": 45.842855,
    "lon": 5.778673
  },
  {
    "id": 274,
    "name": "Deluz",
    "sncf_id": "87718429",
    "lat": 47.292616,
    "lon": 6.199497
  },
  {
    "id": 275,
    "name": "Bourg-St-Maurice",
    "sncf_id": "87741793",
    "lat": 45.618121,
    "lon": 6.771557
  },
  {
    "id": 276,
    "name": "Pontarlier",
    "sncf_id": "87715003",
    "lat": 46.899577,
    "lon": 6.357115
  },
  {
    "id": 277,
    "name": "Étigny-Véron",
    "sncf_id": "87683201",
    "lat": 48.138588,
    "lon": 3.290113
  },
  {
    "id": 278,
    "name": "Galuzot",
    "sncf_id": "87694638",
    "lat": 46.642068,
    "lon": 4.330079
  },
  {
    "id": 279,
    "name": "Roppenheim",
    "sncf_id": "87212415",
    "lat": 48.851227,
    "lon": 8.062359
  },
  {
    "id": 280,
    "name": "St-Patrice",
    "sncf_id": "87571810",
    "lat": 47.285566,
    "lon": 0.309835
  },
  {
    "id": 281,
    "name": "Le Dramont",
    "sncf_id": "87757542",
    "lat": 43.417816,
    "lon": 6.84482
  },
  {
    "id": 282,
    "name": "Lamure-sur-Azergues",
    "sncf_id": "87721860",
    "lat": 46.061052,
    "lon": 4.492313
  },
  {
    "id": 283,
    "name": "Kédange",
    "sncf_id": "87191346",
    "lat": 49.305706,
    "lon": 6.332346
  },
  {
    "id": 284,
    "name": "La Porcherie",
    "sncf_id": "87592295",
    "lat": 45.574052,
    "lon": 1.538432
  },
  {
    "id": 285,
    "name": "Auboué",
    "sncf_id": "87191684",
    "lat": 49.21595,
    "lon": 5.970192
  },
  {
    "id": 286,
    "name": "La Rivière-de-Mansac",
    "sncf_id": "87594416",
    "lat": 45.139675,
    "lon": 1.365438
  },
  {
    "id": 287,
    "name": "Dieupentale",
    "sncf_id": "87611681",
    "lat": 43.86652,
    "lon": 1.275029
  },
  {
    "id": 288,
    "name": "Thiers",
    "sncf_id": "87734475",
    "lat": 45.861205,
    "lon": 3.543281
  },
  {
    "id": 289,
    "name": "Albens",
    "sncf_id": "87746115",
    "lat": 45.785931,
    "lon": 5.948602
  },
  {
    "id": 290,
    "name": "Besançon-Mouillère",
    "sncf_id": "87718015",
    "lat": 47.240519,
    "lon": 6.034042
  },
  {
    "id": 291,
    "name": "Montmorillon",
    "sncf_id": "87575480",
    "lat": 46.417365,
    "lon": 0.873793
  },
  {
    "id": 292,
    "name": "Vivonne",
    "sncf_id": "87575290",
    "lat": 46.426483,
    "lon": 0.265134
  },
  {
    "id": 293,
    "name": "Lamonzie-St-Martin",
    "sncf_id": "87584243",
    "lat": 44.843436,
    "lon": 0.380489
  },
  {
    "id": 294,
    "name": "Château-Gaillard",
    "sncf_id": "87543066",
    "lat": 48.140688,
    "lon": 1.912396
  },
  {
    "id": 295,
    "name": "Bar-le-Duc",
    "sncf_id": "87175042",
    "lat": 48.773646,
    "lon": 5.167223
  },
  {
    "id": 296,
    "name": "Mignaloux-Nouaillé",
    "sncf_id": "87575704",
    "lat": 46.52605,
    "lon": 0.411806
  },
  {
    "id": 297,
    "name": "Labergement-Ste-Marie",
    "sncf_id": "87715219",
    "lat": 46.776611,
    "lon": 6.280335
  },
  {
    "id": 298,
    "name": "Ancy-sur-Moselle",
    "sncf_id": "87192419",
    "lat": 49.05737,
    "lon": 6.062762
  },
  {
    "id": 299,
    "name": "Sathonay-Rillieux",
    "sncf_id": "87723700",
    "lat": 45.822605,
    "lon": 4.87843
  },
  {
    "id": 300,
    "name": "Vertaizon",
    "sncf_id": "87734426",
    "lat": 45.78464,
    "lon": 3.288416
  },
  {
    "id": 301,
    "name": "Colmar",
    "sncf_id": "87182014",
    "lat": 48.07531,
    "lon": 7.349087
  },
  {
    "id": 302,
    "name": "Lectoure",
    "sncf_id": "87586263",
    "lat": 43.930947,
    "lon": 0.615228
  },
  {
    "id": 303,
    "name": "Connerré-Beillé",
    "sncf_id": "87396309",
    "lat": 48.074317,
    "lon": 0.48808
  },
  {
    "id": 304,
    "name": "Luxé",
    "sncf_id": "87583823",
    "lat": 45.887296,
    "lon": 0.109285
  },
  {
    "id": 305,
    "name": "Thuès",
    "sncf_id": "87784751",
    "lat": 42.522907,
    "lon": 2.222778
  },
  {
    "id": 306,
    "name": "Bogny-sur-Meuse",
    "sncf_id": "87172049",
    "lat": 49.858854,
    "lon": 4.762682
  },
  {
    "id": 307,
    "name": "Mulhouse-Musées (Tram/Train)",
    "sncf_id": "87534339",
    "lat": 47.75016,
    "lon": 7.298676
  },
  {
    "id": 308,
    "name": "Jarrie-Vizille",
    "sncf_id": "87747535",
    "lat": 45.085269,
    "lon": 5.742391
  },
  {
    "id": 309,
    "name": "Servoz",
    "sncf_id": "87746719",
    "lat": 45.924504,
    "lon": 6.763538
  },
  {
    "id": 310,
    "name": "St-Cyr-en-Val-La Source",
    "sncf_id": "87543116",
    "lat": 47.819597,
    "lon": 1.947598
  },
  {
    "id": 311,
    "name": "Limoges-Montjovis",
    "sncf_id": "87592022",
    "lat": 45.838438,
    "lon": 1.251597
  },
  {
    "id": 312,
    "name": "Quillan",
    "sncf_id": "87615260",
    "lat": 42.873609,
    "lon": 2.181745
  },
  {
    "id": 313,
    "name": "Albigny-Neuville",
    "sncf_id": "87721266",
    "lat": 45.873871,
    "lon": 4.833262
  },
  {
    "id": 314,
    "name": "Belvès",
    "sncf_id": "87595876",
    "lat": 44.777375,
    "lon": 1.011886
  },
  {
    "id": 315,
    "name": "Frouard",
    "sncf_id": "87141077",
    "lat": 48.755588,
    "lon": 6.144388
  },
  {
    "id": 316,
    "name": "Ouges",
    "sncf_id": "87712604",
    "lat": 47.256313,
    "lon": 5.072216
  },
  {
    "id": 317,
    "name": "L'Ariane",
    "sncf_id": "87751529",
    "lat": 43.73427,
    "lon": 7.302321
  },
  {
    "id": 318,
    "name": "Chenonceaux-Chisseaux",
    "sncf_id": "87574491",
    "lat": 47.330629,
    "lon": 1.067218
  },
  {
    "id": 319,
    "name": "Mulhouse-Ville",
    "sncf_id": "87182063",
    "lat": 47.742358,
    "lon": 7.343678
  },
  {
    "id": 320,
    "name": "Miramas",
    "sncf_id": "87753004",
    "lat": 43.580979,
    "lon": 4.998793
  },
  {
    "id": 321,
    "name": "Bologne",
    "sncf_id": "87142224",
    "lat": 48.198646,
    "lon": 5.134534
  },
  {
    "id": 322,
    "name": "Vivoin-Beaumont",
    "sncf_id": "87396077",
    "lat": 48.230199,
    "lon": 0.144909
  },
  {
    "id": 323,
    "name": "Lacapelle-Viescamp",
    "sncf_id": "87645150",
    "lat": 44.919983,
    "lon": 2.266205
  },
  {
    "id": 324,
    "name": "Cheilly-lès-Maranges",
    "sncf_id": "87694398",
    "lat": 46.892584,
    "lon": 4.675646
  },
  {
    "id": 325,
    "name": "Menton",
    "sncf_id": "87756486",
    "lat": 43.775783,
    "lon": 7.49521
  },
  {
    "id": 326,
    "name": "Mâlain",
    "sncf_id": "87713065",
    "lat": 47.327058,
    "lon": 4.810462
  },
  {
    "id": 327,
    "name": "Bueil",
    "sncf_id": "87387092",
    "lat": 48.925094,
    "lon": 1.443791
  },
  {
    "id": 328,
    "name": "Béthune",
    "sncf_id": "87342006",
    "lat": 50.520523,
    "lon": 2.641981
  },
  {
    "id": 329,
    "name": "Baroncourt",
    "sncf_id": "87192658",
    "lat": 49.279941,
    "lon": 5.705215
  },
  {
    "id": 330,
    "name": "Baroncourt",
    "sncf_id": "87192658",
    "lat": 49.284316,
    "lon": 5.699743
  },
  {
    "id": 331,
    "name": "Morvillars",
    "sncf_id": "87184424",
    "lat": 47.549659,
    "lon": 6.935477
  },
  {
    "id": 332,
    "name": "Givors-Canal",
    "sncf_id": "87722439",
    "lat": 45.596027,
    "lon": 4.771771
  },
  {
    "id": 333,
    "name": "Huriel",
    "sncf_id": "87641217",
    "lat": 46.37144,
    "lon": 2.476189
  },
  {
    "id": 334,
    "name": "Montrond-les-Bains",
    "sncf_id": "87726885",
    "lat": 45.646253,
    "lon": 4.248072
  },
  {
    "id": 335,
    "name": "Vaux-sous-Aubigny",
    "sncf_id": "87142620",
    "lat": 47.657497,
    "lon": 5.293663
  },
  {
    "id": 336,
    "name": "Margut-Fromy",
    "sncf_id": "87172411",
    "lat": 49.590903,
    "lon": 5.257002
  },
  {
    "id": 337,
    "name": "Cormery",
    "sncf_id": "87571430",
    "lat": 47.262356,
    "lon": 0.83383
  },
  {
    "id": 338,
    "name": "Beauchastel",
    "sncf_id": "87761528",
    "lat": 44.827239,
    "lon": 4.805465
  },
  {
    "id": 339,
    "name": "Cloyes",
    "sncf_id": "87574509",
    "lat": 47.992275,
    "lon": 1.243388
  },
  {
    "id": 340,
    "name": "Pertuis",
    "sncf_id": "87751362",
    "lat": 43.684422,
    "lon": 5.503649
  },
  {
    "id": 341,
    "name": "Génolhac",
    "sncf_id": "87775213",
    "lat": 44.347277,
    "lon": 3.951654
  },
  {
    "id": 342,
    "name": "Cagnes-sur-Mer",
    "sncf_id": "87756320",
    "lat": 43.657867,
    "lon": 7.148513
  },
  {
    "id": 343,
    "name": "Cordes-Vindrac",
    "sncf_id": "87613802",
    "lat": 44.068868,
    "lon": 1.899148
  },
  {
    "id": 344,
    "name": "Les Quatre-Routes",
    "sncf_id": "87594564",
    "lat": 44.997667,
    "lon": 1.643742
  },
  {
    "id": 345,
    "name": "Villefranche-de-Lauragais",
    "sncf_id": "87615013",
    "lat": 43.400948,
    "lon": 1.712222
  },
  {
    "id": 346,
    "name": "Millas",
    "sncf_id": "87784546",
    "lat": 42.686248,
    "lon": 2.700928
  },
  {
    "id": 347,
    "name": "Ludres",
    "sncf_id": "87141481",
    "lat": 48.621548,
    "lon": 6.169946
  },
  {
    "id": 348,
    "name": "Hundling",
    "sncf_id": "87193540",
    "lat": 49.10657,
    "lon": 6.977467
  },
  {
    "id": 349,
    "name": "Roquesérière",
    "sncf_id": "87615351",
    "lat": 43.751387,
    "lon": 1.620335
  },
  {
    "id": 350,
    "name": "Thiaville",
    "sncf_id": "87141432",
    "lat": 48.413712,
    "lon": 6.810429
  },
  {
    "id": 351,
    "name": "Montréjeau-Gourdan-Polignan",
    "sncf_id": "87611152",
    "lat": 43.078336,
    "lon": 0.572215
  },
  {
    "id": 352,
    "name": "Les Cauquillous",
    "sncf_id": "87328021",
    "lat": 43.734135,
    "lon": 1.754566
  },
  {
    "id": 353,
    "name": "Hoenheim-Tram",
    "sncf_id": "87338517",
    "lat": 48.628759,
    "lon": 7.758132
  },
  {
    "id": 354,
    "name": "Joué-lès-Tours",
    "sncf_id": "87571885",
    "lat": 47.354296,
    "lon": 0.667766
  },
  {
    "id": 355,
    "name": "Cernay",
    "sncf_id": "87182410",
    "lat": 47.801736,
    "lon": 7.173925
  },
  {
    "id": 356,
    "name": "Coron-de-Méricourt",
    "sncf_id": "87345132",
    "lat": 50.414986,
    "lon": 2.884473
  },
  {
    "id": 357,
    "name": "Goncelin",
    "sncf_id": "87747477",
    "lat": 45.34188,
    "lon": 5.973927
  },
  {
    "id": 358,
    "name": "Courcelles-le-Comte",
    "sncf_id": "87342063",
    "lat": 50.169306,
    "lon": 2.787985
  },
  {
    "id": 359,
    "name": "Clermont-La Rotonde",
    "sncf_id": "87396895",
    "lat": 45.76792,
    "lon": 3.090603
  },
  {
    "id": 360,
    "name": "Martigues",
    "sncf_id": "87753509",
    "lat": 43.39197,
    "lon": 5.025492
  },
  {
    "id": 361,
    "name": "Pruniers",
    "sncf_id": "87576199",
    "lat": 47.313156,
    "lon": 1.672258
  },
  {
    "id": 362,
    "name": "Estrées-St-Denis",
    "sncf_id": "87313387",
    "lat": 49.437883,
    "lon": 2.642715
  },
  {
    "id": 363,
    "name": "Kogenheim",
    "sncf_id": "87214114",
    "lat": 48.339013,
    "lon": 7.535256
  },
  {
    "id": 364,
    "name": "Veuves-Monteaux",
    "sncf_id": "87574327",
    "lat": 47.475628,
    "lon": 1.123861
  },
  {
    "id": 365,
    "name": "Meung-sur-Loire",
    "sncf_id": "87574137",
    "lat": 47.830006,
    "lon": 1.691839
  },
  {
    "id": 366,
    "name": "Monéteau-Gurgy",
    "sncf_id": "87683557",
    "lat": 47.850753,
    "lon": 3.580031
  },
  {
    "id": 367,
    "name": "Chandieu-Toussieu",
    "sncf_id": "87723361",
    "lat": 45.668627,
    "lon": 5.006792
  },
  {
    "id": 368,
    "name": "La Fère",
    "sncf_id": "87296632",
    "lat": 49.657837,
    "lon": 3.370077
  },
  {
    "id": 369,
    "name": "Digoin",
    "sncf_id": "87694695",
    "lat": 46.485252,
    "lon": 3.988009
  },
  {
    "id": 370,
    "name": "Lyon-St-Paul",
    "sncf_id": "87721159",
    "lat": 45.76635,
    "lon": 4.825582
  },
  {
    "id": 371,
    "name": "Béning",
    "sncf_id": "87193250",
    "lat": 49.138234,
    "lon": 6.82857
  },
  {
    "id": 372,
    "name": "Mazamet",
    "sncf_id": "87615542",
    "lat": 43.497891,
    "lon": 2.374807
  },
  {
    "id": 373,
    "name": "Mouchard",
    "sncf_id": "87718833",
    "lat": 46.97577,
    "lon": 5.800378
  },
  {
    "id": 374,
    "name": "Milly-sur-Thérain",
    "sncf_id": "87313700",
    "lat": 49.50288,
    "lon": 1.988155
  },
  {
    "id": 375,
    "name": "Longages-Noé",
    "sncf_id": "87611053",
    "lat": 43.354801,
    "lon": 1.251356
  },
  {
    "id": 376,
    "name": "Toul",
    "sncf_id": "87141044",
    "lat": 48.678755,
    "lon": 5.87819
  },
  {
    "id": 377,
    "name": "Dieulouard",
    "sncf_id": "87141812",
    "lat": 48.843847,
    "lon": 6.071538
  },
  {
    "id": 378,
    "name": "Romilly-sur-Seine",
    "sncf_id": "87118158",
    "lat": 48.513781,
    "lon": 3.728971
  },
  {
    "id": 379,
    "name": "Limoux",
    "sncf_id": "87615161",
    "lat": 43.05647,
    "lon": 2.223087
  },
  {
    "id": 380,
    "name": "Le Dorat",
    "sncf_id": "87592543",
    "lat": 46.210975,
    "lon": 1.079359
  },
  {
    "id": 381,
    "name": "Monestier-de-Clermont",
    "sncf_id": "87747592",
    "lat": 44.911857,
    "lon": 5.633921
  },
  {
    "id": 382,
    "name": "La Wantzenau",
    "sncf_id": "87212316",
    "lat": 48.665345,
    "lon": 7.825075
  },
  {
    "id": 383,
    "name": "Belvezet",
    "sncf_id": "87783670",
    "lat": 44.561755,
    "lon": 3.751807
  },
  {
    "id": 384,
    "name": "Vierzon-Ville",
    "sncf_id": "87576009",
    "lat": 47.227309,
    "lon": 2.057635
  },
  {
    "id": 385,
    "name": "Landas",
    "sncf_id": "87286575",
    "lat": 50.468828,
    "lon": 3.289802
  },
  {
    "id": 386,
    "name": "Verneuil-sur-Avre",
    "sncf_id": "87393595",
    "lat": 48.742723,
    "lon": 0.929326
  },
  {
    "id": 387,
    "name": "Moulins-sur-Allier",
    "sncf_id": "87696328",
    "lat": 46.56319,
    "lon": 3.339881
  },
  {
    "id": 388,
    "name": "Réhon",
    "sncf_id": "87194449",
    "lat": 49.501335,
    "lon": 5.754668
  },
  {
    "id": 389,
    "name": "Dégagnac",
    "sncf_id": "87613174",
    "lat": 44.652455,
    "lon": 1.340882
  },
  {
    "id": 390,
    "name": "Haguenau",
    "sncf_id": "87213058",
    "lat": 48.813269,
    "lon": 7.782383
  },
  {
    "id": 391,
    "name": "Marignier",
    "sncf_id": "87746347",
    "lat": 46.088886,
    "lon": 6.506267
  },
  {
    "id": 392,
    "name": "Lumes",
    "sncf_id": "87172189",
    "lat": 49.732982,
    "lon": 4.783241
  },
  {
    "id": 393,
    "name": "La Bonneville-sur-Iton",
    "sncf_id": "87387142",
    "lat": 48.988301,
    "lon": 1.03534
  },
  {
    "id": 394,
    "name": "Soyons",
    "sncf_id": "87761502",
    "lat": 44.890779,
    "lon": 4.851399
  },
  {
    "id": 395,
    "name": "Puget-Ville",
    "sncf_id": "87755363",
    "lat": 43.282951,
    "lon": 6.138367
  },
  {
    "id": 396,
    "name": "Annemasse",
    "sncf_id": "87745497",
    "lat": 46.200487,
    "lon": 6.238238
  },
  {
    "id": 397,
    "name": "Hargarten-Falck",
    "sncf_id": "87193144",
    "lat": 49.218545,
    "lon": 6.633832
  },
  {
    "id": 398,
    "name": "Gap",
    "sncf_id": "87763003",
    "lat": 44.563681,
    "lon": 6.085344
  },
  {
    "id": 399,
    "name": "Arenc-Euroméditerranée",
    "sncf_id": "87580340",
    "lat": 43.312883,
    "lon": 5.367807
  },
  {
    "id": 400,
    "name": "Monts",
    "sncf_id": "87575035",
    "lat": 47.281723,
    "lon": 0.654757
  },
  {
    "id": 401,
    "name": "Mauzac",
    "sncf_id": "87584466",
    "lat": 44.855764,
    "lon": 0.789985
  },
  {
    "id": 402,
    "name": "St-Sulpice",
    "sncf_id": "87615344",
    "lat": 43.775104,
    "lon": 1.680526
  },
  {
    "id": 403,
    "name": "La Chapelle-sur-Loire",
    "sncf_id": "87571802",
    "lat": 47.251284,
    "lon": 0.218648
  },
  {
    "id": 404,
    "name": "Haguenau",
    "sncf_id": "87213058",
    "lat": 48.813379,
    "lon": 7.782165
  },
  {
    "id": 405,
    "name": "Bologne",
    "sncf_id": "87142224",
    "lat": 48.198721,
    "lon": 5.13444
  },
  {
    "id": 406,
    "name": "St-André-le-Gaz",
    "sncf_id": "87723494",
    "lat": 45.54439,
    "lon": 5.524525
  },
  {
    "id": 407,
    "name": "Selles-St-Denis",
    "sncf_id": "87576140",
    "lat": 47.3885,
    "lon": 1.922421
  },
  {
    "id": 408,
    "name": "Vaumoise",
    "sncf_id": "87271601",
    "lat": 49.233835,
    "lon": 2.988528
  },
  {
    "id": 409,
    "name": "Laifour",
    "sncf_id": "87172072",
    "lat": 49.910963,
    "lon": 4.692138
  },
  {
    "id": 410,
    "name": "La Pomme",
    "sncf_id": "87751719",
    "lat": 43.290558,
    "lon": 5.441386
  },
  {
    "id": 411,
    "name": "Luttenbach-près-Munster",
    "sncf_id": "87182543",
    "lat": 48.035306,
    "lon": 7.118844
  },
  {
    "id": 412,
    "name": "Chaponost",
    "sncf_id": "87722710",
    "lat": 45.698847,
    "lon": 4.764649
  },
  {
    "id": 413,
    "name": "Corrèze",
    "sncf_id": "87594119",
    "lat": 45.328766,
    "lon": 1.879639
  },
  {
    "id": 414,
    "name": "Vraincourt-Viéville",
    "sncf_id": "87143024",
    "lat": 48.236876,
    "lon": 5.123891
  },
  {
    "id": 415,
    "name": "Le Cateau",
    "sncf_id": "87295220",
    "lat": 50.09076,
    "lon": 3.540093
  },
  {
    "id": 416,
    "name": "Libercourt",
    "sncf_id": "87345256",
    "lat": 50.479977,
    "lon": 3.008806
  },
  {
    "id": 417,
    "name": "Mittersheim",
    "sncf_id": "87215327",
    "lat": 48.857072,
    "lon": 6.915448
  },
  {
    "id": 418,
    "name": "Aspres-sur-Buëch",
    "sncf_id": "87763250",
    "lat": 44.51938,
    "lon": 5.754332
  },
  {
    "id": 419,
    "name": "Marmande",
    "sncf_id": "87586545",
    "lat": 44.503203,
    "lon": 0.16808
  },
  {
    "id": 420,
    "name": "Montaigut",
    "sncf_id": "87597674",
    "lat": 46.136893,
    "lon": 1.73397
  },
  {
    "id": 421,
    "name": "Givors-Canal",
    "sncf_id": "87722439",
    "lat": 45.594696,
    "lon": 4.770258
  },
  {
    "id": 422,
    "name": "Montauban-Ville-Bourbon",
    "sncf_id": "87611244",
    "lat": 44.015317,
    "lon": 1.340038
  },
  {
    "id": 423,
    "name": "St-Pierre-en-Faucigny",
    "sncf_id": "87746313",
    "lat": 46.059221,
    "lon": 6.375818
  },
  {
    "id": 424,
    "name": "Port-la-Nouvelle",
    "sncf_id": "87781062",
    "lat": 43.019867,
    "lon": 3.038712
  },
  {
    "id": 425,
    "name": "Lure",
    "sncf_id": "87185249",
    "lat": 47.682963,
    "lon": 6.492748
  },
  {
    "id": 426,
    "name": "Baraqueville-Carcenac-Peyralès",
    "sncf_id": "87615757",
    "lat": 44.270276,
    "lon": 2.427578
  },
  {
    "id": 427,
    "name": "Lexos",
    "sncf_id": "87613489",
    "lat": 44.1422,
    "lon": 1.886502
  },
  {
    "id": 428,
    "name": "Magnette",
    "sncf_id": "87641365",
    "lat": 46.464172,
    "lon": 2.602899
  },
  {
    "id": 429,
    "name": "Les Cabrils",
    "sncf_id": "87781559",
    "lat": 43.766655,
    "lon": 3.182069
  },
  {
    "id": 430,
    "name": "Machilly",
    "sncf_id": "87745588",
    "lat": 46.252777,
    "lon": 6.328385
  },
  {
    "id": 431,
    "name": "Russ-Hersbach",
    "sncf_id": "87214684",
    "lat": 48.498142,
    "lon": 7.251693
  },
  {
    "id": 432,
    "name": "Béning",
    "sncf_id": "87193250",
    "lat": 49.138502,
    "lon": 6.827859
  },
  {
    "id": 433,
    "name": "Appilly",
    "sncf_id": "87296459",
    "lat": 49.580427,
    "lon": 3.120163
  },
  {
    "id": 434,
    "name": "Lentilly",
    "sncf_id": "87721555",
    "lat": 45.821806,
    "lon": 4.667205
  },
  {
    "id": 435,
    "name": "Cluses",
    "sncf_id": "87746370",
    "lat": 46.061402,
    "lon": 6.582708
  },
  {
    "id": 436,
    "name": "Planès",
    "sncf_id": "87784785",
    "lat": 42.501037,
    "lon": 2.136888
  },
  {
    "id": 437,
    "name": "Limoux-Flassian",
    "sncf_id": "87598755",
    "lat": 43.068455,
    "lon": 2.21855
  },
  {
    "id": 438,
    "name": "Corbehem",
    "sncf_id": "87345116",
    "lat": 50.343138,
    "lon": 3.040822
  },
  {
    "id": 439,
    "name": "Ingwiller",
    "sncf_id": "87213785",
    "lat": 48.872011,
    "lon": 7.476745
  },
  {
    "id": 440,
    "name": "Pont-St-Esprit",
    "sncf_id": "87764555",
    "lat": 44.253477,
    "lon": 4.643193
  },
  {
    "id": 441,
    "name": "L'Estaque",
    "sncf_id": "87751602",
    "lat": 43.363795,
    "lon": 5.321378
  },
  {
    "id": 442,
    "name": "Nice-St-Augustin",
    "sncf_id": "87756254",
    "lat": 43.670804,
    "lon": 7.216787
  },
  {
    "id": 443,
    "name": "Verdun",
    "sncf_id": "87175778",
    "lat": 49.165513,
    "lon": 5.378756
  },
  {
    "id": 444,
    "name": "Compiègne",
    "sncf_id": "87276691",
    "lat": 49.422103,
    "lon": 2.823574
  },
  {
    "id": 445,
    "name": "Sallaumines",
    "sncf_id": "87345215",
    "lat": 50.417577,
    "lon": 2.853313
  },
  {
    "id": 446,
    "name": "Conflans-Jarny",
    "sncf_id": "87192666",
    "lat": 49.166662,
    "lon": 5.868148
  },
  {
    "id": 447,
    "name": "Les Moussoux",
    "sncf_id": "87746818",
    "lat": 45.916205,
    "lon": 6.857543
  },
  {
    "id": 448,
    "name": "St-Symphorien-de-Marmagne",
    "sncf_id": "87694174",
    "lat": 46.844398,
    "lon": 4.337184
  },
  {
    "id": 449,
    "name": "Wisches",
    "sncf_id": "87214676",
    "lat": 48.507473,
    "lon": 7.270155
  },
  {
    "id": 450,
    "name": "Marmagne-sous-Creusot",
    "sncf_id": "87694182",
    "lat": 46.833554,
    "lon": 4.359587
  },
  {
    "id": 451,
    "name": "St-Pol-sur-Ternoise",
    "sncf_id": "87342337",
    "lat": 50.378551,
    "lon": 2.341362
  },
  {
    "id": 452,
    "name": "Toul",
    "sncf_id": "87141044",
    "lat": 48.678414,
    "lon": 5.877058
  },
  {
    "id": 453,
    "name": "Aiserey",
    "sncf_id": "87713636",
    "lat": 47.170742,
    "lon": 5.157577
  },
  {
    "id": 454,
    "name": "Longuerue-Vieux-Manoir",
    "sncf_id": "87411447",
    "lat": 49.557445,
    "lon": 1.277306
  },
  {
    "id": 455,
    "name": "Lisle-sur-Tarn",
    "sncf_id": "87615310",
    "lat": 43.857843,
    "lon": 1.809087
  },
  {
    "id": 456,
    "name": "Ay",
    "sncf_id": "87171561",
    "lat": 49.048687,
    "lon": 4.001621
  },
  {
    "id": 457,
    "name": "Nouvion-sur-Meuse",
    "sncf_id": "87172213",
    "lat": 49.697104,
    "lon": 4.795019
  },
  {
    "id": 458,
    "name": "Conflans-Jarny",
    "sncf_id": "87192666",
    "lat": 49.166516,
    "lon": 5.86798
  },
  {
    "id": 459,
    "name": "Châbons",
    "sncf_id": "87747212",
    "lat": 45.438153,
    "lon": 5.428038
  },
  {
    "id": 460,
    "name": "Saillat-Chassenon",
    "sncf_id": "87592717",
    "lat": 45.86954,
    "lon": 0.811742
  },
  {
    "id": 461,
    "name": "Cransac",
    "sncf_id": "87613232",
    "lat": 44.522937,
    "lon": 2.271752
  },
  {
    "id": 462,
    "name": "Mommenheim",
    "sncf_id": "87212142",
    "lat": 48.755671,
    "lon": 7.642508
  },
  {
    "id": 463,
    "name": "Loches",
    "sncf_id": "87571471",
    "lat": 47.130402,
    "lon": 1.000979
  },
  {
    "id": 464,
    "name": "Bersac",
    "sncf_id": "87592352",
    "lat": 46.084606,
    "lon": 1.432222
  },
  {
    "id": 465,
    "name": "Pont-d'Ain",
    "sncf_id": "87743120",
    "lat": 46.05391,
    "lon": 5.334197
  },
  {
    "id": 466,
    "name": "Barenton-Bugny",
    "sncf_id": "87297291",
    "lat": 49.630584,
    "lon": 3.655934
  },
  {
    "id": 467,
    "name": "Chevillon",
    "sncf_id": "87175117",
    "lat": 48.524136,
    "lon": 5.111915
  },
  {
    "id": 468,
    "name": "La Vavrette-Tossiat",
    "sncf_id": "87743104",
    "lat": 46.13269,
    "lon": 5.287539
  },
  {
    "id": 469,
    "name": "Stephansfeld",
    "sncf_id": "87212126",
    "lat": 48.718322,
    "lon": 7.704317
  },
  {
    "id": 470,
    "name": "Compiègne",
    "sncf_id": "87276691",
    "lat": 49.42224,
    "lon": 2.823572
  },
  {
    "id": 471,
    "name": "Sète",
    "sncf_id": "87773200",
    "lat": 43.412799,
    "lon": 3.696609
  },
  {
    "id": 472,
    "name": "Mouchard",
    "sncf_id": "87718833",
    "lat": 46.976685,
    "lon": 5.800652
  },
  {
    "id": 473,
    "name": "Mont-de-Terre",
    "sncf_id": "87287128",
    "lat": 50.617475,
    "lon": 3.096843
  },
  {
    "id": 474,
    "name": "Cuers-Pierrefeu",
    "sncf_id": "87755355",
    "lat": 43.236689,
    "lon": 6.085797
  },
  {
    "id": 475,
    "name": "Lingolsheim",
    "sncf_id": "87214502",
    "lat": 48.559387,
    "lon": 7.678357
  },
  {
    "id": 476,
    "name": "Fleurance",
    "sncf_id": "87586339",
    "lat": 43.852371,
    "lon": 0.656386
  },
  {
    "id": 477,
    "name": "Danjoutin",
    "sncf_id": "87700146",
    "lat": 47.617458,
    "lon": 6.869075
  },
  {
    "id": 478,
    "name": "Tarbes",
    "sncf_id": "87671008",
    "lat": 43.240314,
    "lon": 0.068299
  },
  {
    "id": 479,
    "name": "Calonne-Ricouart",
    "sncf_id": "87342543",
    "lat": 50.482748,
    "lon": 2.481385
  },
  {
    "id": 480,
    "name": "Marseille-St-Charles",
    "sncf_id": "87751008",
    "lat": 43.311136,
    "lon": 5.373129
  },
  {
    "id": 481,
    "name": "Vittel",
    "sncf_id": "87144279",
    "lat": 48.202635,
    "lon": 5.942242
  },
  {
    "id": 482,
    "name": "Virieu-le-Grand-Belley",
    "sncf_id": "87741504",
    "lat": 45.849242,
    "lon": 5.654726
  },
  {
    "id": 483,
    "name": "St-Sulpice-Auteuil",
    "sncf_id": "87313684",
    "lat": 49.346681,
    "lon": 2.116367
  },
  {
    "id": 484,
    "name": "Montdidier",
    "sncf_id": "87313346",
    "lat": 49.641782,
    "lon": 2.563895
  },
  {
    "id": 485,
    "name": "La Tour-du-Pin",
    "sncf_id": "87723478",
    "lat": 45.560099,
    "lon": 5.449808
  },
  {
    "id": 486,
    "name": "Pont-de-Briques",
    "sncf_id": "87317115",
    "lat": 50.680973,
    "lon": 1.630646
  },
  {
    "id": 487,
    "name": "Meyrargues",
    "sncf_id": "87751370",
    "lat": 43.64408,
    "lon": 5.539284
  },
  {
    "id": 488,
    "name": "Krimmeri-Meinau",
    "sncf_id": "87338525",
    "lat": 48.563918,
    "lon": 7.75214
  },
  {
    "id": 489,
    "name": "Gien",
    "sncf_id": "87684290",
    "lat": 47.698879,
    "lon": 2.636757
  },
  {
    "id": 490,
    "name": "Vincelles",
    "sncf_id": "87683631",
    "lat": 47.704078,
    "lon": 3.62872
  },
  {
    "id": 491,
    "name": "Pont-de-la-Deûle",
    "sncf_id": "87345207",
    "lat": 50.398035,
    "lon": 3.084806
  },
  {
    "id": 492,
    "name": "Mézériat",
    "sncf_id": "87725838",
    "lat": 46.234974,
    "lon": 5.046701
  },
  {
    "id": 493,
    "name": "Rethel",
    "sncf_id": "87172270",
    "lat": 49.504652,
    "lon": 4.370293
  },
  {
    "id": 494,
    "name": "St-Martin-du-Touch",
    "sncf_id": "87353599",
    "lat": 43.59986,
    "lon": 1.371418
  },
  {
    "id": 495,
    "name": "Égletons",
    "sncf_id": "87594168",
    "lat": 45.402497,
    "lon": 2.064714
  },
  {
    "id": 496,
    "name": "Frouard",
    "sncf_id": "87141077",
    "lat": 48.756328,
    "lon": 6.14365
  },
  {
    "id": 497,
    "name": "Cantin",
    "sncf_id": "87345413",
    "lat": 50.312428,
    "lon": 3.121776
  },
  {
    "id": 498,
    "name": "Lure",
    "sncf_id": "87185249",
    "lat": 47.6829,
    "lon": 6.493729
  },
  {
    "id": 499,
    "name": "Châteauneuf-sur-Cher",
    "sncf_id": "87576298",
    "lat": 46.855767,
    "lon": 2.311632
  },
  {
    "id": 500,
    "name": "Le Mans",
    "sncf_id": "87396002",
    "lat": 47.994963,
    "lon": 0.193738
  }
];
